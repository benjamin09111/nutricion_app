const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const freeEntitlements = {
  "patients.active.limit": 3,
  "patients.total.limit": 3,
  "consultations.saved.limit": 3,
  "consultations.monthly.limit": 3,
  "pdf.exports.total.limit": 3,
  "pdf.monthly.limit": 3,
  "followups.private.active.limit": 6,
  "ingredients.base_catalog.access": true,
  "clinical_calculator.limit": 0,
  "food_groups.total.limit": 1,
  "ai.operations.total.limit": 4,
  "ai.calls.limit": 4,
  "creations.save.limit": 3,
  "patients.edit.allowed": false,
  "creations.edit.allowed": false,
  "details.custom.create.allowed": false
};

const plusEntitlements = {
  "patients.active.limit": -1,
  "patients.total.limit": -1,
  "consultations.saved.limit": -1,
  "consultations.monthly.limit": -1,
  "pdf.exports.total.limit": -1,
  "pdf.monthly.limit": -1,
  "followups.private.active.limit": -1,
  "ingredients.base_catalog.access": true,
  "clinical_calculator.limit": -1,
  "food_groups.total.limit": -1,
  "ai.operations.total.limit": -1,
  "ai.calls.limit": -1,
  "creations.save.limit": -1,
  "patients.edit.allowed": true,
  "creations.edit.allowed": true,
  "details.custom.create.allowed": true
};

const plans = [
  {
    name: 'Freemium',
    slug: 'free',
    description: 'Ideal para nutricionistas que están conociendo y explorando Nutrinet.',
    price: 0,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ 3 pacientes totales',
      '✓ 3 consultas guardadas',
      '✓ 3 PDFs generados',
      '✓ 6 seguimientos privados activos',
      '✓ Base de ingredientes',
      'X Usar la calculadora clínica',
      '✓ 1 grupo de alimentos',
      '✓ 4 respuestas de IA',
      '✓ 3 creaciones guardadas',
      'X Editar información de pacientes',
      'X Editar creaciones guardadas',
      'X Crear Detalles personalizados',
    ],
    maxPatients: 4,
    isPopular: false,
    isActive: true,
    displayOrder: 1,
    entitlements: freeEntitlements,
  },
  {
    name: 'Plus',
    slug: 'plus',
    description: 'Plan completo para potenciar tu consulta profesional.',
    price: 19990,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ Pacientes ilimitados',
      '✓ Consultas ilimitadas',
      '✓ PDFs y planes ilimitados',
      '✓ Tabla de ingredientes',
    ],
    maxPatients: null,
    isPopular: true,
    isActive: true,
    displayOrder: 2,
    entitlements: plusEntitlements,
  },
];

async function sync() {
  console.log('🔄 Sincronizando planes de membresía en la base de datos de producción...');
  await prisma.membershipPlan.updateMany({
    where: { slug: 'pro' },
    data: { isActive: false },
  });
  for (const plan of plans) {
    const existing =
      (await prisma.membershipPlan.findUnique({ where: { slug: plan.slug } })) ||
      (await prisma.membershipPlan.findFirst({ where: { name: plan.name } }));

    if (existing) {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`✅ Plan '${plan.name}' (slug: ${plan.slug}, precio: $${plan.price}) actualizado.`);
    } else {
      await prisma.membershipPlan.create({ data: plan });
      console.log(`✅ Plan '${plan.name}' (slug: ${plan.slug}, precio: $${plan.price}) creado.`);
    }
  }
}

sync()
  .then(() => {
    console.log('🎉 Planes sincronizados exitosamente.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar planes:', err);
    process.exit(1);
  });
