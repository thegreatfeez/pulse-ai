'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useToasts } from '@/app/context/ToastContext';
import { getFixedVaultContract } from '@/lib/contracts';
import { parseContractError } from '@/lib/errors';

export type FixedWithdrawStep = 'idle' | 'withdrawing' | 'waiting' | 'success' | 'error';

export function useFixedWithdraw() {
  const { signer, address } = useWallet();
  const { pushToast, updateToast } = useToasts();
  const [step, setStep] = useState<FixedWithdrawStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMessage(null);
    setTxHash(null);
    setWithdrawingId(null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [address, reset]);

  const withdraw = useCallback(
    async (positionId: number) => {
      if (!signer) return;
      setErrorMessage(null);
      setWithdrawingId(positionId);

      try {
        setStep('withdrawing');
        const vault = getFixedVaultContract(signer);
        const tx = await vault.withdraw(BigInt(positionId));
        setTxHash(tx.hash);
        const toastId = pushToast({
          description: `Withdrawing fixed position #${positionId}...`,
          status: 'pending',
          txHash: tx.hash,
        });
        setStep('waiting');
        const receipt = await tx.wait();
        if (!receipt || receipt.status === 0) {
          updateToast(toastId, { status: 'error', description: 'Withdrawal reverted' });
          throw new Error('Withdrawal reverted');
        }
        updateToast(toastId, {
          status: 'success',
          description: `Position #${positionId} withdrawn`,
        });
        setStep('success');
      } catch (err) {
        setErrorMessage(parseContractError(err));
        setStep('error');
      } finally {
        setWithdrawingId(null);
      }
    },
    [signer, pushToast, updateToast],
  );

  return {
    withdraw,
    reset,
    step,
    errorMessage,
    txHash,
    withdrawingId,
    isPending: step === 'withdrawing' || step === 'waiting',
    isSuccess: step === 'success',
  };
}
