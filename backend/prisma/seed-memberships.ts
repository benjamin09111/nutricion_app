import { PrismaClient } from '@prisma/client';

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
            displayOrder: 1
        },
        {
            name: 'Pro',
            slug: 'pro',
            description: 'Para nutricionistas profesionales que buscan eficiencia',
            price: 29990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                'Pacientes ilimitados',
                'IA avanzada para dietas personalizadas',
                'Listas de compras inteligentes',
                'Análisis nutricional completo',
                'Plantillas personalizables',
                'Soporte prioritario',
                '50 GB de almacenamiento',
                'Exportación PDF premium'
            ],
            maxPatients: null,
            maxStorage: 50,
            isPopular: true,
            isActive: true,
            displayOrder: 2
        },
        {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'Para clínicas y organizaciones con múltiples profesionales',
            price: 99990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: [
                'Todo lo de Pro',
                'Múltiples usuarios (hasta 10)',
                'Panel de administración centralizado',
                'API de integración',
                'Branding personalizado',
                'Soporte dedicado 24/7',
                'Almacenamiento ilimitado',
                'Reportes avanzados',
                'Capacitación personalizada'
            ],
            maxPatients: null,
            maxStorage: null,
            isPopular: false,
            isActive: true,
            displayOrder: 3
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
