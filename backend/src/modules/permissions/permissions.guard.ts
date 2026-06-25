import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { REQUIRED_FEATURES_KEY } from './permissions.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const accountId = request.user?.id || request.user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    for (const featureKey of requiredFeatures) {
      const hasAccess = await this.permissionsService.checkFeatureAccess(
        accountId,
        featureKey,
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          `Su plan actual no incluye la función: ${featureKey}`,
        );
      }
    }

    return true;
  }
}
