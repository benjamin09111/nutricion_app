import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getNutritionistStats(nutritionistId: string) {
        const [
            totalPatients,
            totalRecipes,
            recentPatients,
            ingredientsCount
        ] = await Promise.all([
            // 1. Total Pacientes
            this.prisma.patient.count({
                where: { nutritionistId }
            }),
            // 2. Total Recetas (Proxy de Dietas)
            this.prisma.recipe.count({
                where: { nutritionistId }
            }),
            // 3. Pacientes Recientes
            this.prisma.patient.findMany({
                where: { nutritionistId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    fullName: true,
                    updatedAt: true,
                    email: true
                }
            }),
            // 4. Ingredientes Propios
            this.prisma.ingredient.count({
                where: { nutritionistId }
            })
        ]);

        // Calcular cambios (simulados por ahora ya que no tenemos histórico diario por nutricionista)
        // En un futuro, esto debería consultar una tabla de históricas o calcular con fechas.
        const stats = [
            {
                name: 'Pacientes Activos',
                stat: totalPatients.toString(),
                icon: 'Users',
                change: '+0%', // Placeholder
                changeType: 'neutral'
            },
            {
                name: 'Recetas Creadas',
                stat: totalRecipes.toString(),
                icon: 'FileText',
                change: '+0%',
                changeType: 'neutral'
            },
            {
                name: 'Ingredientes Propios',
                stat: ingredientsCount.toString(),
                icon: 'Activity',
                change: '+0%',
                changeType: 'neutral'
            },
        ];

        return {
            stats,
            recentPatients
        };
    }
}
