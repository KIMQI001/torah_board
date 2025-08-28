'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'error', duration: 7000 });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'warning' });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'info' });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}