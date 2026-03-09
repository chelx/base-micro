import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from './file.service';
import { SignedUrlGuard } from './guards/signed-url.guard';

const STORAGE_PATH = process.env['FILE_STORAGE_PATH'] || './uploads';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: STORAGE_PATH,
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadedBy: { type: 'string', description: 'User ID of the uploader' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async upload(
    @UploadedFile() file: any,
    @Body('uploadedBy') uploadedBy?: string,
  ) {
    return this.fileService.upload(file, uploadedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files metadata' })
  @ApiResponse({ status: 200, description: 'List of files retrieved' })
  findAll() {
    return this.fileService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'File found' })
  @ApiResponse({ status: 404, description: 'File not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.findOne(id);
  }

  @Get(':id/generate-url')
  @ApiOperation({ summary: 'Generate a signed download URL' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  generateUrl(@Param('id', ParseUUIDPipe) id: string) {
    const url = this.fileService.generateSignedUrl(id);
    return { url };
  }

  @Get(':id/download')
  @UseGuards(SignedUrlGuard)
  @ApiOperation({ summary: 'Download a file using a signed URL' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { metadata, stream } = await this.fileService.getFileStream(id);

    res.set({
      'Content-Type': metadata.mimeType,
      'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
    });

    stream.pipe(res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.remove(id);
  }
}
