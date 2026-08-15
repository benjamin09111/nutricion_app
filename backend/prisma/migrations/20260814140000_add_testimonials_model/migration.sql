-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "clinic" TEXT,
    "city" TEXT,
    "time_saved" TEXT,
    "quote" TEXT NOT NULL,
    "highlight" TEXT,
    "avatar_text" TEXT,
    "avatar_bg" TEXT DEFAULT 'from-purple-500 to-indigo-600',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "author_account_id" TEXT,
    "support_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonials_is_published_display_order_idx" ON "testimonials"("is_published", "display_order");

-- CreateIndex
CREATE INDEX "testimonials_is_reviewed_idx" ON "testimonials"("is_reviewed");
