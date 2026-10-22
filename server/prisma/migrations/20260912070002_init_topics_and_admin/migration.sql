-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Topic_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "sampleInput" TEXT NOT NULL,
    "sampleOutput" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "supportedLanguages" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "topicId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lab_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lab_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lab" ("constraints", "createdAt", "createdById", "description", "difficulty", "id", "published", "sampleInput", "sampleOutput", "supportedLanguages", "title", "updatedAt") SELECT "constraints", "createdAt", "createdById", "description", "difficulty", "id", "published", "sampleInput", "sampleOutput", "supportedLanguages", "title", "updatedAt" FROM "Lab";
DROP TABLE "Lab";
ALTER TABLE "new_Lab" RENAME TO "Lab";
CREATE INDEX "Lab_createdById_idx" ON "Lab"("createdById");
CREATE INDEX "Lab_topicId_idx" ON "Lab"("topicId");
CREATE INDEX "Lab_published_idx" ON "Lab"("published");
CREATE INDEX "Lab_difficulty_idx" ON "Lab"("difficulty");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Topic_createdById_idx" ON "Topic"("createdById");
