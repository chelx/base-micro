import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class EmailAdapter implements NotificationProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailAdapter.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'localhost',
      port: parseInt(process.env['SMTP_PORT'] || '1025', 10),
      auth: {
        user: process.env['SMTP_USER'] || 'user',
        pass: process.env['SMTP_PASS'] || 'pass',
      },
    });
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env['SMTP_FROM'] || '"No Reply" <noreply@example.com>',
        to: payload.recipient,
        subject: payload.subject || 'Notification',
        text: payload.body,
        html: payload.body, // In a real app we would compile templates
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.recipient}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }
}
