import {MigrationInterface, QueryRunner} from "typeorm";

export class ChannelPersonalization1778941739715 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsLogoid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsFaviconid` varchar(36) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsColors` json NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsFontfamily` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsStoredisplayname` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsPrivacypolicyurl` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsEmailheadertext` longtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsEmailfootertext` longtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsFromemail` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsReplytoemail` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsSupportemail` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsBillingemail` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsStoreaddress` longtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsChanneldomain` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsCertificateprovider` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsCertificateref` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsCertificatestatus` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD `customFieldsTlsenforced` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD CONSTRAINT `FK_47b012f4fa1cda466a854209f09` FOREIGN KEY (`customFieldsLogoid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `channel` ADD CONSTRAINT `FK_ff401185db19340bf49edf02f90` FOREIGN KEY (`customFieldsFaviconid`) REFERENCES `asset`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `channel` DROP FOREIGN KEY `FK_ff401185db19340bf49edf02f90`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP FOREIGN KEY `FK_47b012f4fa1cda466a854209f09`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsTlsenforced`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsCertificatestatus`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsCertificateref`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsCertificateprovider`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsChanneldomain`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsStoreaddress`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsBillingemail`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsSupportemail`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsReplytoemail`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsFromemail`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsEmailfootertext`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsEmailheadertext`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsPrivacypolicyurl`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsStoredisplayname`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsFontfamily`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsColors`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsFaviconid`", undefined);
        await queryRunner.query("ALTER TABLE `channel` DROP COLUMN `customFieldsLogoid`", undefined);
   }

}
