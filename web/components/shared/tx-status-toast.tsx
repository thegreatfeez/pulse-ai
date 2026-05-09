'use client';

import { CheckCircle, ExternalLink, Loader2, X, XCircle } from 'lucide-react';
import { useToasts } from '@/app/context/ToastContext';
import { shortenAddress } from '@/lib/format';
import { BASESCAN_TX_BASE } from '@/lib/constants';

export function TxStatusToast() {
  const { toasts, dismissToast } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="tx-toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toast.status === 'pending' ? Loader2 : toast.status === 'success' ? CheckCircle : XCircle;
        return (
          <div className={`tx-toast tx-toast-${toast.status}`} key={toast.id}>
            <Icon
              className={toast.status === 'pending' ? 'tx-toast-spinner' : 'tx-toast-icon'}
              size={16}
            />
            <div className="tx-toast-body">
              <p>{toast.description}</p>
              {toast.txHash && (
                <a
                  href={`${BASESCAN_TX_BASE}${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortenAddress(toast.txHash)} <ExternalLink size={12} />
                </a>
              )}
            </div>
            <button
              type="button"
              className="tx-toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
