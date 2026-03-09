import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthorizationModule, BaseLogger } from 'common';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { SessionModule } from '../session/session.module';
import { GrpcModule } from '../grpc/grpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthorizationModule,
    AuthModule,
    TokenModule,
    SessionModule,
    GrpcModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
