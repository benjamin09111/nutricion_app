import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const { method, url, body, ip } = request;
        const userAgent = request.get('user-agent') || '';

        const now = Date.now();

        // Mask sensitive data in logs
        const maskedBody = this.maskSensitiveData(body);

        const userId = request.user ? `[User: ${request.user.id}]` : '[Guest]';

        return next
            .handle()
            .pipe(
                tap({
                    next: () => {
                        const delay = Date.now() - now;
                        this.logger.log(
                            `${method} ${url} ${userId} ${delay}ms - IP: ${ip}`,
                        );
                    },
                    error: (err) => {
                        const delay = Date.now() - now;
                        this.logger.error(
                            `${method} ${url} ${userId} ${delay}ms - IP: ${ip} - ERROR: ${err.message}`,
                        );
                    }
                }),
            );
    }

    private maskSensitiveData(data: any): any {
        if (!data || typeof data !== 'object') return data;

        // Deep copy to avoid mutating request object
        const copy = JSON.parse(JSON.stringify(data));

        const sensitiveKeys = ['password', 'token', 'access_token', 'creditCard', 'cvv', 'rut', 'documentId'];

        const mask = (obj: any) => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                        obj[key] = '*****';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        mask(obj[key]);
                    }
                }
            }
        };

        mask(copy);
        return copy;
    }
}
