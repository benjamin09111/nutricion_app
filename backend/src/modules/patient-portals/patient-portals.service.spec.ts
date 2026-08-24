import { PatientPortalsService } from './patient-portals.service';

describe('PatientPortalsService access codes', () => {
  const buildService = () => {
    const prisma = {
      patientPortalInvitation: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new PatientPortalsService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    return { service, prisma };
  };

  it('issues an eight-digit code and stores only a salted hash', async () => {
    const { service, prisma } = buildService();

    const code = await (service as any).issueAccessCode('invitation-id');
    const storedHash = prisma.patientPortalInvitation.update.mock.calls[0][0]
      .data.accessCodeHash as string;

    expect(code).toMatch(/^\d{4}-\d{4}$/);
    expect(storedHash).toContain(':');
    expect(storedHash).not.toContain(code.replace('-', ''));
    expect(await (service as any).verifyAccessCode(storedHash, code)).toBe(
      true,
    );
    expect(
      await (service as any).verifyAccessCode(storedHash, '0000-0000'),
    ).toBe(false);
  });

  it('locks an invitation after the fifth failed attempt', async () => {
    const { service, prisma } = buildService();

    await (service as any).registerFailedAttempt('invitation-id', 4);

    const update = prisma.patientPortalInvitation.update.mock.calls[0][0];
    expect(update.data.failedAttempts).toEqual({ increment: 1 });
    expect(update.data.lockedUntil).toBeInstanceOf(Date);
    expect(update.data.blockedAt).toBeUndefined();
  });
});
