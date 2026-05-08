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
    
    const apiKey = request.headers['x-api-key'] as string;
    const nutritionistId = request.headers['x-nutritionist-id'] as string;
    const authHeader = request.headers['authorization'] as string;

    if (apiKey && nutritionistId) {
      return true;
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        if (decoded?.sub || decoded?.nutritionistId) {
          request.headers['x-nutritionist-id'] = decoded.sub || decoded.nutritionistId;
          request.headers['x-api-key'] = 'from-jwt';
          return true;
        }
      } catch (e) {
      }
    }

    throw new UnauthorizedException(
      'Se requiere X-Api-Key y X-Nutritionist-Id, o un JWT válido en Authorization'
    );
  }
}