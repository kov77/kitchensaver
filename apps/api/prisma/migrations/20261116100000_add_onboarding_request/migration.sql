-- CreateTable
CREATE TABLE "onboarding_request" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "personProfileId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_request_personProfileId_key" ON "onboarding_request"("personProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_request_accountId_idempotencyKey_key" ON "onboarding_request"("accountId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "onboarding_request" ADD CONSTRAINT "onboarding_request_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_request" ADD CONSTRAINT "onboarding_request_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

