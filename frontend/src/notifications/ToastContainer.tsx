import React from 'react';
import { Toast as ToastType } from './types';
import { Toast } from './Toast';

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

/**
 * toastconainer
 *
 * renders in the topright. slides in from the right and stacks vertically.
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return (null);

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            animationDelay: `${index * 50}ms`,
            animation: toast.exiting
              ? undefined
              : 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
