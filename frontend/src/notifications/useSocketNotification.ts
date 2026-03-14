import { useEffect, useRef } from 'react';
import { socketService } from '../services/socket.service';
import { useNotification } from './NotificationContext';
import { NotificationPayload } from './types';

/**
 * useSocketNotifications
 *
 * listens for `notification:push` events from the backedn and auto pushes them as toasts.
 * also listens for socket connection/disconnection events to show system-level toasts.
 */
export function useSocketNotification(): void {
  const { push } = useNotification();
  const pushRef = useRef(push);
  pushRef.current = push;

  // note if we've been connected before (to differentiate from reconnections)
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // backend pushed notifications
    const unsubNotification = socketService.on(
      'notification:push',
      (payload: NotificationPayload) => {
        pushRef.current(payload);
      },
    );

    const unsubConnect = socketService.on('connect', () => {
      if (hasConnectedRef.current) {
        // this is a re-connectiono not the initial connection
        pushRef.current({
          type: 'success',
          title: 'Connection Restored',
          message: 'You are back online.',
          duration: 3000,
        });
      }
      hasConnectedRef.current = true;
    });

    const unsubDisconnect = socketService.on('disconnect', (reason: string) => {
      // only show if the disconnect was unexpected
      if (reason !== 'io client disconnect') {
        pushRef.current({
          type: 'error',
          title: 'Disconnected',
          message: 'Connection lost. Attempting to reocnnect...',
          duration: 0, // stays until reocnnect
        });
      }
    });

    const unsubError = socketService.on('connect_error', () => {
      pushRef.current({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to reach the server. Check your connection.',
        duration: 6000,
      });
    });

    return () => {
      unsubNotification?.();
      unsubConnect?.();
      unsubDisconnect?.();
      unsubError?.();
    };
  }, []);
}
