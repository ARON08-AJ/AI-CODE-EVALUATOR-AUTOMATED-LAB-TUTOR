-- AlterTable
ALTER TABLE "AIFeedback" ADD COLUMN "hintLevel" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "AIFeedback_submissionId_hintLevel_key" ON "AIFeedback"("submissionId", "hintLevel");
