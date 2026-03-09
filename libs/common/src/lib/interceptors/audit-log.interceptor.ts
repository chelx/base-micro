import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { KafkaService } from '@base/kafka'; // Ensure correct path based on tsconfig

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly kafkaService: KafkaService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = request;

    // Only audit mutating requests (POST, PUT, PATCH, DELETE)
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAuditEvent(
            'SUCCESS',
            method,
            url,
            user,
            body,
            params,
            query,
            response,
            Date.now() - now,
          );
        },
        error: (error) => {
          this.logAuditEvent(
            'FAILURE',
            method,
            url,
            user,
            body,
            params,
            query,
            { message: error.message, status: error.status },
            Date.now() - now,
          );
        },
      }),
    );
  }

  private logAuditEvent(
    status: string,
    method: string,
    url: string,
    user: any,
    body: any,
    params: any,
    query: any,
    response: any,
    durationMs: number,
  ) {
    const auditEvent = {
      timestamp: new Date().toISOString(),
      action: method,
      entityName: this.extractEntity(url),
      userId: user?.id || 'system',
      status,
      durationMs,
      request: {
        body,
        params,
        query,
      },
      response,
    };

    // Fire and forget: send to Kafka asynchronously without waiting
    this.kafkaService.emit('system.audit.log', auditEvent);
    this.logger.debug(`Audit event queued for ${method} ${url}`);
  }

  // Very basic entity extraction: gets the base path as the entity name.
  // E.g., /users/123 -> users
  private extractEntity(url: string): string {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    return parts.length > 0 ? parts[0] : 'unknown';
  }
}
