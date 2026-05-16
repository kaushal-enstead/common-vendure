import {MigrationInterface, QueryRunner} from "typeorm";

export class ShippingPlugin1778942360665 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsWeight` double NULL", undefined);
        await queryRunner.query("ALTER TABLE `order` ADD `customFieldsCustomshippingquotestatus` varchar(255) NULL DEFAULT 'NOT_REQUIRED'", undefined);
        await queryRunner.query("ALTER TABLE `order` ADD `customFieldsCustomshippingquoteamount` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `order` ADD `customFieldsCustomshippingquoteupdatedat` datetime(6) NULL", undefined);
        await queryRunner.query("ALTER TABLE `order` ADD `customFieldsCustomshippingdestination` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` ADD `customFieldsWeight` double NULL", undefined);
        await queryRunner.query("ALTER TABLE `zone` ADD `customFieldsShippingzonepriority` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `zone` ADD `customFieldsQuoteenabled` tinyint NULL DEFAULT 0", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `zone` DROP COLUMN `customFieldsQuoteenabled`", undefined);
        await queryRunner.query("ALTER TABLE `zone` DROP COLUMN `customFieldsShippingzonepriority`", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` DROP COLUMN `customFieldsWeight`", undefined);
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `customFieldsCustomshippingdestination`", undefined);
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `customFieldsCustomshippingquoteupdatedat`", undefined);
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `customFieldsCustomshippingquoteamount`", undefined);
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `customFieldsCustomshippingquotestatus`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsWeight`", undefined);
   }

}
