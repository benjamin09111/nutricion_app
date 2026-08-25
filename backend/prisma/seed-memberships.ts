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
            description: 'Ideal para nutricionistas que están conociendo y explorando Nutrinet.',
            price: 0,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                '✓ 3 pacientes totales',
                '✓ 3 consultas guardadas',
                '✓ 6 PDFs generados',
                '✓ 6 seguimientos privados activos',
                '✓ Base de ingredientes',
                'X Usar la calculadora clínica',
                '✓ 1 grupo de alimentos',
                '✓ 4 respuestas de IA',
                '✓ 6 creaciones guardadas',
                'X Editar información de pacientes',
                'X Editar creaciones guardadas',
                'X Crear Detalles personalizados',
            ],
            maxPatients: 3,
            maxStorage: null,
            isPopular: false,
            isComingSoon: false,
            isActive: true,
            displayOrder: 1,
            entitlements: getMembershipPlanEntitlements('free'),
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
            maxStorage: null,
            isPopular: true,
            isComingSoon: false,
            isActive: true,
            displayOrder: 2,
            entitlements: getMembershipPlanEntitlements('plus'),
        },
        {
            name: 'Pro',
            slug: 'pro',
            description: 'Para clínicas y consultas avanzadas con funcionalidades exclusivas.',
            price: 39990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                '✓ Todo lo del plan Plus',
                '✓ Copiloto IA avanzado sin límites',
                '✓ Portal para pacientes interactivo',
                '✓ Sincronización de agendas y más',
            ],
            maxPatients: null,
            maxStorage: null,
            isPopular: false,
            isComingSoon: true,
            isActive: true,
            displayOrder: 3,
            entitlements: getMembershipPlanEntitlements('pro'),
        },
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
