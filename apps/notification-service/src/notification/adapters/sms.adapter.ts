import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification-provider.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class SmsAdapter implements NotificationProvider {
  private readonly logger = new Logger(SmsAdapter.name);

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      this.logger.log(
        `Mock sending SMS to ${payload.recipient}: ${payload.body}`,
      );

      // Simulate network request to SMS gateway (e.g., Twilio)
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `sms-${randomUUID()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
      };
    }
  }
}
