import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmConfig, DiscoveryModule, AuthorizationModule, BaseLogger } from 'common';
import { UserModule } from '../user/user.module';
import { GrpcModule } from '../grpc/grpc.module';
import { KafkaModule } from '@base/kafka';
import { PassportModule } from '@nestjs/passport'; // Force Nx to include in pruned package.json
import { JwtModule } from '@nestjs/jwt'; // Force Nx to include in pruned package.json

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: process.env['DB_NAME'] || 'user_service_db',
        synchronize: true, // Force sync for testing
      }),
    ),
    UserModule,
    GrpcModule,
    DiscoveryModule,
    AuthorizationModule,
    PassportModule,
    JwtModule,
    KafkaModule.register({
      clientId: 'user-service-client',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      groupId: 'user-service-group',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
