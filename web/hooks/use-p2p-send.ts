'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useToasts } from '@/app/context/ToastContext';
import {
  P2P_TRANSFER_ADDRESS,
  getP2PTransferContract,
  getUsdcContract,
} from '@/lib/contracts';
import { MAX_UINT256 } from '@/lib/constants';
import { parseContractError } from '@/lib/errors';
import { formatUsdc, validateMemo, isAddressLike } from '@/lib/format';

export type SendStep =
  | 'idle'
  | 'approving'
  | 'waiting_approve'
  | 'sending'
  | 'waiting_send'
  | 'success'
  | 'error';

export function useP2PSend() {
  const { signer, address } = useWallet();
  const { pushToast, updateToast } = useToasts();
  const [step, setStep] = useState<SendStep>('idle');
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

  const validate = useCallback(
    (to: string, amountRaw: bigint, memo: string): string | null => {
      if (!isAddressLike(to)) return 'Invalid recipient address.';
      if (to.toLowerCase() === address?.toLowerCase()) return 'Cannot send USDC to yourself.';
      if (amountRaw === 0n) return 'Amount must be greater than 0.';
      return validateMemo(memo);
    },
    [address],
  );

  const send = useCallback(
    async (to: string, amountRaw: bigint, memo: string) => {
      if (!signer || !address) return;
      setErrorMessage(null);

      const validationError = validate(to, amountRaw, memo);
      if (validationError) {
        setErrorMessage(validationError);
        setStep('error');
        return;
      }

      try {
        const usdc = getUsdcContract(signer);
        const allowance = (await usdc.allowance(address, P2P_TRANSFER_ADDRESS)) as bigint;

        if (allowance < amountRaw) {
          setStep('approving');
          const approveTx = await usdc.approve(P2P_TRANSFER_ADDRESS, MAX_UINT256);
          const toastId = pushToast({ description: 'Approving USDC...', status: 'pending', txHash: approveTx.hash });
          setStep('waiting_approve');
          const approveReceipt = await approveTx.wait();
          if (!approveReceipt || approveReceipt.status === 0) {
            updateToast(toastId, { status: 'error', description: 'Approval reverted' });
            throw new Error('Approval reverted');
          }
          updateToast(toastId, { status: 'success', description: 'USDC approved' });
        }

        setStep('sending');
        const p2p = getP2PTransferContract(signer);
        const tx = await p2p.send(to, amountRaw, memo);
        setTxHash(tx.hash);
        const toastId = pushToast({
          description: `Sending ${formatUsdc(amountRaw)} USDC...`,
          status: 'pending',
          txHash: tx.hash,
        });
        setStep('waiting_send');
        const receipt = await tx.wait();
        if (!receipt || receipt.status === 0) {
          updateToast(toastId, { status: 'error', description: 'Send reverted' });
          throw new Error('Send reverted');
        }
        updateToast(toastId, {
          status: 'success',
          description: `Sent ${formatUsdc(amountRaw)} USDC`,
        });
        setStep('success');
      } catch (err) {
        setErrorMessage(parseContractError(err));
        setStep('error');
      }
    },
    [signer, address, pushToast, updateToast, validate],
  );

  return {
    send,
    reset,
    validate,
    step,
    errorMessage,
    txHash,
    isPending: ['approving', 'waiting_approve', 'sending', 'waiting_send'].includes(step),
    isSuccess: step === 'success',
  };
}
