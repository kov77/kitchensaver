-- CreateEnum
CREATE TYPE "AllergyStatus" AS ENUM ('HAS_ALLERGIES', 'NONE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "person_profile" ADD COLUMN     "allergyStatus" "AllergyStatus",
ADD COLUMN     "allergyStatusAt" TIMESTAMPTZ(3);

-- Profiles that already list allergies get the matching answer; every other profile has to answer the question.
UPDATE "person_profile"
SET "allergyStatus" = 'HAS_ALLERGIES', "allergyStatusAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM "person_allergy" WHERE "person_allergy"."personProfileId" = "person_profile"."id"
);
