import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace, context } from '@opentelemetry/api';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(
    contextExecution: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = contextExecution.switchToHttp().getRequest();
    const res = contextExecution.switchToHttp().getResponse();

    const tracer = trace.getTracer('default');

    // Extract headers for distributed tracing context if propagated
    const activeContext = context.active();

    return new Observable((subscriber) => {
      tracer.startActiveSpan(
        `HTTP ${req.method} ${req.route?.path || req.path}`,
        {},
        activeContext,
        (span) => {
          span.setAttribute('http.method', req.method);
          span.setAttribute('http.url', req.url);

          res.on('finish', () => {
            span.setAttribute('http.status_code', res.statusCode);
            span.end();
          });

          const subscription = next.handle().subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => {
              span.recordException(err);
              span.setAttribute('http.status_code', err.status || 500);
              span.end();
              subscriber.error(err);
            },
            complete: () => subscriber.complete(),
          });

          return () => {
            subscription.unsubscribe();
          };
        },
      );
    });
  }
}
