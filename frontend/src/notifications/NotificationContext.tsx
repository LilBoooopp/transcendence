import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Toast, NotificationPayload } from './types';
import { ToastContainer } from './ToastContainer';

interface NotificationContextValue {
  /** Push a new toast notification */
  push: (payload: NotificationPayload) => void;
  /** Dismiss a toast immediately by id */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
  /** Current toasts (read-only for testing) */
  toasts: Toast[];
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Constants

const DEFAULT_DURATION = 3000;
const EXIT_ANIMATION_MS = 400;


interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const nextId = useRef(0);
  const makeId = () => `toast-${Date.now()}-${nextId.current++}`;

  /**
   * Begin exit animation for a toast, then remove from state after CSS transition completes.
   */
  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Set exit flag
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  /**
   * push a new toast, if max is exceeded, the oldest toast is dismissed.
   */
  const push = useCallback(
    (payload: NotificationPayload) => {
      const id = makeId();
	    const duration = payload.duration ?? DEFAULT_DURATION;

      const toast: Toast = {
        ...payload,
        id,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        let next = [...prev, toast];
        const activeToasts = next.filter((t) => !t.exiting);
        const MAX_VISIBLE_TOASTS = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 4;
        if (activeToasts.length > MAX_VISIBLE_TOASTS) {
          const oldestActive = activeToasts[0];
          next = next.map(t => 
            t.id === oldestActive.id ? { ...t, exiting: true } : t
          );
          setTimeout(() => dismiss(oldestActive.id), 0);
        }
        return next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const dismissAll = useCallback(() => {
    // clear timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const value: NotificationContextValue = {
    push,
    dismiss,
    dismissAll,
    toasts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

// hook
export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotification must be used inside <NotificationProvider>',
    );
  }
  return (ctx);
}
