'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useToasts } from '@/app/context/ToastContext';
import {
  FLEXIBLE_VAULT_ADDRESS,
  getFlexibleVaultContract,
  getUsdcContract,
} from '@/lib/contracts';
import { MAX_UINT256 } from '@/lib/constants';
import { parseContractError } from '@/lib/errors';
import { formatUsdc } from '@/lib/format';

export type FlexibleDepositStep =
  | 'idle'
  | 'approving'
  | 'waiting_approve'
  | 'depositing'
  | 'waiting_deposit'
  | 'success'
  | 'error';

export function useFlexibleDeposit() {
  const { signer, address } = useWallet();
  const { pushToast, updateToast } = useToasts();
  const [step, setStep] = useState<FlexibleDepositStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMessage(null);
    setDepositTxHash(null);
  }, []);

  useEffect(() => {
    // Reset on address change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [address, reset]);

  const deposit = useCallback(
    async (amountRaw: bigint) => {
      if (!signer || !address) return;
      setErrorMessage(null);

      try {
        const usdc = getUsdcContract(signer);
        const allowance = (await usdc.allowance(address, FLEXIBLE_VAULT_ADDRESS)) as bigint;

        if (allowance < amountRaw) {
          setStep('approving');
          const approveTx = await usdc.approve(FLEXIBLE_VAULT_ADDRESS, MAX_UINT256);
          const toastId = pushToast({ description: 'Approving USDC...', status: 'pending', txHash: approveTx.hash });
          setStep('waiting_approve');
          const approveReceipt = await approveTx.wait();
          if (!approveReceipt || approveReceipt.status === 0) {
            updateToast(toastId, { status: 'error', description: 'Approval reverted' });
            throw new Error('Approval reverted');
          }
          updateToast(toastId, { status: 'success', description: 'USDC approved' });
        }

        setStep('depositing');
        const vault = getFlexibleVaultContract(signer);
        const depositTx = await vault.deposit(amountRaw, address);
        setDepositTxHash(depositTx.hash);
        const toastId = pushToast({
          description: `Depositing ${formatUsdc(amountRaw)} USDC...`,
          status: 'pending',
          txHash: depositTx.hash,
        });
        setStep('waiting_deposit');
        const receipt = await depositTx.wait();
        if (!receipt || receipt.status === 0) {
          updateToast(toastId, { status: 'error', description: 'Deposit reverted' });
          throw new Error('Deposit reverted');
        }
        updateToast(toastId, {
          status: 'success',
          description: `Deposited ${formatUsdc(amountRaw)} USDC`,
        });
        setStep('success');
      } catch (err) {
        setErrorMessage(parseContractError(err));
        setStep('error');
      }
    },
    [signer, address, pushToast, updateToast],
  );

  return {
    deposit,
    reset,
    step,
    errorMessage,
    depositTxHash,
    isPending: ['approving', 'waiting_approve', 'depositing', 'waiting_deposit'].includes(step),
    isSuccess: step === 'success',
  };
}
