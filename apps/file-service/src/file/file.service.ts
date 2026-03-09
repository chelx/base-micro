import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, createHmac } from 'crypto';
import { readFileSync, createReadStream, unlinkSync, existsSync } from 'fs';
import { ReadStream } from 'fs';
import { FileMetadata } from './entities';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileMetadata)
    private readonly fileRepository: Repository<FileMetadata>,
  ) {}

  async upload(file: any, uploadedBy?: string): Promise<FileMetadata> {
    const checksum = this.computeChecksum(file.path);

    const metadata = this.fileRepository.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: file.path,
      checksum,
      uploadedBy,
    });

    return this.fileRepository.save(metadata);
  }

  async findAll(): Promise<FileMetadata[]> {
    return this.fileRepository.find();
  }

  async findOne(id: string): Promise<FileMetadata> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with id "${id}" not found`);
    }
    return file;
  }

  async getFileStream(
    id: string,
  ): Promise<{ metadata: FileMetadata; stream: ReadStream }> {
    const metadata = await this.findOne(id);

    if (!existsSync(metadata.storagePath)) {
      throw new NotFoundException(
        `File not found on disk: ${metadata.storagePath}`,
      );
    }

    const stream = createReadStream(metadata.storagePath);
    return { metadata, stream };
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);

    // Remove physical file if it exists
    if (existsSync(file.storagePath)) {
      unlinkSync(file.storagePath);
    }

    await this.fileRepository.remove(file);
  }

  generateSignedUrl(fileId: string, expiresInSeconds: number = 3600): string {
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const secret = process.env['FILE_SECRET_KEY'] || 'default_secret';

    const payload = `${fileId}:${timestamp}`;
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return `/api/files/${fileId}/download?token=${signature}&expires=${timestamp}`;
  }

  validateSignedUrl(fileId: string, token: string, expires: number): boolean {
    if (Math.floor(Date.now() / 1000) > expires) {
      return false;
    }

    const secret = process.env['FILE_SECRET_KEY'] || 'default_secret';
    const payload = `${fileId}:${expires}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return token === expectedSignature;
  }

  computeChecksum(filePath: string): string {
    const fileBuffer = readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
}
