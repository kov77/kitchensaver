-- CreateEnum
CREATE TYPE "GoalMode" AS ENUM ('MANUAL', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('LOSE', 'MAINTAIN', 'GAIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CalculationMethod" AS ENUM ('DRI_2023_ADULT', 'DRI_2023_AGES_3_18');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('INACTIVE', 'LOW_ACTIVE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "FormulaSex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "nutrition_goal" (
    "id" UUID NOT NULL,
    "personProfileId" UUID NOT NULL,
    "mode" "GoalMode" NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "dailyKcal" INTEGER NOT NULL,
    "proteinG" INTEGER,
    "fatG" INTEGER,
    "carbsG" INTEGER,
    "estimatedMaintenanceKcal" INTEGER,
    "calculationMethod" "CalculationMethod",
    "estimatedAt" TIMESTAMPTZ(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "confirmedAt" TIMESTAMPTZ(3) NOT NULL,
    "reviewRequiredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "nutrition_goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_body_parameters" (
    "id" UUID NOT NULL,
    "personProfileId" UUID NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "formulaSex" "FormulaSex" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "person_body_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_goal_personProfileId_key" ON "nutrition_goal"("personProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "person_body_parameters_personProfileId_key" ON "person_body_parameters"("personProfileId");

-- AddForeignKey
ALTER TABLE "nutrition_goal" ADD CONSTRAINT "nutrition_goal_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_body_parameters" ADD CONSTRAINT "person_body_parameters_personProfileId_fkey" FOREIGN KEY ("personProfileId") REFERENCES "person_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

