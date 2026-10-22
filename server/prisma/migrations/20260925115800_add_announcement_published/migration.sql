-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "roleVisibility" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Announcement" ("content", "createdAt", "createdById", "id", "roleVisibility", "title") SELECT "content", "createdAt", "createdById", "id", "roleVisibility", "title" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
CREATE INDEX "Announcement_createdById_idx" ON "Announcement"("createdById");
CREATE INDEX "Announcement_roleVisibility_idx" ON "Announcement"("roleVisibility");
CREATE INDEX "Announcement_published_idx" ON "Announcement"("published");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
