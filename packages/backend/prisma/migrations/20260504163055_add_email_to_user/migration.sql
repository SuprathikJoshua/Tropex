/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('IPO_ACTIVE', 'LIVE', 'DELISTED');

-- CreateEnum
CREATE TYPE "CardTier" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "IPOSubStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_creatorId_fkey";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "ipoEndsAt" TIMESTAMP(3),
ADD COLUMN     "ipoPrice" DECIMAL(18,4),
ADD COLUMN     "royaltyPct" DECIMAL(10,6) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "CardStatus" NOT NULL DEFAULT 'LIVE',
ADD COLUMN     "tier" "CardTier" NOT NULL DEFAULT 'COMMON',
ALTER COLUMN "creatorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "IPOSubscription" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalCost" DECIMAL(18,4) NOT NULL,
    "status" "IPOSubStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IPOSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IPOSubscription_cardId_userId_key" ON "IPOSubscription"("cardId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPOSubscription" ADD CONSTRAINT "IPOSubscription_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPOSubscription" ADD CONSTRAINT "IPOSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
