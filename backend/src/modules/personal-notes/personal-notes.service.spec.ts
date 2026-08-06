import { PersonalNotesService } from './personal-notes.service';

describe('PersonalNotesService', () => {
  const createService = (limit: number, count = 0) => {
    const prisma = {
      personalNoteTab: {
        count: jest.fn().mockResolvedValue(count),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (transaction: any) => unknown) =>
        callback(prisma),
      ),
    } as any;
    const permissions = {
      getFeatureLimit: jest.fn().mockResolvedValue(limit),
    } as any;
    const config = {
      getOrThrow: jest.fn().mockReturnValue('a'.repeat(32)),
    } as any;

    return {
      service: new PersonalNotesService(prisma, permissions, config),
      prisma,
    };
  };

  it('rejects a second tab for Freemium without creating a row', async () => {
    const { service, prisma } = createService(1, 1);

    await expect(
      service.create('account-1', { title: 'Otra pestaña' }),
    ).rejects.toThrow('una sola pestaña');
    expect(prisma.personalNoteTab.create).not.toHaveBeenCalled();
  });

  it('checks the tab count inside a transaction for paid plans', async () => {
    const { service, prisma } = createService(10, 10);

    await expect(
      service.create('account-1', { title: 'Pestaña once' }),
    ).rejects.toThrow('hasta 10 pestañas');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
