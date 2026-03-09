import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileMetadata } from './entities';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileMetadata])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
