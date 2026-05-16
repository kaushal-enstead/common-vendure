import {MigrationInterface, QueryRunner} from "typeorm";

export class Booking1778954827488 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `booking_asset` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `assetId` varchar(255) NOT NULL, `position` int NOT NULL, `bookingId` varchar(255) NOT NULL, `id` varchar(36) NOT NULL, INDEX `IDX_d43c24673a32ee807f60a6982d` (`assetId`), INDEX `IDX_600004da0c964d959f702e87e5` (`bookingId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `booking_order` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `status` varchar(255) NOT NULL DEFAULT 'pending', `deletedAt` datetime(6) NULL, `comments` json NOT NULL, `formValues` json NOT NULL, `id` varchar(36) NOT NULL, `bookingId` varchar(255) NULL, `customerId` varchar(255) NULL, INDEX `IDX_f2ed15841f49ebb5d156cfed3c` (`bookingId`), INDEX `IDX_b33f1018455746fc95f61bc263` (`customerId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `booking_translation` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `languageCode` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `slug` varchar(255) NOT NULL, `seo` json NOT NULL, `description` varchar(255) NULL, `id` varchar(36) NOT NULL, `baseId` varchar(36) NULL, INDEX `IDX_52926d842e42c9c9f7828f389f` (`baseId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `form_field_translation` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `languageCode` varchar(255) NOT NULL, `label` varchar(255) NOT NULL, `description` varchar(255) NULL, `options` json NOT NULL, `id` varchar(36) NOT NULL, `baseId` varchar(36) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `form_translation` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `languageCode` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `description` varchar(255) NULL, `id` varchar(36) NOT NULL, `baseId` varchar(36) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `form_field` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `name` varchar(255) NOT NULL, `type` varchar(255) NOT NULL, `id` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `form` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `deletedAt` datetime(6) NULL, `id` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `booking` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `availableHours` json NOT NULL, `availableDays` json NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `deletedAt` datetime(6) NULL, `id` varchar(36) NOT NULL, `formId` varchar(36) NULL, `featuredAssetId` varchar(36) NULL, `collectionId` varchar(36) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `form_field_forms_form` (`formFieldId` varchar(36) NOT NULL, `formId` varchar(36) NOT NULL, INDEX `IDX_3284bec978fa3842be446e9262` (`formFieldId`), INDEX `IDX_88c6f9b79442059c7460cef41a` (`formId`), PRIMARY KEY (`formFieldId`, `formId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `booking_channels_channel` (`bookingId` varchar(36) NOT NULL, `channelId` varchar(36) NOT NULL, INDEX `IDX_0d158b49bf105e493d9aa83894` (`bookingId`), INDEX `IDX_542f74999b64a1b0a1324ef5ff` (`channelId`), PRIMARY KEY (`bookingId`, `channelId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `booking_facet_values_facet_value` (`bookingId` varchar(36) NOT NULL, `facetValueId` varchar(36) NOT NULL, INDEX `IDX_58676ab2a722a5ae36981cc570` (`bookingId`), INDEX `IDX_2b7e4a9c9117c66ec519dd8711` (`facetValueId`), PRIMARY KEY (`bookingId`, `facetValueId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `booking_asset` ADD CONSTRAINT `FK_d43c24673a32ee807f60a6982df` FOREIGN KEY (`assetId`) REFERENCES `asset`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking_asset` ADD CONSTRAINT `FK_600004da0c964d959f702e87e55` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking_order` ADD CONSTRAINT `FK_f2ed15841f49ebb5d156cfed3c7` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking_order` ADD CONSTRAINT `FK_b33f1018455746fc95f61bc2632` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking_translation` ADD CONSTRAINT `FK_52926d842e42c9c9f7828f389f6` FOREIGN KEY (`baseId`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `form_field_translation` ADD CONSTRAINT `FK_5faaf74a61544b836b597f76fdf` FOREIGN KEY (`baseId`) REFERENCES `form_field`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `form_translation` ADD CONSTRAINT `FK_be4418af30bdb03afd0cff02a2c` FOREIGN KEY (`baseId`) REFERENCES `form`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking` ADD CONSTRAINT `FK_b1b36c6fc6134206140bce7d54a` FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking` ADD CONSTRAINT `FK_9dd14f61a67fa52a2232fec3867` FOREIGN KEY (`featuredAssetId`) REFERENCES `asset`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking` ADD CONSTRAINT `FK_c0fc4f3e9344ef1229d827798b6` FOREIGN KEY (`collectionId`) REFERENCES `collection`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `form_field_forms_form` ADD CONSTRAINT `FK_3284bec978fa3842be446e9262c` FOREIGN KEY (`formFieldId`) REFERENCES `form_field`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `form_field_forms_form` ADD CONSTRAINT `FK_88c6f9b79442059c7460cef41ac` FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `booking_channels_channel` ADD CONSTRAINT `FK_0d158b49bf105e493d9aa83894a` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `booking_channels_channel` ADD CONSTRAINT `FK_542f74999b64a1b0a1324ef5ff7` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `booking_facet_values_facet_value` ADD CONSTRAINT `FK_58676ab2a722a5ae36981cc5704` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `booking_facet_values_facet_value` ADD CONSTRAINT `FK_2b7e4a9c9117c66ec519dd87119` FOREIGN KEY (`facetValueId`) REFERENCES `facet_value`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `booking_facet_values_facet_value` DROP FOREIGN KEY `FK_2b7e4a9c9117c66ec519dd87119`", undefined);
        await queryRunner.query("ALTER TABLE `booking_facet_values_facet_value` DROP FOREIGN KEY `FK_58676ab2a722a5ae36981cc5704`", undefined);
        await queryRunner.query("ALTER TABLE `booking_channels_channel` DROP FOREIGN KEY `FK_542f74999b64a1b0a1324ef5ff7`", undefined);
        await queryRunner.query("ALTER TABLE `booking_channels_channel` DROP FOREIGN KEY `FK_0d158b49bf105e493d9aa83894a`", undefined);
        await queryRunner.query("ALTER TABLE `form_field_forms_form` DROP FOREIGN KEY `FK_88c6f9b79442059c7460cef41ac`", undefined);
        await queryRunner.query("ALTER TABLE `form_field_forms_form` DROP FOREIGN KEY `FK_3284bec978fa3842be446e9262c`", undefined);
        await queryRunner.query("ALTER TABLE `booking` DROP FOREIGN KEY `FK_c0fc4f3e9344ef1229d827798b6`", undefined);
        await queryRunner.query("ALTER TABLE `booking` DROP FOREIGN KEY `FK_9dd14f61a67fa52a2232fec3867`", undefined);
        await queryRunner.query("ALTER TABLE `booking` DROP FOREIGN KEY `FK_b1b36c6fc6134206140bce7d54a`", undefined);
        await queryRunner.query("ALTER TABLE `form_translation` DROP FOREIGN KEY `FK_be4418af30bdb03afd0cff02a2c`", undefined);
        await queryRunner.query("ALTER TABLE `form_field_translation` DROP FOREIGN KEY `FK_5faaf74a61544b836b597f76fdf`", undefined);
        await queryRunner.query("ALTER TABLE `booking_translation` DROP FOREIGN KEY `FK_52926d842e42c9c9f7828f389f6`", undefined);
        await queryRunner.query("ALTER TABLE `booking_order` DROP FOREIGN KEY `FK_b33f1018455746fc95f61bc2632`", undefined);
        await queryRunner.query("ALTER TABLE `booking_order` DROP FOREIGN KEY `FK_f2ed15841f49ebb5d156cfed3c7`", undefined);
        await queryRunner.query("ALTER TABLE `booking_asset` DROP FOREIGN KEY `FK_600004da0c964d959f702e87e55`", undefined);
        await queryRunner.query("ALTER TABLE `booking_asset` DROP FOREIGN KEY `FK_d43c24673a32ee807f60a6982df`", undefined);
        await queryRunner.query("DROP INDEX `IDX_2b7e4a9c9117c66ec519dd8711` ON `booking_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP INDEX `IDX_58676ab2a722a5ae36981cc570` ON `booking_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP TABLE `booking_facet_values_facet_value`", undefined);
        await queryRunner.query("DROP INDEX `IDX_542f74999b64a1b0a1324ef5ff` ON `booking_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_0d158b49bf105e493d9aa83894` ON `booking_channels_channel`", undefined);
        await queryRunner.query("DROP TABLE `booking_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_88c6f9b79442059c7460cef41a` ON `form_field_forms_form`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3284bec978fa3842be446e9262` ON `form_field_forms_form`", undefined);
        await queryRunner.query("DROP TABLE `form_field_forms_form`", undefined);
        await queryRunner.query("DROP TABLE `booking`", undefined);
        await queryRunner.query("DROP TABLE `form`", undefined);
        await queryRunner.query("DROP TABLE `form_field`", undefined);
        await queryRunner.query("DROP TABLE `form_translation`", undefined);
        await queryRunner.query("DROP TABLE `form_field_translation`", undefined);
        await queryRunner.query("DROP INDEX `IDX_52926d842e42c9c9f7828f389f` ON `booking_translation`", undefined);
        await queryRunner.query("DROP TABLE `booking_translation`", undefined);
        await queryRunner.query("DROP INDEX `IDX_b33f1018455746fc95f61bc263` ON `booking_order`", undefined);
        await queryRunner.query("DROP INDEX `IDX_f2ed15841f49ebb5d156cfed3c` ON `booking_order`", undefined);
        await queryRunner.query("DROP TABLE `booking_order`", undefined);
        await queryRunner.query("DROP INDEX `IDX_600004da0c964d959f702e87e5` ON `booking_asset`", undefined);
        await queryRunner.query("DROP INDEX `IDX_d43c24673a32ee807f60a6982d` ON `booking_asset`", undefined);
        await queryRunner.query("DROP TABLE `booking_asset`", undefined);
   }

}
