import {MigrationInterface, QueryRunner} from "typeorm";

export class CustomerSupport1778940590933 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `support_subject_translation` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `languageCode` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `description` text NOT NULL, `id` varchar(36) NOT NULL, `baseId` varchar(36) NULL, INDEX `IDX_785667c5f78c26b2639da7d6e7` (`baseId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `support_subject` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `code` varchar(255) NOT NULL, `isActive` tinyint NOT NULL DEFAULT 1, `id` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `support_ticket` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `description` text NOT NULL, `status` varchar(255) NOT NULL DEFAULT 'OPEN', `priority` varchar(255) NOT NULL DEFAULT 'LOW', `messages` json NULL, `id` varchar(36) NOT NULL, `customerId` varchar(255) NOT NULL, `subjectId` varchar(255) NOT NULL, `channelId` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `support_subject_translation` ADD CONSTRAINT `FK_785667c5f78c26b2639da7d6e72` FOREIGN KEY (`baseId`) REFERENCES `support_subject`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `support_ticket` ADD CONSTRAINT `FK_50dc992a5df118814b247b7aa96` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `support_ticket` ADD CONSTRAINT `FK_928cca2b167174a017c8ec6fe34` FOREIGN KEY (`subjectId`) REFERENCES `support_subject`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `support_ticket` ADD CONSTRAINT `FK_f188aadce1690fe6d7022b7a599` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `support_ticket` DROP FOREIGN KEY `FK_f188aadce1690fe6d7022b7a599`", undefined);
        await queryRunner.query("ALTER TABLE `support_ticket` DROP FOREIGN KEY `FK_928cca2b167174a017c8ec6fe34`", undefined);
        await queryRunner.query("ALTER TABLE `support_ticket` DROP FOREIGN KEY `FK_50dc992a5df118814b247b7aa96`", undefined);
        await queryRunner.query("ALTER TABLE `support_subject_translation` DROP FOREIGN KEY `FK_785667c5f78c26b2639da7d6e72`", undefined);
        await queryRunner.query("DROP TABLE `support_ticket`", undefined);
        await queryRunner.query("DROP TABLE `support_subject`", undefined);
        await queryRunner.query("DROP INDEX `IDX_785667c5f78c26b2639da7d6e7` ON `support_subject_translation`", undefined);
        await queryRunner.query("DROP TABLE `support_subject_translation`", undefined);
   }

}
