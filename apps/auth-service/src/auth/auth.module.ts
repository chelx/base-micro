import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { VneidService } from './vneid.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenModule } from '../token/token.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TokenModule,
    SessionModule,
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(
            __dirname,
            process.env.NODE_ENV === 'production'
              ? './proto/user.proto'
              : '../proto/user.proto',
          ),
          url: process.env.USER_SERVICE_GRPC_URL || 'localhost:50052',
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, VneidService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
