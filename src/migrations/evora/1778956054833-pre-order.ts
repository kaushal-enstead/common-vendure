import {MigrationInterface, QueryRunner} from "typeorm";

export class PreOrder1778956054833 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `pre_order` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `quantity` decimal(10,2) NOT NULL DEFAULT '1.00', `deletedAt` datetime(6) NULL, `acceptedAt` timestamp NULL, `status` varchar(255) NOT NULL DEFAULT 'PENDING', `message` text NULL, `id` varchar(36) NOT NULL, `customerId` varchar(255) NULL, `productVariantId` varchar(36) NOT NULL, INDEX `IDX_045f5123810708914a2c3174bf` (`customerId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `pre_order_channels_channel` (`preOrderId` varchar(36) NOT NULL, `channelId` varchar(36) NOT NULL, INDEX `IDX_4697c3bfb17fe60ca974f72c1b` (`preOrderId`), INDEX `IDX_02e01aed7cc1ef1a0d1745be5e` (`channelId`), PRIMARY KEY (`preOrderId`, `channelId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `product` ADD `customFieldsIspreorder` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `order_line` ADD `customFieldsPreorderid` varchar(255) NULL DEFAULT ''", undefined);
        await queryRunner.query("ALTER TABLE `pre_order` ADD CONSTRAINT `FK_045f5123810708914a2c3174bf9` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `pre_order` ADD CONSTRAINT `FK_a6513e2414c8dfafa5eb7ffc747` FOREIGN KEY (`productVariantId`) REFERENCES `product_variant`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `pre_order_channels_channel` ADD CONSTRAINT `FK_4697c3bfb17fe60ca974f72c1bd` FOREIGN KEY (`preOrderId`) REFERENCES `pre_order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `pre_order_channels_channel` ADD CONSTRAINT `FK_02e01aed7cc1ef1a0d1745be5e4` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `pre_order_channels_channel` DROP FOREIGN KEY `FK_02e01aed7cc1ef1a0d1745be5e4`", undefined);
        await queryRunner.query("ALTER TABLE `pre_order_channels_channel` DROP FOREIGN KEY `FK_4697c3bfb17fe60ca974f72c1bd`", undefined);
        await queryRunner.query("ALTER TABLE `pre_order` DROP FOREIGN KEY `FK_a6513e2414c8dfafa5eb7ffc747`", undefined);
        await queryRunner.query("ALTER TABLE `pre_order` DROP FOREIGN KEY `FK_045f5123810708914a2c3174bf9`", undefined);
        await queryRunner.query("ALTER TABLE `order_line` DROP COLUMN `customFieldsPreorderid`", undefined);
        await queryRunner.query("ALTER TABLE `product` DROP COLUMN `customFieldsIspreorder`", undefined);
        await queryRunner.query("DROP INDEX `IDX_02e01aed7cc1ef1a0d1745be5e` ON `pre_order_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_4697c3bfb17fe60ca974f72c1b` ON `pre_order_channels_channel`", undefined);
        await queryRunner.query("DROP TABLE `pre_order_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_045f5123810708914a2c3174bf` ON `pre_order`", undefined);
        await queryRunner.query("DROP TABLE `pre_order`", undefined);
   }

}
