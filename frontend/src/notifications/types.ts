export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'game';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    route?: string;
  };
}

export interface Toast extends NotificationPayload {
  id: string;
  /** timestamp when the taost was created (for order) */
  createdAt: number;
  exiting?: boolean;
}
