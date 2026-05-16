import {MigrationInterface, QueryRunner} from "typeorm";

export class QrCode1778956269203 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsQrcodeassetid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_variant_translation` ADD `customFields__fix_relational_custom_fields__` tinyint NULL COMMENT 'A work-around needed when only relational custom fields are defined on an entity'", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` ADD `customFieldsQrcodeassetid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` ADD `customFields__fix_relational_custom_fields__` tinyint NULL COMMENT 'A work-around needed when only relational custom fields are defined on an entity'", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD CONSTRAINT `FK_e48bf92cd16929029cf4d7a51eb` FOREIGN KEY (`customFieldsQrcodeassetid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` ADD CONSTRAINT `FK_8947a0703b0cac482446dbf74eb` FOREIGN KEY (`customFieldsQrcodeassetid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `product_variant` DROP FOREIGN KEY `FK_8947a0703b0cac482446dbf74eb`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP FOREIGN KEY `FK_e48bf92cd16929029cf4d7a51eb`", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` DROP COLUMN `customFields__fix_relational_custom_fields__`", undefined);
        await queryRunner.query("ALTER TABLE `product_variant` DROP COLUMN `customFieldsQrcodeassetid`", undefined);
        await queryRunner.query("ALTER TABLE `product_variant_translation` DROP COLUMN `customFields__fix_relational_custom_fields__`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsQrcodeassetid`", undefined);
   }

}
