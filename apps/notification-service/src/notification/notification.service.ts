import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
} from './entities';
import { EmailAdapter } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { PushAdapter } from './adapters/push.adapter';
import { NotificationPayload } from './interfaces/notification-provider.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    private readonly emailAdapter: EmailAdapter,
    private readonly smsAdapter: SmsAdapter,
    private readonly pushAdapter: PushAdapter,
  ) {}

  async sendNotification(
    channel: NotificationChannel,
    payload: NotificationPayload,
  ): Promise<NotificationLog> {
    // 1. Create initial log entry
    let log = this.logRepository.create({
      channel,
      recipient: payload.recipient,
      subject: payload.subject,
      body: payload.body,
      status: NotificationStatus.PENDING,
    });
    log = await this.logRepository.save(log);

    // 2. Select adapter
    const adapter = this.getAdapter(channel);

    // 3. Attempt to send with retry logic
    log = await this.attemptSendWithRetry(adapter, payload, log);

    return log;
  }

  private getAdapter(channel: NotificationChannel) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailAdapter;
      case NotificationChannel.SMS:
        return this.smsAdapter;
      case NotificationChannel.PUSH:
        return this.pushAdapter;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async attemptSendWithRetry(
    adapter: any,
    payload: NotificationPayload,
    log: NotificationLog,
  ): Promise<NotificationLog> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await adapter.send(payload);

        if (result.success) {
          log.status = NotificationStatus.SENT;
          log.error = null;
          return await this.logRepository.save(log);
        } else {
          throw new Error(result.error || 'Unknown error from provider');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log.error = errorMessage;
        log.retryCount = attempt;

        if (attempt === this.MAX_RETRIES) {
          log.status = NotificationStatus.FAILED;
          this.logger.error(
            `Notification failed after ${this.MAX_RETRIES} attempts`,
            error,
          );
        } else {
          // Exponential backoff logic here (e.g., waiting before retry could go here, but for now we just loop or delay)
          const backoff = Math.pow(2, attempt) * 100;
          this.logger.warn(
            `Attempt ${attempt} failed. Retrying in ${backoff}ms...`,
          );
          await new Promise((res) => setTimeout(res, backoff));
        }
      }
    }
    return await this.logRepository.save(log);
  }
}
