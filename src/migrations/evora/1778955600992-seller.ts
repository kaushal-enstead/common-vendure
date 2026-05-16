import {MigrationInterface, QueryRunner} from "typeorm";

export class Seller1778955600992 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `seller_custom_fields_facet_value_facet_value` (`sellerId` varchar(36) NOT NULL, `facetValueId` varchar(36) NOT NULL, INDEX `IDX_96480506d3ee770bde0fa90f15` (`sellerId`), INDEX `IDX_3123adcd109f626ea3029a0840` (`facetValueId`), PRIMARY KEY (`sellerId`, `facetValueId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `seller_custom_fields_banner_asset` (`sellerId` varchar(36) NOT NULL, `assetId` varchar(36) NOT NULL, INDEX `IDX_93639b33a1a252e41784b93731` (`sellerId`), INDEX `IDX_0731518d567f1c84c9a6a338fc` (`assetId`), PRIMARY KEY (`sellerId`, `assetId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsLogoid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsFaviconid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsCreatedby` varchar(255) NULL DEFAULT 'vendor'", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsPhone` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsVatnumber` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsCollectionid` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsCompany` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsContact` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsAddress` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsColors` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsFontfamily` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsShopdescription` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsPrivacypolicy` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsShippingpolicy` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsReturnpolicy` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsHours` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsIsfeatured` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsAcceptterms` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsSocialdomains` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsStatus` varchar(255) NULL DEFAULT 'Pending'", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsRejectreason` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD CONSTRAINT `FK_2d46d0ac63391e9f923f202fca9` FOREIGN KEY (`customFieldsLogoid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD CONSTRAINT `FK_f68fb23e1bf5888614ef6201986` FOREIGN KEY (`customFieldsFaviconid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_facet_value_facet_value` ADD CONSTRAINT `FK_96480506d3ee770bde0fa90f151` FOREIGN KEY (`sellerId`) REFERENCES `seller`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_facet_value_facet_value` ADD CONSTRAINT `FK_3123adcd109f626ea3029a08400` FOREIGN KEY (`facetValueId`) REFERENCES `facet_value`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_banner_asset` ADD CONSTRAINT `FK_93639b33a1a252e41784b937311` FOREIGN KEY (`sellerId`) REFERENCES `seller`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_banner_asset` ADD CONSTRAINT `FK_0731518d567f1c84c9a6a338fcb` FOREIGN KEY (`assetId`) REFERENCES `asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `seller_custom_fields_banner_asset` DROP FOREIGN KEY `FK_0731518d567f1c84c9a6a338fcb`", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_banner_asset` DROP FOREIGN KEY `FK_93639b33a1a252e41784b937311`", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_facet_value_facet_value` DROP FOREIGN KEY `FK_3123adcd109f626ea3029a08400`", undefined);
        await queryRunner.query("ALTER TABLE `seller_custom_fields_facet_value_facet_value` DROP FOREIGN KEY `FK_96480506d3ee770bde0fa90f151`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP FOREIGN KEY `FK_f68fb23e1bf5888614ef6201986`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP FOREIGN KEY `FK_2d46d0ac63391e9f923f202fca9`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsRejectreason`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsStatus`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsSocialdomains`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsAcceptterms`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsIsfeatured`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsHours`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsReturnpolicy`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsShippingpolicy`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsPrivacypolicy`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsShopdescription`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsFontfamily`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsColors`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsAddress`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsContact`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsCompany`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsCollectionid`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsVatnumber`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsPhone`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsCreatedby`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsFaviconid`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsLogoid`", undefined);
        await queryRunner.query("DROP INDEX `IDX_0731518d567f1c84c9a6a338fc` ON `seller_custom_fields_banner_asset`", undefined);
        await queryRunner.query("DROP INDEX `IDX_93639b33a1a252e41784b93731` ON `seller_custom_fields_banner_asset`", undefined);
        await queryRunner.query("DROP TABLE `seller_custom_fields_banner_asset`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3123adcd109f626ea3029a0840` ON `seller_custom_fields_facet_value_facet_value`", undefined);
        await queryRunner.query("DROP INDEX `IDX_96480506d3ee770bde0fa90f15` ON `seller_custom_fields_facet_value_facet_value`", undefined);
        await queryRunner.query("DROP TABLE `seller_custom_fields_facet_value_facet_value`", undefined);
   }

}
