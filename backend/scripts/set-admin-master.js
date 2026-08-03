const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'moralespizarrobenjamin763@gmail.com';
  console.log(`🔍 Buscando cuenta para ${email}...`);

  const account = await prisma.account.findUnique({
    where: { email },
  });

  if (!account) {
    console.error(`❌ No se encontró ninguna cuenta con el correo: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: {
      role: 'ADMIN_MASTER',
      status: 'ACTIVE',
      plan: 'PRO',
    },
  });

  console.log(`✅ Cuenta ${updated.email} actualizada a ADMIN_MASTER en producción:`);
  console.log(`   - ID: ${updated.id}`);
  console.log(`   - Rol: ${updated.role}`);
  console.log(`   - Estado: ${updated.status}`);
  console.log(`   - Plan: ${updated.plan}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error al actualizar cuenta:', err);
    process.exit(1);
  });
