-- AlterTable
ALTER TABLE "LabAssignment" ADD COLUMN "dueDate" DATETIME;

-- CreateIndex
CREATE INDEX "LabAssignment_dueDate_idx" ON "LabAssignment"("dueDate");
