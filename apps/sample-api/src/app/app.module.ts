import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from '../todo/todo.module';
import { DiscoveryModule, AuthorizationModule, BaseLogger, createTypeOrmConfig } from 'common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from '@base/kafka';

@Module({
  imports: [
    AuthorizationModule,
    KafkaModule.register({
      clientId: 'sample-api-client',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      groupId: 'sample-api-group',
    }),
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: process.env['DB_NAME'] || 'sample_api_db',
        synchronize: true, // Force sync for demo/test purposes even in "production" container
      }),
    ),
    TodoModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
