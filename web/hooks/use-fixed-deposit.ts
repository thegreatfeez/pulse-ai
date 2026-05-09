'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useToasts } from '@/app/context/ToastContext';
import {
  FIXED_VAULT_ADDRESS,
  getFixedVaultContract,
  getUsdcContract,
} from '@/lib/contracts';
import { MAX_UINT256, LOCK_DURATIONS } from '@/lib/constants';
import { parseContractError } from '@/lib/errors';
import { formatUsdc, lockSecondsToLabel } from '@/lib/format';

export type FixedDepositStep =
  | 'idle'
  | 'approving'
  | 'waiting_approve'
  | 'depositing'
  | 'waiting_deposit'
  | 'success'
  | 'error';

const VALID_LOCKS: bigint[] = [
  LOCK_DURATIONS.LOCK_30_DAYS,
  LOCK_DURATIONS.LOCK_60_DAYS,
  LOCK_DURATIONS.LOCK_90_DAYS,
];

export function useFixedDeposit() {
  const { signer, address } = useWallet();
  const { pushToast, updateToast } = useToasts();
  const [step, setStep] = useState<FixedDepositStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMessage(null);
    setTxHash(null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [address, reset]);

  const deposit = useCallback(
    async (amountRaw: bigint, lockSeconds: bigint) => {
      if (!signer || !address) return;
      setErrorMessage(null);

      if (!VALID_LOCKS.includes(lockSeconds)) {
        setErrorMessage('Invalid lock duration. Choose 30, 60, or 90 days.');
        setStep('error');
        return;
      }

      try {
        const usdc = getUsdcContract(signer);
        const allowance = (await usdc.allowance(address, FIXED_VAULT_ADDRESS)) as bigint;

        if (allowance < amountRaw) {
          setStep('approving');
          const approveTx = await usdc.approve(FIXED_VAULT_ADDRESS, MAX_UINT256);
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
        const vault = getFixedVaultContract(signer);
        const tx = await vault.deposit(amountRaw, lockSeconds);
        setTxHash(tx.hash);
        const toastId = pushToast({
          description: `Locking ${formatUsdc(amountRaw)} USDC for ${lockSecondsToLabel(lockSeconds)}...`,
          status: 'pending',
          txHash: tx.hash,
        });
        setStep('waiting_deposit');
        const receipt = await tx.wait();
        if (!receipt || receipt.status === 0) {
          updateToast(toastId, { status: 'error', description: 'Lock reverted' });
          throw new Error('Lock reverted');
        }
        updateToast(toastId, {
          status: 'success',
          description: `Locked ${formatUsdc(amountRaw)} USDC`,
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
    txHash,
    isPending: ['approving', 'waiting_approve', 'depositing', 'waiting_deposit'].includes(step),
    isSuccess: step === 'success',
  };
}
