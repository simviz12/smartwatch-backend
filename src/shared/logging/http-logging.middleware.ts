import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrivacyLogger } from './privacy-logger.service';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: PrivacyLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startTime;

      // Notice: req.body is NEVER passed or inspected. Only IDs, method, URL, status and latency.
      this.logger.log(
        `HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
        {
          method,
          path: originalUrl,
          statusCode,
          durationMs,
          clientIp: ip,
        },
      );
    });

    next();
  }
}
