import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailAdapter } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { PushAdapter } from './adapters/push.adapter';
import { NotificationLog } from './entities';
import { NotificationConsumer } from './kafka.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService, EmailAdapter, SmsAdapter, PushAdapter],
  exports: [NotificationService],
})
export class NotificationModule {}
