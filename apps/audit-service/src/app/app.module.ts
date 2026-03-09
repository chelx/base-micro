import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule, AuthorizationModule, BaseLogger, createTypeOrmConfig } from 'common';
import { KafkaModule } from '@base/kafka';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthorizationModule,
    KafkaModule.register({
      clientId: 'audit-service-client',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      groupId: 'audit-service-group',
    }),
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: process.env.DB_NAME || 'audit_db',
      }),
    ),
    AuditModule,
    DiscoveryModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
