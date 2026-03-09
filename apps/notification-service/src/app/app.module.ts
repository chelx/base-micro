import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule, AuthorizationModule, BaseLogger, createTypeOrmConfig } from 'common';
import { NotificationModule } from '../notification/notification.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from '@base/kafka';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthorizationModule,
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: process.env['DB_NAME'] || 'notification_service_db',
      }),
    ),
    NotificationModule,
    KafkaModule.register({
      clientId: 'notification-service-client',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      groupId: 'notification-service-group',
    }),
    DiscoveryModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
