-- CreateEnum
CREATE TYPE "ConsentCategory" AS ENUM ('ADULT_ATTESTATION', 'TERMS_OF_SERVICE', 'PRIVACY_POLICY');

-- CreateTable
CREATE TABLE "account_consent" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "category" "ConsentCategory" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_consent_accountId_category_documentVersion_key" ON "account_consent"("accountId", "category", "documentVersion");

-- AddForeignKey
ALTER TABLE "account_consent" ADD CONSTRAINT "account_consent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

