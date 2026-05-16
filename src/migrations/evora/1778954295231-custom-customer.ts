import {MigrationInterface, QueryRunner} from "typeorm";

export class CustomCustomer1778954295231 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsVatnumber` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsGender` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsDateofbirth` datetime(6) NULL", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsAccepttermsandconditions` tinyint NULL DEFAULT 0", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsMarketingoptin` tinyint NULL DEFAULT 0", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsMarketingoptin`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsAccepttermsandconditions`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsDateofbirth`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsGender`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsVatnumber`", undefined);
   }

}
