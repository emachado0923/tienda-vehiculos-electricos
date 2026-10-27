-- AlterTable
ALTER TABLE `SiteConfig` MODIFY `storeName` VARCHAR(191) NOT NULL DEFAULT 'EMC Positive Energy';

-- Renombra la tienda ya configurada con la marca anterior
UPDATE `SiteConfig` SET `storeName` = 'EMC Positive Energy' WHERE `storeName` = 'E-Positive';
