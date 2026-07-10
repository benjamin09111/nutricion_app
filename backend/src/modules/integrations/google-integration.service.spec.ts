import { createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { GoogleIntegrationService } from './google-integration.service';

describe('GoogleIntegrationService login security', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret-with-at-least-32-characters',
        OAUTH_STATE_SECRET: 'test-oauth-secret-with-at-least-32-chars',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        GOOGLE_AUTH_REDIRECT_URI: 'http://localhost:3001/auth/google/callback',
      };
      return values[key];
    }),
  };
  let service: GoogleIntegrationService;

  beforeEach(() => {
    service = new GoogleIntegrationService({} as any, config as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses PKCE and replaces an unsafe post-login destination', () => {
    const url = new URL(
      service.buildGoogleLoginUrl({
        next: 'javascript:alert(1)',
        browserBinding: 'browser-binding',
        codeChallenge: 'pkce-challenge',
      }),
    );
    const state = jwt.verify(
      url.searchParams.get('state') || '',
      'test-oauth-secret-with-at-least-32-chars',
    ) as any;

    expect(url.searchParams.get('code_challenge')).toBe('pkce-challenge');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.has('access_type')).toBe(false);
    expect(state.next).toBe('/dashboard');
  });

  it('rejects a callback not bound to the initiating browser', async () => {
    const url = new URL(
      service.buildGoogleLoginUrl({
        browserBinding: 'correct-binding',
        codeChallenge: 'pkce-challenge',
      }),
    );

    await expect(
      service.handleGoogleLoginCallback(
        'authorization-code',
        url.searchParams.get('state') || '',
        'wrong-binding',
        'code-verifier',
      ),
    ).rejects.toThrow('Estado de autenticación inválido');
  });

  it('sends the transaction PKCE verifier to Google', async () => {
    const browserBinding = 'browser-binding';
    const codeVerifier = 'code-verifier';
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const url = new URL(
      service.buildGoogleLoginUrl({
        next: '/dashboard/citas',
        browserBinding,
        codeChallenge,
      }),
    );
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'google-access-token' }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-sub',
          email: 'nutri@nutrinet.cl',
          email_verified: true,
        }),
      } as any);

    const result = await service.handleGoogleLoginCallback(
      'authorization-code',
      url.searchParams.get('state') || '',
      browserBinding,
      codeVerifier,
    );

    const tokenRequest = fetchMock.mock.calls[0][1];
    expect(String(tokenRequest?.body)).toContain('code_verifier=code-verifier');
    expect(result.next).toBe('/dashboard/citas');
  });
});
