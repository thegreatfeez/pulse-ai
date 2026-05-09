'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useToasts } from '@/app/context/ToastContext';
import { getFlexibleVaultContract } from '@/lib/contracts';
import { parseContractError } from '@/lib/errors';
import { formatUsdc } from '@/lib/format';

export type FlexibleWithdrawStep = 'idle' | 'withdrawing' | 'waiting' | 'success' | 'error';

export function useFlexibleWithdraw() {
  const { signer, address } = useWallet();
  const { pushToast, updateToast } = useToasts();
  const [step, setStep] = useState<FlexibleWithdrawStep>('idle');
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

  const withdraw = useCallback(
    async (amountRaw: bigint) => {
      if (!signer || !address) return;
      setErrorMessage(null);

      try {
        setStep('withdrawing');
        const vault = getFlexibleVaultContract(signer);
        const tx = await vault.withdraw(amountRaw, address, address);
        setTxHash(tx.hash);
        const toastId = pushToast({
          description: `Withdrawing ${formatUsdc(amountRaw)} USDC...`,
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
          description: `Withdrew ${formatUsdc(amountRaw)} USDC`,
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
    withdraw,
    reset,
    step,
    errorMessage,
    txHash,
    isPending: step === 'withdrawing' || step === 'waiting',
    isSuccess: step === 'success',
  };
}
