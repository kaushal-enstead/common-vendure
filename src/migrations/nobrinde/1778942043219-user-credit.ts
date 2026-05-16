import {MigrationInterface, QueryRunner} from "typeorm";

export class UserCredit1778942043219 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsCredits` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsCredits_used` int NULL DEFAULT '0'", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsCredits_used`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsCredits`", undefined);
   }

}
