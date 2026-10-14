/*
  Warnings:

  - You are about to drop the column `content` on the `post` table. All the data in the column will be lost.
  - The values [IMAGE,VIDEO] on the enum `Post_post_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `post` DROP COLUMN `content`,
    ADD COLUMN `caption` VARCHAR(2000) NULL,
    MODIFY `post_type` ENUM('TEXT', 'MEDIA') NOT NULL;
