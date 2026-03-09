import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification-provider.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class PushAdapter implements NotificationProvider {
  private readonly logger = new Logger(PushAdapter.name);

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      this.logger.log(
        `Mock sending Push notification to ${payload.recipient}: ${payload.subject}`,
      );

      // Simulate network request to Firebase Cloud Messaging
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `push-${randomUUID()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Push error',
      };
    }
  }
}
