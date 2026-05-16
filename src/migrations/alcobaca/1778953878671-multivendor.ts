import {MigrationInterface, QueryRunner} from "typeorm";

export class Multivendor1778953878671 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsConnectedaccountid` varchar(255) NULL", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsConnectedaccountid`", undefined);
   }

}
