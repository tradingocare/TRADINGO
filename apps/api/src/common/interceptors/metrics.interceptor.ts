import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly requestCounter: Counter<string>;
  private readonly requestDuration: Histogram<string>;
  private readonly activeConnections: Gauge<string>;

  constructor(register: Registry) {
    this.requestCounter = new Counter({
      name: 'api_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'] as const,
      registers: [register],
    });

    this.requestDuration = new Histogram({
      name: 'api_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      registers: [register],
    });

    this.activeConnections = new Gauge({
      name: 'api_http_connections_active',
      help: 'Active HTTP connections',
      registers: [register],
    });
  }

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest();
    // Use route path from Fastify (template with params) to avoid unbounded cardinality from UUIDs
    const path = ((request.routeOptions?.url || request.url || '/unknown') as string).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    const method = (request.method || 'UNKNOWN') as string;

    this.activeConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const status = String(response.statusCode || 200);
          const duration = Date.now() - (request._startTime || Date.now());

          this.requestCounter.labels(method, path, status).inc();
          this.requestDuration.labels(method, path, status).observe(duration / 1000);
          this.activeConnections.dec();
        },
        error: (error) => {
          const status = String(error?.status || 500);
          const duration = Date.now() - (request._startTime || Date.now());

          this.requestCounter.labels(method, path, status).inc();
          this.requestDuration.labels(method, path, status).observe(duration / 1000);
          this.activeConnections.dec();
        },
      }),
    );
  }
}
