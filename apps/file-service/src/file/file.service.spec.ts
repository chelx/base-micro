import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { FileMetadata } from './entities';

// Mock fs and crypto modules
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    readFileSync: jest.fn(() => Buffer.from('test file content')),
    createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
    unlinkSync: jest.fn(),
    existsSync: jest.fn(() => true),
  };
});

jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  return {
    ...actualCrypto,
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'abc123sha256checksum'),
    })),
  };
});

describe('FileService', () => {
  let service: FileService;
  let fileRepo: jest.Mocked<Partial<Repository<FileMetadata>>>;

  const mockFileMetadata: FileMetadata = {
    id: 'file-1',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    storagePath: '/uploads/abc123.pdf',
    checksum: 'abc123sha256checksum',
    uploadedBy: 'user-1',
    createdAt: new Date(),
  };

  const mockMulterFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '/uploads',
    filename: 'abc123.pdf',
    path: '/uploads/abc123.pdf',
    buffer: Buffer.from('test file content'),
    stream: null as any,
  } as any;

  beforeEach(async () => {
    fileRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: getRepositoryToken(FileMetadata), useValue: fileRepo },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  describe('upload', () => {
    it('should save file metadata with checksum', async () => {
      fileRepo.create.mockReturnValue(mockFileMetadata);
      fileRepo.save.mockResolvedValue(mockFileMetadata);

      const result = await service.upload(mockMulterFile, 'user-1');

      expect(result).toEqual(mockFileMetadata);
      expect(fileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          checksum: 'abc123sha256checksum',
        }),
      );
      expect(fileRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all files', async () => {
      fileRepo.find.mockResolvedValue([mockFileMetadata]);

      const result = await service.findAll();

      expect(result).toEqual([mockFileMetadata]);
    });
  });

  describe('findOne', () => {
    it('should return a file by id', async () => {
      fileRepo.findOne.mockResolvedValue(mockFileMetadata);

      const result = await service.findOne('file-1');

      expect(result).toEqual(mockFileMetadata);
    });

    it('should throw NotFoundException if file not found', async () => {
      fileRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFileStream', () => {
    it('should return metadata and stream for existing file', async () => {
      fileRepo.findOne.mockResolvedValue(mockFileMetadata);

      const result = await service.getFileStream('file-1');

      expect(result.metadata).toEqual(mockFileMetadata);
      expect(result.stream).toBeDefined();
    });

    it('should throw NotFoundException if file not in DB', async () => {
      fileRepo.findOne.mockResolvedValue(null);

      await expect(service.getFileStream('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete file from disk and database', async () => {
      fileRepo.findOne.mockResolvedValue(mockFileMetadata);
      fileRepo.remove.mockResolvedValue(mockFileMetadata);

      await service.remove('file-1');

      expect(fileRepo.remove).toHaveBeenCalledWith(mockFileMetadata);
    });

    it('should throw NotFoundException if file not found', async () => {
      fileRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('computeChecksum', () => {
    it('should compute SHA-256 checksum of a file', () => {
      const checksum = service.computeChecksum('/test/path');

      expect(checksum).toBe('abc123sha256checksum');
    });
  });

  describe('generateSignedUrl', () => {
    it('should generate a signed URL with correct format', () => {
      const url = service.generateSignedUrl('file-123', 3600);
      expect(url).toContain('/api/files/file-123/download?token=');
      expect(url).toContain('&expires=');
    });
  });

  describe('validateSignedUrl', () => {
    it('should return true for valid token and future expiry', () => {
      const expiresInSeconds = 3600;
      const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

      // Extract token from properly generated URL
      const url = service.generateSignedUrl('file-123', expiresInSeconds);
      const tokenMatch = url.match(/token=([a-f0-9]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';

      const isValid = service.validateSignedUrl('file-123', token, timestamp);
      expect(isValid).toBe(true);
    });

    it('should return false for expired timestamp', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 100;
      // The signature generation logic uses the `pastTimestamp`, so the signature is theoretically correct for that payload,
      // but the `validateSignedUrl` method checks `Date.now() / 1000 > expires` and should reject it anyway.
      const secret = 'default_secret';
      const payload = `file-123:${pastTimestamp}`;
      const signature = require('crypto')
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const isValid = service.validateSignedUrl(
        'file-123',
        signature,
        pastTimestamp,
      );
      expect(isValid).toBe(false);
    });

    it('should return false for invalid token', () => {
      const timestamp = Math.floor(Date.now() / 1000) + 3600;
      const isValid = service.validateSignedUrl(
        'file-123',
        'invalid-token',
        timestamp,
      );
      expect(isValid).toBe(false);
    });
  });
});
