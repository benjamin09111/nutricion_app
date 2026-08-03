import { PrismaClient } from '@prisma/client';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';
import { loadPrismaEnv } from './load-prisma-env';

loadPrismaEnv();

const prisma = new PrismaClient();

async function seedMembershipPlans() {
    console.log('🌱 Seeding membership plans...');

    const plans = [
        {
            name: 'Freemium',
            slug: 'free',
            description: 'Ideal para nutricionistas que están comenzando su consulta.',
            price: 0,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                '✓ 4 pacientes totales',
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
            maxStorage: null,
            isPopular: false,
            isActive: true,
            displayOrder: 1,
            entitlements: getMembershipPlanEntitlements('free'),
        },
        {
            name: 'Pro',
            slug: 'pro',
            description: 'Plan profesional completo para automatizar y crecer.',
            price: 39990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                '✓ Pacientes ilimitados',
                '✓ Consultas ilimitadas',
                '✓ PDFs ilimitados',
                '✓ Seguimientos ilimitados',
                '✓ IA ilimitada',
                '✓ Relleno automático de IA',
                '✓ Gestión de citas y horarios',
                '✓ Portal de nutricionista',
                '✓ Generación de boletas SII',
            ],
            maxPatients: null,
            maxStorage: null,
            isPopular: true,
            isActive: true,
            displayOrder: 3,
            entitlements: getMembershipPlanEntitlements('pro'),
        }
    ];

    for (const plan of plans) {
        await prisma.membershipPlan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan
        });
        console.log(`✅ Created/Updated plan: ${plan.name}`);
    }

    console.log('🎉 Membership plans seeded successfully!');
}

async function main() {
    try {
        await seedMembershipPlans();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
