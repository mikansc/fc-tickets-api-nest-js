/*
  Warnings:

  - Added the required column `status` to the `ReservationHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ReservationHistory` ADD COLUMN `status` ENUM('reserved', 'canceled') NOT NULL;
