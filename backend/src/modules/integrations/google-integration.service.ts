import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

type GoogleMode = 'login' | 'calendar';

type GoogleState = {
  mode: GoogleMode;
  next?: string;
  accountId?: string;
  nutritionistId?: string;
  calendarId?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

type GoogleTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

type GoogleCalendarConnectionRecord = Prisma.GoogleCalendarConnectionGetPayload<{}>;

type GoogleBusyRange = {
  start: Date;
  end: Date;
};

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_EVENTS_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
const REQUIRED_GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

@Injectable()
export class GoogleIntegrationService {
  private readonly logger = new Logger(GoogleIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getFrontendUrl() {
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_FRONTEND_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private getAppSecret() {
    return this.configService.get<string>('JWT_SECRET') || 'secret';
  }

  private getGoogleClientId() {
    return this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
  }

  private getGoogleClientSecret() {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
  }

  private getGoogleAuthRedirectUri() {
    return (
      this.configService.get<string>('GOOGLE_AUTH_REDIRECT_URI') ||
      'http://localhost:3001/auth/google/callback'
    );
  }

  private getGoogleCalendarRedirectUri() {
    return (
      this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URI') ||
      'http://localhost:3001/calendars/google/callback'
    );
  }

  private getEncryptionKey() {
    return createHash('sha256')
      .update(
        this.configService.get<string>('GOOGLE_TOKEN_ENCRYPTION_KEY') ||
          this.getAppSecret(),
      )
      .digest();
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decrypt(value: string) {
    const [ivPart, tagPart, dataPart] = value.split('.');
    if (!ivPart || !tagPart || !dataPart) {
      throw new BadRequestException('Token Google inválido');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(ivPart, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private parseScopes(scope?: string | null) {
    return new Set(
      (scope || '')
        .split(' ')
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }

  private hasRequiredCalendarScopes(scope?: string | null) {
    const scopes = this.parseScopes(scope);
    return REQUIRED_GOOGLE_CALENDAR_SCOPES.every((required) => scopes.has(required));
  }

  private async invalidateCalendarConnection(accountId: string, reason: string) {
    this.logger.warn(`Invalidating Google Calendar connection for account ${accountId}: ${reason}`);
    await this.prisma.googleCalendarConnection.deleteMany({
      where: { accountId },
    });
  }

  private async revokeGoogleToken(token: string) {
    const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      this.logger.warn(`Google token revocation returned ${response.status}: ${raw || 'no body'}`);
    }
  }

  private signState(state: GoogleState) {
    return jwt.sign(state, this.getAppSecret(), { expiresIn: '10m' });
  }

  private verifyState(token: string) {
    return jwt.verify(token, this.getAppSecret()) as GoogleState;
  }

  private buildGoogleAuthUrl(params: {
    state: GoogleState;
    redirectUri: string;
    scopes: string[];
  }) {
    const query = new URLSearchParams({
      client_id: this.getGoogleClientId(),
      redirect_uri: params.redirectUri,
      response_type: 'code',
      scope: params.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: this.signState(params.state),
    });

    return `${GOOGLE_AUTH_BASE}?${query.toString()}`;
  }

  async buildGoogleLoginUrl(next = '/dashboard') {
    return this.buildGoogleAuthUrl({
      state: { mode: 'login', next },
      redirectUri: this.getGoogleAuthRedirectUri(),
      scopes: ['openid', 'email', 'profile'],
    });
  }

  async buildGoogleCalendarConnectUrl(input: {
    accountId: string;
    nutritionistId: string;
    calendarId: string;
    next?: string;
  }) {
    return this.buildGoogleAuthUrl({
      state: {
        mode: 'calendar',
        accountId: input.accountId,
        nutritionistId: input.nutritionistId,
        calendarId: input.calendarId,
        next: input.next || '/dashboard/citas',
      },
      redirectUri: this.getGoogleCalendarRedirectUri(),
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
    });
  }

  async exchangeCodeForProfile(code: string, redirectUri: string) {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.getGoogleClientId(),
        client_secret: this.getGoogleClientSecret(),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const payload = await tokenResponse.text().catch(() => '');
      throw new BadRequestException(
        payload || 'No se pudo completar la autenticación con Google',
      );
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenPayload;
    if (!tokens.access_token) {
      throw new BadRequestException('Google no devolvió un access token válido');
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new BadRequestException('No se pudo leer el perfil de Google');
    }

    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profile.email || !profile.email_verified) {
      throw new BadRequestException(
        'Google no devolvió un correo verificado para la cuenta',
      );
    }

    return { profile, tokens };
  }

  async handleGoogleLoginCallback(code: string, stateToken: string) {
    const state = this.verifyState(stateToken);
    if (state.mode !== 'login') {
      throw new BadRequestException('Estado de autenticación inválido');
    }

    const result = await this.exchangeCodeForProfile(
      code,
      this.getGoogleAuthRedirectUri(),
    );

    return {
      next: state.next || '/dashboard',
      profile: result.profile,
      tokens: result.tokens,
    };
  }

  async handleGoogleCalendarCallback(code: string, stateToken: string) {
    const state = this.verifyState(stateToken);
    if (state.mode !== 'calendar' || !state.accountId || !state.calendarId) {
      throw new BadRequestException('Estado de conexión inválido');
    }

    const result = await this.exchangeCodeForProfile(
      code,
      this.getGoogleCalendarRedirectUri(),
    );

    return {
      accountId: state.accountId,
      nutritionistId: state.nutritionistId,
      calendarId: state.calendarId,
      next: state.next || '/dashboard/citas',
      profile: result.profile,
      tokens: result.tokens,
    };
  }

  async upsertCalendarConnection(input: {
    accountId: string;
    profile: GoogleProfile;
    tokens: GoogleTokenPayload;
  }) {
    const existing = await this.prisma.googleCalendarConnection.findUnique({
      where: { accountId: input.accountId },
    });

    const refreshToken =
      input.tokens.refresh_token ||
      (existing?.refreshTokenEncrypted
        ? this.decrypt(existing.refreshTokenEncrypted)
        : null);

    if (!refreshToken) {
      throw new BadRequestException(
        'Google no devolvió refresh token. Vuelve a conectar y autoriza el acceso al calendario.',
      );
    }

    if (!this.hasRequiredCalendarScopes(input.tokens.scope)) {
      throw new BadRequestException(
        'Google no autorizó los permisos de calendario requeridos. Vuelve a conectar y acepta el acceso a Google Calendar.',
      );
    }

    const tokenExpiry = input.tokens.expires_in
      ? new Date(Date.now() + input.tokens.expires_in * 1000)
      : null;

    return this.prisma.googleCalendarConnection.upsert({
      where: { accountId: input.accountId },
      create: {
        accountId: input.accountId,
        googleEmail: input.profile.email,
        googleSub: input.profile.sub,
        accessTokenEncrypted: this.encrypt(input.tokens.access_token),
        refreshTokenEncrypted: this.encrypt(refreshToken),
        tokenExpiry,
        calendarId: 'primary',
        scope: input.tokens.scope || REQUIRED_GOOGLE_CALENDAR_SCOPES.join(' '),
      },
      update: {
        googleEmail: input.profile.email,
        googleSub: input.profile.sub,
        accessTokenEncrypted: this.encrypt(input.tokens.access_token),
        refreshTokenEncrypted: this.encrypt(refreshToken),
        tokenExpiry,
        calendarId: 'primary',
        scope: input.tokens.scope || REQUIRED_GOOGLE_CALENDAR_SCOPES.join(' '),
        disconnectedAt: null,
      },
    });
  }

  async getCalendarConnectionByAccountId(accountId: string) {
    return this.prisma.googleCalendarConnection.findUnique({
      where: { accountId },
    });
  }

  async getConnectionStatus(accountId: string) {
    const connection = await this.getCalendarConnectionByAccountId(accountId);
    const connectionScope = connection?.scope || null;

    if (connection && !connection.disconnectedAt && !this.hasRequiredCalendarScopes(connectionScope)) {
      await this.invalidateCalendarConnection(
        accountId,
        'missing required Google Calendar scopes',
      );
      return {
        connected: false,
        googleEmail: connection.googleEmail || null,
        calendarId: connection.calendarId || 'primary',
        scope: connectionScope,
        tokenExpiry: connection.tokenExpiry || null,
        disconnectedAt: new Date(),
        missingScopes: REQUIRED_GOOGLE_CALENDAR_SCOPES,
        requiresReconnect: true,
      };
    }

    return {
      connected: Boolean(connection && !connection.disconnectedAt),
      googleEmail: connection?.googleEmail || null,
      calendarId: connection?.calendarId || 'primary',
      scope: connectionScope,
      tokenExpiry: connection?.tokenExpiry || null,
      disconnectedAt: connection?.disconnectedAt || null,
      missingScopes:
        connection && !this.hasRequiredCalendarScopes(connectionScope)
          ? REQUIRED_GOOGLE_CALENDAR_SCOPES
          : [],
      requiresReconnect:
        Boolean(connection) &&
        !connection?.disconnectedAt &&
        !this.hasRequiredCalendarScopes(connectionScope),
    };
  }

  async disconnectCalendarConnection(accountId: string) {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { accountId },
    });

    if (connection) {
      const refreshToken = connection.refreshTokenEncrypted
        ? this.decrypt(connection.refreshTokenEncrypted)
        : null;
      const accessToken = connection.accessTokenEncrypted
        ? this.decrypt(connection.accessTokenEncrypted)
        : null;

      const tokenToRevoke = refreshToken || accessToken;
      if (tokenToRevoke) {
        await this.revokeGoogleToken(tokenToRevoke).catch((error) => {
          this.logger.warn(
            `Google token revocation failed for account ${accountId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }
    }

    await this.prisma.googleCalendarConnection.deleteMany({ where: { accountId } });

    return { success: true };
  }

  private async refreshAccessToken(connection: GoogleCalendarConnectionRecord) {
    if (!connection.refreshTokenEncrypted) {
      throw new BadRequestException('La conexión con Google no tiene refresh token');
    }

    const refreshToken = this.decrypt(connection.refreshTokenEncrypted);
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.getGoogleClientId(),
        client_secret: this.getGoogleClientSecret(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new BadRequestException('No se pudo renovar el token de Google');
    }

    const token = (await response.json()) as GoogleTokenPayload;
    if (!token.access_token) {
      throw new BadRequestException('Google no devolvió un access token válido');
    }

    const tokenExpiry = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : null;

    await this.prisma.googleCalendarConnection.update({
      where: { accountId: connection.accountId },
      data: {
        accessTokenEncrypted: this.encrypt(token.access_token),
        tokenExpiry,
        disconnectedAt: null,
        scope: token.scope || connection.scope,
      },
    });

    return token.access_token;
  }

  private async getValidAccessToken(connection: GoogleCalendarConnectionRecord) {
    const token = connection.accessTokenEncrypted
      ? this.decrypt(connection.accessTokenEncrypted)
      : null;

    if (!token) {
      return this.refreshAccessToken(connection);
    }

    if (connection.tokenExpiry && connection.tokenExpiry.getTime() <= Date.now() + 60_000) {
      return this.refreshAccessToken(connection);
    }

    return token;
  }

  async getBusyEventsForCalendar(calendarId: string, from: string, to: string) {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: calendarId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const accountId = calendar.nutritionist.account?.id;
    if (!accountId) {
      return [] as GoogleBusyRange[];
    }

    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { accountId },
    });

    if (!connection || connection.disconnectedAt) {
      return [] as GoogleBusyRange[];
    }

    if (!this.hasRequiredCalendarScopes(connection.scope)) {
      await this.invalidateCalendarConnection(
        accountId,
        'insufficient Google Calendar scopes while reading busy events',
      );
      return [] as GoogleBusyRange[];
    }

    const accessToken = await this.getValidAccessToken(connection);
    const params = new URLSearchParams({
      timeMin: from,
      timeMax: to,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
      showDeleted: 'false',
    });

    const response = await fetch(
      `${GOOGLE_EVENTS_BASE}/primary/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new BadRequestException('No se pudo leer Google Calendar');
    }

    const payload = (await response.json()) as {
      items?: Array<{
        status?: string;
        transparency?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };

    return (payload.items || [])
      .filter((item) => item.status !== 'cancelled' && item.transparency !== 'transparent')
      .map((item) => {
        const startIso = item.start?.dateTime || item.start?.date;
        const endIso = item.end?.dateTime || item.end?.date;
        return {
          start: new Date(startIso || from),
          end: new Date(endIso || to),
        };
      }) as GoogleBusyRange[];
  }

  async syncAppointmentToGoogle(input: {
    calendarId: string;
    appointment: {
      id: string;
      title: string | null;
      description: string | null;
      startTime: Date;
      endTime: Date;
      status: AppointmentStatus;
      patientName?: string | null;
      notes?: string | null;
      metadata?: Prisma.JsonValue | null;
      googleCalendarEventId?: string | null;
    };
    inviteEmail?: string | null;
    inviteName?: string | null;
    syncGoogleCalendar?: boolean;
  }) {
    if (input.syncGoogleCalendar === false) {
      return { synced: false };
    }

    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: input.calendarId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar?.nutritionist.account?.id) {
      return { synced: false };
    }

    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { accountId: calendar.nutritionist.account.id },
    });

    if (!connection || connection.disconnectedAt) {
      return { synced: false };
    }

    if (!this.hasRequiredCalendarScopes(connection.scope)) {
      await this.invalidateCalendarConnection(
        connection.accountId,
        'insufficient Google Calendar scopes while syncing appointment',
      );
      return { synced: false };
    }

    const accessToken = await this.getValidAccessToken(connection);
    const attendees = input.inviteEmail
      ? [
          {
            email: input.inviteEmail,
            displayName: input.inviteName || input.appointment.patientName || 'Paciente',
          },
        ]
      : undefined;

    const payload = {
      summary: input.appointment.title || 'Cita',
      description: [
        input.appointment.description,
        input.appointment.notes,
        input.inviteEmail ? `Email: ${input.inviteEmail}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      start: { dateTime: input.appointment.startTime.toISOString(), timeZone: calendar.timeZone },
      end: { dateTime: input.appointment.endTime.toISOString(), timeZone: calendar.timeZone },
      attendees,
      reminders: { useDefault: true },
    };

    const eventId = input.appointment.googleCalendarEventId || `nutri-${input.appointment.id}`;
    const baseUrl = `${GOOGLE_EVENTS_BASE}/primary/events`;
    const eventUrl = input.appointment.googleCalendarEventId
      ? `${baseUrl}/${encodeURIComponent(eventId)}`
      : baseUrl;
    const url = new URL(eventUrl);
    url.searchParams.set('sendUpdates', attendees ? 'all' : 'none');

    const response = await fetch(url.toString(), {
      method: input.appointment.googleCalendarEventId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
      }),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      this.logger.error(
        `Google Calendar sync failed for appointment ${input.appointment.id} (calendar ${input.calendarId}) with status ${response.status}: ${raw || 'No se pudo sincronizar con Google Calendar'}`,
      );
      if (
        response.status === 403 &&
        /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(raw)
      ) {
        await this.invalidateCalendarConnection(
          calendar.nutritionist.account.id,
          'Google rejected the token with insufficient permissions',
        );
      }
      await this.prisma.appointment.update({
        where: { id: input.appointment.id },
        data: {
          googleCalendarSyncError: raw || 'No se pudo sincronizar con Google Calendar',
        },
      });
      return { synced: false, error: raw };
    }

    const event = (await response.json()) as {
      id?: string;
      htmlLink?: string;
    };

    await this.prisma.appointment.update({
      where: { id: input.appointment.id },
      data: {
        googleCalendarEventId: event.id || eventId,
        googleCalendarHtmlLink: event.htmlLink || null,
        googleCalendarSyncedAt: new Date(),
        googleCalendarSyncError: null,
      },
    });

    this.logger.log(
      `Google Calendar sync completed for appointment ${input.appointment.id} (calendar ${input.calendarId}) -> event ${event.id || eventId}`,
    );

    return { synced: true, eventId: event.id || eventId, htmlLink: event.htmlLink || null };
  }

  async deleteAppointmentFromGoogle(input: {
    calendarId: string;
    appointmentId: string;
    googleCalendarEventId?: string | null;
  }) {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: input.calendarId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar?.nutritionist.account?.id || !input.googleCalendarEventId) {
      return { deleted: false };
    }

    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { accountId: calendar.nutritionist.account.id },
    });

    if (!connection || connection.disconnectedAt) {
      return { deleted: false };
    }

    if (!this.hasRequiredCalendarScopes(connection.scope)) {
      await this.invalidateCalendarConnection(
        connection.accountId,
        'insufficient Google Calendar scopes while deleting appointment',
      );
      return { deleted: false };
    }

    const accessToken = await this.getValidAccessToken(connection);
    const deleteUrl = new URL(
      `${GOOGLE_EVENTS_BASE}/primary/events/${encodeURIComponent(input.googleCalendarEventId)}`,
    );
    deleteUrl.searchParams.set('sendUpdates', 'all');

    const response = await fetch(
      deleteUrl.toString(),
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok && response.status !== 404) {
      const raw = await response.text().catch(() => '');
      await this.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          googleCalendarSyncError: raw || 'No se pudo cancelar en Google Calendar',
        },
      });
      return { deleted: false, error: raw };
    }

    await this.prisma.appointment.update({
      where: { id: input.appointmentId },
      data: {
        googleCalendarEventId: null,
        googleCalendarHtmlLink: null,
        googleCalendarSyncError: null,
        googleCalendarSyncedAt: new Date(),
      },
    });

    return { deleted: true };
  }

  async resyncAppointments(calendarId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        calendarId,
        status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED] },
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        patientName: true,
        notes: true,
        metadata: true,
        googleCalendarEventId: true,
      },
    });

    let synced = 0;
    let skipped = 0;

    for (const appointment of appointments) {
      const result = await this.syncAppointmentToGoogle({
        calendarId,
        appointment,
        syncGoogleCalendar: true,
        inviteEmail: null,
        inviteName: appointment.patientName || undefined,
      });

      if (result.synced) synced += 1;
      else skipped += 1;
    }

    return { synced, skipped };
  }
}
