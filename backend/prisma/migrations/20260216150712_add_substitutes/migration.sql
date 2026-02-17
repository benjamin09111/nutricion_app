-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "diet_restrictions" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "substitutes" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substitutes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "substitutes_nutritionist_id_idx" ON "substitutes"("nutritionist_id");

-- AddForeignKey
ALTER TABLE "substitutes" ADD CONSTRAINT "substitutes_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
