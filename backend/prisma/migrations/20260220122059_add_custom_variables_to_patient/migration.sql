-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "clinicalSummary" TEXT,
ADD COLUMN     "custom_variables" JSONB DEFAULT '[]',
ADD COLUMN     "fitness_goals" TEXT,
ADD COLUMN     "nutritional_focus" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'Active';
