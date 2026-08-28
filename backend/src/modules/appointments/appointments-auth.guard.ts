import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

/**
 * Autenticación del módulo de agenda.
 *
 * Reemplaza al antiguo `ApiKeyGuard`, que tenía dos agujeros graves:
 *
 *  1. Aceptaba `x-api-key: <APPOINTMENTS_API_KEY>` (un único secreto compartido,
 *     sin ámbito ni rotación) junto a un `x-nutritionist-id` arbitrario, lo que
 *     permitía operar la agenda de CUALQUIER nutricionista.
 *  2. Validaba el JWT con `jwt.verify` a secas: sin `issuer`/`audience`, sin
 *     fijar el algoritmo y sin releer `tokenVersion` ni `status` en la base de
 *     datos. Un token de una cuenta suspendida, borrada o con la sesión revocada
 *     seguía funcionando aquí aunque el resto de la aplicación ya lo rechazara.
 *
 * Ahora se usa el `AuthGuard` estándar (cookie httpOnly → `JwtStrategy`), que sí
 * comprueba todo eso en cada petición.
 */
@Injectable()
export class AppointmentsAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<any>();
    const path = (request.originalUrl || request.url || '').split('?')[0];

    // Google redirige el navegador aquí tras el consentimiento. La identidad
    // viaja firmada en el parámetro `state` (OAUTH_STATE_SECRET), que
    // `handleGoogleCalendarCallback` verifica, así que no requiere sesión.
    if (path === '/calendars/google/callback') {
      return true;
    }

    return super.canActivate(context);
  }
}
