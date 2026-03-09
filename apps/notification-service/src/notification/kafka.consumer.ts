import { Controller, Logger } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './entities';
import { NotificationPayload } from './interfaces/notification-provider.interface';

export interface KafkaNotificationMessage {
  channel: NotificationChannel;
  payload: NotificationPayload;
}

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('notification.send')
  async handleNotificationSend(
    @Payload() message: KafkaNotificationMessage,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(
      `Received notification request for ${message.channel} via Kafka`,
    );

    try {
      await this.notificationService.sendNotification(
        message.channel,
        message.payload,
      );
      this.logger.log(
        `Successfully processed notification for ${message.payload.recipient}`,
      );
    } catch (error) {
      this.logger.error(`Error processing notification: ${error}`, error);
    }
  }
}
