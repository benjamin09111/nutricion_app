-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "appointments"
ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
