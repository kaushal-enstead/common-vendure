import {MigrationInterface, QueryRunner} from "typeorm";

export class Easypay1779260003699 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `global_settings` ADD `customFieldsPercentagefee` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` ADD `customFieldsFixedfee` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` ADD `customFieldsEasypayaccountuid` varchar(255) NULL DEFAULT ''", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `global_settings` DROP COLUMN `customFieldsEasypayaccountuid`", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` DROP COLUMN `customFieldsFixedfee`", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` DROP COLUMN `customFieldsPercentagefee`", undefined);
   }

}
