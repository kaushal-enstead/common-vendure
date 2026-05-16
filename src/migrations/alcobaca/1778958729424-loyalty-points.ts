import {MigrationInterface, QueryRunner} from "typeorm";

export class LoyaltyPoints1778958729424 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `loyalty_wallet_history` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `points` int NOT NULL DEFAULT '0', `balanceAfter` int NOT NULL DEFAULT '0', `prevBalance` int NOT NULL DEFAULT '0', `type` varchar(255) NOT NULL, `source` varchar(255) NOT NULL, `id` varchar(36) NOT NULL, `customerId` varchar(255) NOT NULL, `orderId` varchar(255) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `customer_custom_fields_history_loyalty_wallet_history` (`customerId` varchar(36) NOT NULL, `loyaltyWalletHistoryId` varchar(36) NOT NULL, INDEX `IDX_ba52a5bbf72294a7337c509883` (`customerId`), INDEX `IDX_68065df3efadeb8b9189596549` (`loyaltyWalletHistoryId`), PRIMARY KEY (`customerId`, `loyaltyWalletHistoryId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsPoints` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `customer` ADD `customFieldsFreezepoints` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` ADD `customFieldsPointspereuro` double NULL DEFAULT '100'", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` ADD `customFieldsMaxredeemablepoints` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsEnableloyaltydiscount` tinyint NULL", undefined);
        await queryRunner.query("ALTER TABLE `seller` ADD `customFieldsLoyaltydiscount` int NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `customer_custom_fields_history_loyalty_wallet_history` ADD CONSTRAINT `FK_ba52a5bbf72294a7337c5098838` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `customer_custom_fields_history_loyalty_wallet_history` ADD CONSTRAINT `FK_68065df3efadeb8b91895965496` FOREIGN KEY (`loyaltyWalletHistoryId`) REFERENCES `loyalty_wallet_history`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `customer_custom_fields_history_loyalty_wallet_history` DROP FOREIGN KEY `FK_68065df3efadeb8b91895965496`", undefined);
        await queryRunner.query("ALTER TABLE `customer_custom_fields_history_loyalty_wallet_history` DROP FOREIGN KEY `FK_ba52a5bbf72294a7337c5098838`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsLoyaltydiscount`", undefined);
        await queryRunner.query("ALTER TABLE `seller` DROP COLUMN `customFieldsEnableloyaltydiscount`", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` DROP COLUMN `customFieldsMaxredeemablepoints`", undefined);
        await queryRunner.query("ALTER TABLE `global_settings` DROP COLUMN `customFieldsPointspereuro`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsFreezepoints`", undefined);
        await queryRunner.query("ALTER TABLE `customer` DROP COLUMN `customFieldsPoints`", undefined);
        await queryRunner.query("DROP INDEX `IDX_68065df3efadeb8b9189596549` ON `customer_custom_fields_history_loyalty_wallet_history`", undefined);
        await queryRunner.query("DROP INDEX `IDX_ba52a5bbf72294a7337c509883` ON `customer_custom_fields_history_loyalty_wallet_history`", undefined);
        await queryRunner.query("DROP TABLE `customer_custom_fields_history_loyalty_wallet_history`", undefined);
        await queryRunner.query("DROP TABLE `loyalty_wallet_history`", undefined);
   }

}
