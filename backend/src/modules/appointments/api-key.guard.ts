import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET || 'change_me_local';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = ((request as any).originalUrl || request.url || '').split(
      '?',
    )[0];

    if (path === '/calendars/google/callback') {
      return true;
    }

    const apiKey = request.headers['x-api-key'] as string;
    const nutritionistId = request.headers['x-nutritionist-id'] as string;
    const authHeader = request.headers['authorization'] as string;

    if (apiKey && nutritionistId) {
      return true;
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload & {
          nutritionistId?: string;
        };
        if (decoded?.sub || decoded?.nutritionistId) {
          const headers = request.headers as Record<
            string,
            string | string[] | undefined
          >;
          const nutritionistId =
            typeof decoded.sub === 'string'
              ? decoded.sub
              : decoded.nutritionistId;

          if (typeof nutritionistId !== 'string' || !nutritionistId) {
            return false;
          }

          headers['x-nutritionist-id'] = nutritionistId;
          headers['x-api-key'] = 'from-jwt';
          (request as any).user = {
            id: nutritionistId,
            nutritionistId,
          };
          return true;
        }
      } catch {
        // Invalid JWTs continue to the explicit header check.
      }
    }

    throw new UnauthorizedException(
      'Se requiere X-Api-Key y X-Nutritionist-Id, o un JWT válido en Authorization',
    );
  }
}
