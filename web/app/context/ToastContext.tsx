'use client';

import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

export interface ToastEntry {
  id: string;
  description: string;
  txHash?: string;
  status: 'pending' | 'success' | 'error';
}

interface ToastContextType {
  toasts: ToastEntry[];
  pushToast: (toast: Omit<ToastEntry, 'id'>) => string;
  updateToast: (id: string, patch: Partial<Omit<ToastEntry, 'id'>>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  pushToast: () => '',
  updateToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const pushToast = useCallback((toast: Omit<ToastEntry, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const updateToast = useCallback((id: string, patch: Partial<Omit<ToastEntry, 'id'>>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, updateToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToasts = () => useContext(ToastContext);
