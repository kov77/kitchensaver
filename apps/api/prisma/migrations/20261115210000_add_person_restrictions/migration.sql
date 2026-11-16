-- CreateEnum
CREATE TYPE "AllergenCode" AS ENUM ('MILK', 'EGG', 'FISH', 'CRUSTACEAN_SHELLFISH', 'MOLLUSC', 'TREE_NUT', 'PEANUT', 'WHEAT', 'SOY', 'SESAME', 'MUSTARD', 'SULPHITES', 'OTHER');

-- CreateTable
CREATE TABLE "person_allergy" (
    "id" UUID NOT NULL,
    "personProfileId" UUID NOT NULL,
    "allergenCode" "AllergenCode" NOT NULL,
    "customLabel" TEXT,
    "normalizedLabel" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_exclusion" (
    "id" UUID NOT NULL,
    "personProfileId" UUID NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_exclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_food_preference" (
    "id" UUID NOT NULL,
    "personProfileId" UUID NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "person_food_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_allergy_personProfileId_allergenCode_normalizedLabel_key" ON "person_allergy"("personProfileId", "allergenCode", "normalizedLabel");

-- CreateIndex
CREATE UNIQUE INDEX "person_exclusion_personProfileId_normalizedName_key" ON "person_exclusion"("personProfileId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "person_food_preference_personProfileId_normalizedName_key" ON "person_food_preference"("personProfileId", "normalizedName");

-- AddForeignKey
ALTER TABLE "person_allergy" ADD CONSTRAINT "person_allergy_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_exclusion" ADD CONSTRAINT "person_exclusion_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_food_preference" ADD CONSTRAINT "person_food_preference_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma cannot express CHECK constraints; they back up the API validation.
ALTER TABLE "person_food_preference" ADD CONSTRAINT "person_food_preference_rating_check" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "person_allergy" ADD CONSTRAINT "person_allergy_label_check" CHECK (
    ("allergenCode" = 'OTHER' AND "customLabel" IS NOT NULL AND "normalizedLabel" <> '')
    OR ("allergenCode" <> 'OTHER' AND "customLabel" IS NULL AND "normalizedLabel" = '')
);
