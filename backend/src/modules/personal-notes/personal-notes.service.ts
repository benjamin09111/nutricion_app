import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { CreatePersonalNoteTabDto } from './dto/create-personal-note-tab.dto';
import { UpdatePersonalNoteTabDto } from './dto/update-personal-note-tab.dto';

const ABSOLUTE_TAB_LIMIT = 10;
const TAB_SELECT = {
  id: true,
  title: true,
  content: true,
  position: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PersonalNoteTabSelect;
type SelectedPersonalNoteTab = Prisma.PersonalNoteTabGetPayload<{
  select: typeof TAB_SELECT;
}>;

@Injectable()
export class PersonalNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(accountId: string) {
    const limit = await this.permissionsService.getFeatureLimit(
      accountId,
      PLAN_ENTITLEMENT_KEYS.PERSONAL_NOTES_TABS_LIMIT,
    );
    const firstOnlyEditable = limit <= 1;
    let tabs = await this.prisma.personalNoteTab.findMany({
      where: { accountId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: TAB_SELECT,
    });

    if (tabs.length > 0) {
      await this.encryptLegacyTabs(accountId, tabs);
      tabs = await this.prisma.personalNoteTab.findMany({
        where: { accountId },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: TAB_SELECT,
      });
    }

    if (tabs.length === 0) {
      const created = await this.prisma.personalNoteTab.create({
        data: {
          accountId,
          title: this.encrypt('Sin título'),
          content: this.encrypt(''),
        },
        select: TAB_SELECT,
      });
      tabs = [created];
    }

    return tabs.map((tab, index) => this.toResponse(tab, !firstOnlyEditable || index === 0));
  }

  async create(accountId: string, dto: CreatePersonalNoteTabDto) {
    const limit = await this.permissionsService.getFeatureLimit(
      accountId,
      PLAN_ENTITLEMENT_KEYS.PERSONAL_NOTES_TABS_LIMIT,
    );
    const effectiveLimit = Math.min(
      limit === Infinity ? ABSOLUTE_TAB_LIMIT : limit,
      ABSOLUTE_TAB_LIMIT,
    );

    try {
      const tab = await this.prisma.$transaction(
        async (transaction) => {
          const count = await transaction.personalNoteTab.count({
            where: { accountId },
          });
          if (count >= effectiveLimit) {
            throw new ForbiddenException(
              effectiveLimit === 1
                ? 'Tu plan actual permite una sola pestaña en Mis notas.'
                : `Tu plan actual permite hasta ${effectiveLimit} pestañas en Mis notas.`,
            );
          }

          const last = await transaction.personalNoteTab.findFirst({
            where: { accountId },
            orderBy: { position: 'desc' },
            select: { position: true },
          });

          return transaction.personalNoteTab.create({
            data: {
              accountId,
              title: this.encrypt(dto.title.trim()),
              content: this.encrypt(''),
              position: (last?.position ?? -1) + 1,
            },
            select: TAB_SELECT,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return this.toResponse(tab, true);
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('No se pudo crear la pestaña. Inténtalo nuevamente.');
      }
      throw error;
    }
  }

  async update(accountId: string, id: string, dto: UpdatePersonalNoteTabDto) {
    const tab = await this.prisma.personalNoteTab.findFirst({
      where: { id, accountId },
      select: TAB_SELECT,
    });
    if (!tab) throw new NotFoundException('Pestaña no encontrada.');

    const limit = await this.permissionsService.getFeatureLimit(
      accountId,
      PLAN_ENTITLEMENT_KEYS.PERSONAL_NOTES_TABS_LIMIT,
    );
    if (limit <= 1) {
      const firstTab = await this.getFirstTab(accountId);
      if (firstTab.id !== id) {
        throw new ForbiddenException(
          'Esta pestaña está disponible solo para lectura con tu plan actual.',
        );
      }
    }

    const updated = await this.prisma.personalNoteTab.updateMany({
      where: { id, accountId, version: dto.expectedVersion },
      data: {
        ...(dto.title !== undefined ? { title: this.encrypt(dto.title.trim()) } : {}),
        ...(dto.content !== undefined ? { content: this.encrypt(dto.content) } : {}),
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new ConflictException('La nota cambió en otro dispositivo. Recarga para continuar.');
    }

    let result = await this.prisma.personalNoteTab.findFirstOrThrow({
      where: { id, accountId },
      select: TAB_SELECT,
    });
    await this.encryptLegacyTabs(accountId, [result]);
    result = await this.prisma.personalNoteTab.findFirstOrThrow({
      where: { id, accountId },
      select: TAB_SELECT,
    });
    return this.toResponse(result, limit > 1 || (await this.getFirstTab(accountId)).id === id);
  }

  async remove(accountId: string, id: string) {
    const deleted = await this.prisma.personalNoteTab.deleteMany({
      where: { id, accountId },
    });
    if (deleted.count === 0) throw new NotFoundException('Pestaña no encontrada.');

    const first = await this.prisma.personalNoteTab.findFirst({
      where: { accountId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    if (!first) {
      await this.prisma.personalNoteTab.create({
        data: {
          accountId,
          title: this.encrypt('Sin título'),
          content: this.encrypt(''),
        },
      });
    }
    return { success: true };
  }

  private async getFirstTab(accountId: string) {
    const first = await this.prisma.personalNoteTab.findFirst({
      where: { accountId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    if (!first) throw new NotFoundException('No hay pestañas de notas.');
    return first;
  }

  private toResponse(tab: SelectedPersonalNoteTab, editable: boolean) {
    return {
      id: tab.id,
      title: this.decrypt(tab.title),
      content: this.decrypt(tab.content),
      position: tab.position,
      version: tab.version,
      createdAt: tab.createdAt,
      updatedAt: tab.updatedAt,
      editable,
    };
  }

  private async encryptLegacyTabs(
    accountId: string,
    tabs: SelectedPersonalNoteTab[],
  ) {
    const updates = tabs.flatMap((tab) => {
        const title = this.normalizeStoredValue(tab.title);
        const content = this.normalizeStoredValue(tab.content);
        if (title === undefined && content === undefined) return [];

        return [this.prisma.personalNoteTab.updateMany({
          where: { id: tab.id, accountId },
          data: {
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
          },
        })];
      });
    await Promise.all(updates);
  }

  private isEncrypted(value: string) {
    const parts = value.split('.');
    return parts.length === 3 && Boolean(parts[0] && parts[1]);
  }

  private normalizeStoredValue(value: string): string | undefined {
    if (!this.isEncrypted(value)) return this.encrypt(value);

    const decrypted = this.decrypt(value);
    // Earlier versions treated encrypted empty strings as plaintext and encrypted them again.
    return this.isEncrypted(decrypted) ? this.encrypt(this.decrypt(decrypted)) : undefined;
  }

  private getEncryptionKey() {
    return createHash('sha256')
      .update(this.configService.getOrThrow<string>('ENCRYPTION_KEY'))
      .digest();
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decrypt(value: string) {
    const [iv, tag, data] = value.split('.');
    if (!iv || !tag || data === undefined) throw new Error('Nota cifrada inválida.');
    const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
