import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

/** Allows anonymous product events while still resolving the account cookie. */
@Injectable()
export class OptionalAuthGuard extends PassportAuthGuard('jwt') {
  async canActivate(context: any) {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  handleRequest<TUser = any>(_error: unknown, user: TUser) {
    return user || null;
  }
}
