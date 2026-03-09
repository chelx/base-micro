import { LoggerService, Injectable } from '@nestjs/common';
import * as pino from 'pino';

@Injectable()
export class BaseLogger implements LoggerService {
  private logger = pino.pino({
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true },
          }
        : undefined,
  });

  log(message: any, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: any, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: any, context?: string) {
    this.logger.trace({ context }, message);
  }
}
