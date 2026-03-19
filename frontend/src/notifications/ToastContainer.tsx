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
  if (toasts.length === 0) return null;

  return (
    <div
			className="fixed bottom-4 left-4 sm:bottom-auto sm:top-4 z-[9999] flex flex-col-reverse sm:flex-col items-start pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`pointer-events-auto ${toast.exiting ? '' : 'animate-toast-enter'}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
