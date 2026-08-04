-- AlterTable
ALTER TABLE "CookbookMember" ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CookbookMember_inviteTokenHash_key" ON "CookbookMember"("inviteTokenHash");
