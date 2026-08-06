CREATE TABLE "personal_note_tabs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_note_tabs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "personal_note_tabs_account_id_position_idx"
ON "personal_note_tabs"("account_id", "position");

ALTER TABLE "personal_note_tabs"
ADD CONSTRAINT "personal_note_tabs_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
