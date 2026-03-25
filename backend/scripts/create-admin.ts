
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const hashedPassword = await bcrypt.hash('administrador', 10);
  
  try {
    const account = await prisma.account.upsert({
      where: { email: 'admin@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin account created/updated successfully:', account.email);
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
    console.error('Execution error:', err);
    process.exit(1);
});
