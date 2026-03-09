import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTypeOrmConfig } from 'common';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      createTypeOrmConfig({
        database: 'todo',
      }),
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
