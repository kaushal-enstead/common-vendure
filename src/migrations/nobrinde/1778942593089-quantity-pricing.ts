import {MigrationInterface, QueryRunner} from "typeorm";

export class QuantityPricing1778942593089 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product_variant_price` ADD `customFieldsQuantitypricetiers` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` ADD `customFieldsMinquantity` int NULL", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product_variant` DROP COLUMN `customFieldsMinquantity`", undefined);
        await queryRunner.query("ALTER TABLE `product_variant_price` DROP COLUMN `customFieldsQuantitypricetiers`", undefined);
   }

}
