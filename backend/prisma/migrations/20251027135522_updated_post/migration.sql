/*
  Warnings:

  - The values [MEDIA] on the enum `Post_post_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `post` MODIFY `post_type` ENUM('TEXT', 'IMAGE', 'VIDEO') NOT NULL;
