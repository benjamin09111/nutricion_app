import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Garantiza que la petición tiene un `nutritionistId` real antes de entrar a un
 * controlador que aísla datos por nutricionista.
 *
 * SEGURIDAD — por qué existe: las cuentas de personal interno (ADMIN, WORKER…)
 * no tienen registro de nutricionista, así que `req.user.nutritionistId` es
 * `undefined`. Prisma **ignora en silencio** las claves `undefined` dentro de un
 * `where`, de modo que este filtro:
 *
 *     where: { id, nutritionistId }   // nutritionistId === undefined
 *
 * se convierte en `where: { id }` y devuelve —o borra— el recurso de cualquier
 * otro nutricionista. Un `403` temprano es mucho más fiable que recordar
 * comprobar la propiedad en cada uno de los servicios.
 *
 * Se aplica DESPUÉS de `AuthGuard`, que es quien rellena `req.user`.
 */
@Injectable()
export class NutritionistScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<any>().user;
    const nutritionistId = user?.nutritionistId;

    if (typeof nutritionistId !== 'string' || !nutritionistId) {
      throw new ForbiddenException(
        'Esta sección es exclusiva de cuentas de nutricionista con perfil activo.',
      );
    }

    return true;
  }
}
