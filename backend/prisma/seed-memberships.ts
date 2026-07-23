import { PrismaClient } from '@prisma/client';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';

const prisma = new PrismaClient();

async function seedMembershipPlans() {
    console.log('🌱 Seeding membership plans...');

    const plans = [
        {
            name: 'Gratis',
            slug: 'free',
            description: 'Perfecto para comenzar y probar la plataforma',
            price: 0,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                'Hasta 10 pacientes',
                'Generación básica de dietas',
                'Plantillas predefinidas',
                'Soporte por email',
                '1 GB de almacenamiento'
            ],
            maxPatients: 10,
            maxStorage: 1,
            isPopular: false,
            isActive: true,
            displayOrder: 1,
            entitlements: getMembershipPlanEntitlements('free'),
        },
        {
            name: 'Pro',
            slug: 'pro',
            description: 'Plan profesional completo para automatizar y crecer.',
            price: 19990,
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
                '✓ Google Calendar',
                '✓ Portal de nutricionista',
                '✓ Generación de boletas SII'
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
