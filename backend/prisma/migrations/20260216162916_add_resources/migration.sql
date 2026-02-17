-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resources_nutritionist_id_idx" ON "resources"("nutritionist_id");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
