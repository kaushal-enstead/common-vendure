import {MigrationInterface, QueryRunner} from "typeorm";

export class Product1778958691762 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `product_custom_fields_cross_sell_products_product` (`productId_1` varchar(36) NOT NULL, `productId_2` varchar(36) NOT NULL, INDEX `IDX_ae6ae9eb0a521e5f6b47a94176` (`productId_1`), INDEX `IDX_37fd74a52726b1619e52fa6475` (`productId_2`), PRIMARY KEY (`productId_1`, `productId_2`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `product_custom_fields_up_sell_products_product` (`productId_1` varchar(36) NOT NULL, `productId_2` varchar(36) NOT NULL, INDEX `IDX_7d1cfbbadb6209642fdcb2b00d` (`productId_1`), INDEX `IDX_9985a93765209b9cf3ce00f9a1` (`productId_2`), PRIMARY KEY (`productId_1`, `productId_2`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `product_translation` ADD `customFieldsSeo_tag` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_translation` ADD `customFieldsSeo_description` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsNewproduct` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsFeaturedproduct` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsUnit_type` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsProduct_per_unit` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_cross_sell_products_product` ADD CONSTRAINT `FK_ae6ae9eb0a521e5f6b47a94176e` FOREIGN KEY (`productId_1`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_cross_sell_products_product` ADD CONSTRAINT `FK_37fd74a52726b1619e52fa6475e` FOREIGN KEY (`productId_2`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_up_sell_products_product` ADD CONSTRAINT `FK_7d1cfbbadb6209642fdcb2b00d0` FOREIGN KEY (`productId_1`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_up_sell_products_product` ADD CONSTRAINT `FK_9985a93765209b9cf3ce00f9a16` FOREIGN KEY (`productId_2`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product_custom_fields_up_sell_products_product` DROP FOREIGN KEY `FK_9985a93765209b9cf3ce00f9a16`", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_up_sell_products_product` DROP FOREIGN KEY `FK_7d1cfbbadb6209642fdcb2b00d0`", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_cross_sell_products_product` DROP FOREIGN KEY `FK_37fd74a52726b1619e52fa6475e`", undefined);
        await queryRunner.query("ALTER TABLE `product_custom_fields_cross_sell_products_product` DROP FOREIGN KEY `FK_ae6ae9eb0a521e5f6b47a94176e`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsProduct_per_unit`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsUnit_type`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsFeaturedproduct`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsNewproduct`", undefined);
        await queryRunner.query("ALTER TABLE `product_translation` DROP COLUMN `customFieldsSeo_description`", undefined);
        await queryRunner.query("ALTER TABLE `product_translation` DROP COLUMN `customFieldsSeo_tag`", undefined);
        await queryRunner.query("DROP INDEX `IDX_9985a93765209b9cf3ce00f9a1` ON `product_custom_fields_up_sell_products_product`", undefined);
        await queryRunner.query("DROP INDEX `IDX_7d1cfbbadb6209642fdcb2b00d` ON `product_custom_fields_up_sell_products_product`", undefined);
        await queryRunner.query("DROP TABLE `product_custom_fields_up_sell_products_product`", undefined);
        await queryRunner.query("DROP INDEX `IDX_37fd74a52726b1619e52fa6475` ON `product_custom_fields_cross_sell_products_product`", undefined);
        await queryRunner.query("DROP INDEX `IDX_ae6ae9eb0a521e5f6b47a94176` ON `product_custom_fields_cross_sell_products_product`", undefined);
        await queryRunner.query("DROP TABLE `product_custom_fields_cross_sell_products_product`", undefined);
   }

}
