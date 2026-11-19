import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

const SENSITIVE_PATTERNS = [
  /prisma/i,
  /database/i,
  /connection/i,
  /syntax error/i,
  /foreign key/i,
  /unique constraint/i,
  /column/i,
  /table/i,
  /relation/i,
  /[a-z]:\\[^ \n\r\t]+/i, // Windows paths
  /\/(?:home|usr|app|var|etc)\/[^ \n\r\t]+/i, // Unix paths
  /node_modules/i,
  /at\s+[\w.<>]+\s+\(/i, // Stack traces
];

function containsSensitiveInfo(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error interno en el servidor. Inténtalo más tarde.';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join('; ');
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
        if (typeof resObj.error === 'string') {
          errorType = resObj.error;
        }
      }

      // If it's a 500+ HttpException in production, mask it
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `[${request.method}] ${request.url} - ${status} Server Exception:`,
          exception.stack,
        );
        if (isProduction || containsSensitiveInfo(message)) {
          message = 'Ha ocurrido un error interno en el servidor. Inténtalo más tarde.';
        }
      } else {
        // For 4xx errors, ensure no database/file system details leaked
        if (containsSensitiveInfo(message)) {
          this.logger.warn(
            `[${request.method}] ${request.url} - Masked sensitive 4xx message: ${message}`,
          );
          message = 'La solicitud no pudo ser procesada. Verifica los datos enviados.';
        }
      }
    } else {
      // Non-HttpException (e.g. Prisma, TypeError, system errors)
      const err = exception as any;
      this.logger.error(
        `[${request.method}] ${request.url} - Unhandled Exception: ${err?.message || err}`,
        err?.stack,
      );

      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Ha ocurrido un error interno en el servidor. Inténtalo más tarde.';
      errorType = 'InternalServerError';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status >= 500 ? 'InternalServerError' : errorType,
      timestamp: new Date().toISOString(),
    });
  }
}
