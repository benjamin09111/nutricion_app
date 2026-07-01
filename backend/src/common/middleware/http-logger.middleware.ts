import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const redactSensitiveParts = (value: string) =>
  value.replace(
    /([?&](?:token|code|access_token|auth_token)=)[^&]+/gi,
    '$1[REDACTED]',
  );

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const safeUrl = redactSensitiveParts(originalUrl);

      this.logger.log(
        `${method} ${safeUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
