import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isStaffRole } from '../../permissions/permissions.constants';

/**
 * Guard that enforces patient data privacy.
 *
 * Only NUTRITIONIST accounts may access patient data. Admin and staff roles
 * are explicitly blocked to comply with data protection regulations
 * (Ley N° 21.719 — Chile) and the platform's privacy policy: only the
 * nutritionist in charge can read, manage, or act on their own patients.
 */
@Injectable()
export class PatientDataAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<any>().user;

    if (!user || isStaffRole(user.role)) {
      throw new ForbiddenException(
        'Los datos de pacientes son privados y de acceso exclusivo para el nutricionista a cargo. Cumplimiento Ley N° 21.719.',
      );
    }

    return true;
  }
}
