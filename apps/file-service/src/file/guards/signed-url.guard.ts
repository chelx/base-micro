import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FileService } from '../file.service';

@Injectable()
export class SignedUrlGuard implements CanActivate {
  constructor(private readonly fileService: FileService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const fileId = request.params['id'];
    const token = request.query['token'] as string;
    const expires = parseInt(request.query['expires'] as string, 10);

    if (!token || isNaN(expires)) {
      throw new UnauthorizedException(
        'Missing token or expiration in query parameters',
      );
    }

    const isValid = this.fileService.validateSignedUrl(fileId, token, expires);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired signed URL');
    }

    return true;
  }
}
