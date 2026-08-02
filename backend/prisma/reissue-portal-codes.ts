import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
} from 'crypto';
import { promisify } from 'util';
import { MailService } from '../src/modules/mail/mail.service';
import { resolveRequiredUrl } from '../src/common/utils/runtime-url.util';

const prisma = new PrismaClient();
const mailService = new MailService();
const scrypt = promisify(scryptCallback);

async function hashAccessCode(code: string) {
  const salt = randomBytes(16);
  const digest = (await scrypt(code, salt, 64)) as Buffer;
  return `${salt.toString('base64')}:${digest.toString('base64')}`;
}

async function main() {
  const baseUrl = resolveRequiredUrl(
    process.env.PORTAL_BASE_URL,
    process.env.FRONTEND_URL,
    process.env.APP_URL,
  );
  const invitations = await prisma.patientPortalInvitation.findMany({
    where: {
      status: 'ACTIVE',
      revokedAt: null,
      blockedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      patient: { select: { fullName: true, email: true } },
      nutritionist: { select: { fullName: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  for (const invitation of invitations) {
    const recipientEmail = invitation.email || invitation.patient.email;
    if (!recipientEmail) {
      skipped += 1;
      continue;
    }

    const rawToken = randomBytes(32).toString('hex');
    const accessCode = randomInt(0, 100_000_000).toString().padStart(8, '0');
    await prisma.patientPortalInvitation.update({
      where: { id: invitation.id },
      data: {
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
        accessCodeHash: await hashAccessCode(accessCode),
        accessCodeSetAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await mailService.sendPatientPortalInvitationEmail({
      email: recipientEmail,
      patientName: invitation.patient.fullName,
      nutritionistName: invitation.nutritionist.fullName,
      shareUrl: `${baseUrl}/portal/${rawToken}`,
      expiresAt: invitation.expiresAt,
      accessCode: `${accessCode.slice(0, 4)}-${accessCode.slice(4)}`,
    });
    sent += 1;
  }

  console.log(
    `Portal codes reissued: ${sent} sent, ${skipped} skipped without email.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
