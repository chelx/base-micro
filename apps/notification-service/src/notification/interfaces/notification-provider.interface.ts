export interface NotificationPayload {
  recipient: string;
  subject?: string;
  body: string;
  meta?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
