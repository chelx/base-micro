import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './entities';
import { NotificationPayload } from './interfaces/notification-provider.interface';

class SendNotificationDto {
  @ApiProperty({
    enum: NotificationChannel,
    description: 'The channel to send the notification through',
    example: NotificationChannel.EMAIL,
  })
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Payload containing recipient and content details',
    example: { recipient: 'user@example.com', subject: 'Hello', body: 'World' },
  })
  payload: NotificationPayload;
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a multi-channel notification' })
  @ApiResponse({ status: 202, description: 'Notification processing initiated' })
  @ApiResponse({ status: 400, description: 'Invalid channel or payload' })
  async send(@Body() body: SendNotificationDto) {
    const log = await this.notificationService.sendNotification(
      body.channel,
      body.payload,
    );
    return {
      message: 'Notification processing initiated',
      logId: log.id,
      status: log.status,
    };
  }
}
