import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { isStaffRole } from '../../permissions/permissions.constants';

const RUT_EXEMPT_PATHS = ['/auth/me', '/auth/me/rut', '/auth/logout'];

const isRutExemptPath = (pathname: string) =>
  RUT_EXEMPT_PATHS.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const canActivate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest<any>();

    if (isRutExemptPath(request.path || '')) {
      return canActivate;
    }

    const user = request.user;
    if (user && !isStaffRole(user.role) && !user.rut) {
      throw new ForbiddenException(
        'Debes completar tu RUT antes de usar la plataforma',
      );
    }

    return canActivate;
  }
}
