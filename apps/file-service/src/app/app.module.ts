import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmConfig, DiscoveryModule, AuthorizationModule, BaseLogger } from 'common';
import { FileModule } from '../file/file.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthorizationModule,
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: process.env['DB_NAME'] || 'file_service_db',
      }),
    ),
    FileModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService, BaseLogger],
})
export class AppModule { }
