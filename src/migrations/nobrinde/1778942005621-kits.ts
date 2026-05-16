import {MigrationInterface, QueryRunner} from "typeorm";

export class Kits1778942005621 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `kit_asset` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `assetId` varchar(255) NOT NULL, `position` int NOT NULL, `kitId` varchar(255) NOT NULL, `id` varchar(36) NOT NULL, INDEX `IDX_1b56cc1cc8e98f654ae441f6c1` (`assetId`), INDEX `IDX_3045fa2485fb14dcebf270db44` (`kitId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `kit_translation` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `languageCode` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `slug` varchar(255) NOT NULL, `description` text NOT NULL, `id` varchar(36) NOT NULL, `baseId` varchar(36) NULL, INDEX `IDX_3eabe5fc59777ba72df5ac0719` (`slug`), INDEX `IDX_6bfc3b9a7fb710345ffef5247e` (`baseId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `kit_variant` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `kitId` varchar(255) NOT NULL, `productVariantId` varchar(255) NOT NULL, `quantity` int NOT NULL, `discount` int NOT NULL DEFAULT '0', `id` varchar(36) NOT NULL, INDEX `IDX_442cc642c3de771d2461200f70` (`kitId`), INDEX `IDX_846d3d18b85c00890b0e205119` (`productVariantId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `kit` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `deletedAt` datetime NULL, `type` varchar(255) NOT NULL DEFAULT 'Admin', `enabled` tinyint NOT NULL DEFAULT 1, `id` varchar(36) NOT NULL, `customerId` varchar(255) NULL, `featuredAssetId` varchar(255) NULL, INDEX `IDX_98f9a7a8a394a8bfc7647c1550` (`customerId`), INDEX `IDX_9d59b910ceba08df51c7f5bac0` (`featuredAssetId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `kit_facet_values_facet_value` (`kitId` varchar(36) NOT NULL, `facetValueId` varchar(36) NOT NULL, INDEX `IDX_ea1d95f1ba6c65fa9481980036` (`kitId`), INDEX `IDX_fb74c2583b05dcb52d2077b63c` (`facetValueId`), PRIMARY KEY (`kitId`, `facetValueId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `kit_channels_channel` (`kitId` varchar(36) NOT NULL, `channelId` varchar(36) NOT NULL, INDEX `IDX_be6f93be6bf73a973436c1bf26` (`kitId`), INDEX `IDX_1854744b1672b1549666d7b74a` (`channelId`), PRIMARY KEY (`kitId`, `channelId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `kit_asset` ADD CONSTRAINT `FK_1b56cc1cc8e98f654ae441f6c19` FOREIGN KEY (`assetId`) REFERENCES `asset`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit_asset` ADD CONSTRAINT `FK_3045fa2485fb14dcebf270db44f` FOREIGN KEY (`kitId`) REFERENCES `kit`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit_translation` ADD CONSTRAINT `FK_6bfc3b9a7fb710345ffef5247ec` FOREIGN KEY (`baseId`) REFERENCES `kit`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit_variant` ADD CONSTRAINT `FK_442cc642c3de771d2461200f703` FOREIGN KEY (`kitId`) REFERENCES `kit`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit_variant` ADD CONSTRAINT `FK_846d3d18b85c00890b0e2051198` FOREIGN KEY (`productVariantId`) REFERENCES `product_variant`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit` ADD CONSTRAINT `FK_98f9a7a8a394a8bfc7647c15501` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit` ADD CONSTRAINT `FK_9d59b910ceba08df51c7f5bac05` FOREIGN KEY (`featuredAssetId`) REFERENCES `asset`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `kit_facet_values_facet_value` ADD CONSTRAINT `FK_ea1d95f1ba6c65fa94819800365` FOREIGN KEY (`kitId`) REFERENCES `kit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `kit_facet_values_facet_value` ADD CONSTRAINT `FK_fb74c2583b05dcb52d2077b63c6` FOREIGN KEY (`facetValueId`) REFERENCES `facet_value`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `kit_channels_channel` ADD CONSTRAINT `FK_be6f93be6bf73a973436c1bf261` FOREIGN KEY (`kitId`) REFERENCES `kit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `kit_channels_channel` ADD CONSTRAINT `FK_1854744b1672b1549666d7b74a8` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `kit_channels_channel` DROP FOREIGN KEY `FK_1854744b1672b1549666d7b74a8`", undefined);
        await queryRunner.query("ALTER TABLE `kit_channels_channel` DROP FOREIGN KEY `FK_be6f93be6bf73a973436c1bf261`", undefined);
        await queryRunner.query("ALTER TABLE `kit_facet_values_facet_value` DROP FOREIGN KEY `FK_fb74c2583b05dcb52d2077b63c6`", undefined);
        await queryRunner.query("ALTER TABLE `kit_facet_values_facet_value` DROP FOREIGN KEY `FK_ea1d95f1ba6c65fa94819800365`", undefined);
        await queryRunner.query("ALTER TABLE `kit` DROP FOREIGN KEY `FK_9d59b910ceba08df51c7f5bac05`", undefined);
        await queryRunner.query("ALTER TABLE `kit` DROP FOREIGN KEY `FK_98f9a7a8a394a8bfc7647c15501`", undefined);
        await queryRunner.query("ALTER TABLE `kit_variant` DROP FOREIGN KEY `FK_846d3d18b85c00890b0e2051198`", undefined);
        await queryRunner.query("ALTER TABLE `kit_variant` DROP FOREIGN KEY `FK_442cc642c3de771d2461200f703`", undefined);
        await queryRunner.query("ALTER TABLE `kit_translation` DROP FOREIGN KEY `FK_6bfc3b9a7fb710345ffef5247ec`", undefined);
        await queryRunner.query("ALTER TABLE `kit_asset` DROP FOREIGN KEY `FK_3045fa2485fb14dcebf270db44f`", undefined);
        await queryRunner.query("ALTER TABLE `kit_asset` DROP FOREIGN KEY `FK_1b56cc1cc8e98f654ae441f6c19`", undefined);
        await queryRunner.query("DROP INDEX `IDX_1854744b1672b1549666d7b74a` ON `kit_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_be6f93be6bf73a973436c1bf26` ON `kit_channels_channel`", undefined);
        await queryRunner.query("DROP TABLE `kit_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_fb74c2583b05dcb52d2077b63c` ON `kit_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP INDEX `IDX_ea1d95f1ba6c65fa9481980036` ON `kit_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP TABLE `kit_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP INDEX `IDX_9d59b910ceba08df51c7f5bac0` ON `kit`", undefined);
        await queryRunner.query("DROP INDEX `IDX_98f9a7a8a394a8bfc7647c1550` ON `kit`", undefined);
        await queryRunner.query("DROP TABLE `kit`", undefined);
        await queryRunner.query("DROP INDEX `IDX_846d3d18b85c00890b0e205119` ON `kit_variant`", undefined);
        await queryRunner.query("DROP INDEX `IDX_442cc642c3de771d2461200f70` ON `kit_variant`", undefined);
        await queryRunner.query("DROP TABLE `kit_variant`", undefined);
        await queryRunner.query("DROP INDEX `IDX_6bfc3b9a7fb710345ffef5247e` ON `kit_translation`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3eabe5fc59777ba72df5ac0719` ON `kit_translation`", undefined);
        await queryRunner.query("DROP TABLE `kit_translation`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3045fa2485fb14dcebf270db44` ON `kit_asset`", undefined);
        await queryRunner.query("DROP INDEX `IDX_1b56cc1cc8e98f654ae441f6c1` ON `kit_asset`", undefined);
        await queryRunner.query("DROP TABLE `kit_asset`", undefined);
   }

}
