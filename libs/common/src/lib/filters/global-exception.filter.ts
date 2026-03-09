import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseResponseDTO, BusinessErrorCode } from 'interfaces';
import { BaseLogger } from '../logger/base-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: BaseLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Map common HTTP status codes to our BusinessErrorCode enum
    let errorCode = BusinessErrorCode.INTERNAL_SERVER_ERROR;
    if (status === HttpStatus.BAD_REQUEST)
      errorCode = BusinessErrorCode.BAD_REQUEST;
    if (status === HttpStatus.UNAUTHORIZED)
      errorCode = BusinessErrorCode.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN)
      errorCode = BusinessErrorCode.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND)
      errorCode = BusinessErrorCode.NOT_FOUND;

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
      'GlobalExceptionFilter',
    );

    const errorResponse: BaseResponseDTO = {
      statusCode: status,
      message,
      errorCode,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
