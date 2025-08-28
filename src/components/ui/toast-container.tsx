'use client';

import React from 'react';
import { Toast, ToastProps } from './toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full"
        >
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}