-- DropForeignKey
ALTER TABLE "account_consent" DROP CONSTRAINT "account_consent_accountId_fkey";

-- CreateTable
CREATE TABLE "person_profile" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "person_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "person_profile_accountId_archivedAt_idx" ON "person_profile"("accountId", "archivedAt");

-- AddForeignKey
ALTER TABLE "account_consent" ADD CONSTRAINT "account_consent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_profile" ADD CONSTRAINT "person_profile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

