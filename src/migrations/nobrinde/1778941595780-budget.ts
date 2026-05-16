import {MigrationInterface, QueryRunner} from "typeorm";

export class Budget1778941595780 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `budget_line` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `quantity` int NOT NULL, `orderPlacedQuantity` int NOT NULL DEFAULT '0', `listPriceIncludesTax` tinyint NOT NULL, `adjustments` text NOT NULL, `taxLines` text NOT NULL, `id` varchar(36) NOT NULL, `sellerChannelId` varchar(255) NULL, `shippingLineId` varchar(255) NULL, `productVariantId` varchar(255) NOT NULL, `taxCategoryId` varchar(255) NULL, `initialListPrice` int NULL, `listPrice` int NOT NULL, `featuredAssetId` varchar(36) NULL, `budgetId` varchar(36) NULL, INDEX `IDX_458fbba2fc4f5766c385727cdf` (`sellerChannelId`), INDEX `IDX_444e36eb3fc8ef62b7e665e884` (`productVariantId`), INDEX `IDX_37afdfd6cac6a1918a63e5298d` (`taxCategoryId`), INDEX `IDX_ff363515650286f575dd4560b0` (`featuredAssetId`), INDEX `IDX_397b4518d982abc4cc6d7ddbd9` (`budgetId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `budget` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `type` varchar(255) NOT NULL DEFAULT 'Admin', `code` varchar(255) NOT NULL, `state` varchar(255) NOT NULL, `active` tinyint NOT NULL DEFAULT 1, `orderPlacedAt` datetime NULL, `couponCodes` text NOT NULL, `messages` json NULL, `shippingAddress` text NOT NULL, `billingAddress` text NOT NULL, `currencyCode` varchar(255) NOT NULL, `id` varchar(36) NOT NULL, `aggregateOrderId` varchar(255) NULL, `customerId` varchar(255) NULL, `taxZoneId` varchar(255) NULL, `subTotal` int NOT NULL, `subTotalWithTax` int NOT NULL, `shipping` int NOT NULL DEFAULT '0', `shippingWithTax` int NOT NULL DEFAULT '0', INDEX `IDX_ff801bc9019e58fa30aa02813b` (`aggregateOrderId`), UNIQUE INDEX `IDX_a8b96820b2d7cc66ad39df9760` (`code`), INDEX `IDX_e2b339de2490dfd14122c4975f` (`orderPlacedAt`), INDEX `IDX_c096ba1d47568823685a8bd4e2` (`customerId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `budget_promotions_promotion` (`budgetId` varchar(36) NOT NULL, `promotionId` varchar(36) NOT NULL, INDEX `IDX_6b84cb29d3d7b9d9d6bd420cd0` (`budgetId`), INDEX `IDX_bac9422901e06cb0781328619b` (`promotionId`), PRIMARY KEY (`budgetId`, `promotionId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `budget_channels_channel` (`budgetId` varchar(36) NOT NULL, `channelId` varchar(36) NOT NULL, INDEX `IDX_3fcd78fa2c1132827d7773d874` (`budgetId`), INDEX `IDX_6b5ee26d62c5cddb2e0d781bce` (`channelId`), PRIMARY KEY (`budgetId`, `channelId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` ADD CONSTRAINT `FK_458fbba2fc4f5766c385727cdf2` FOREIGN KEY (`sellerChannelId`) REFERENCES `channel`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` ADD CONSTRAINT `FK_444e36eb3fc8ef62b7e665e884e` FOREIGN KEY (`productVariantId`) REFERENCES `product_variant`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` ADD CONSTRAINT `FK_37afdfd6cac6a1918a63e5298d4` FOREIGN KEY (`taxCategoryId`) REFERENCES `tax_category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` ADD CONSTRAINT `FK_ff363515650286f575dd4560b0f` FOREIGN KEY (`featuredAssetId`) REFERENCES `asset`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` ADD CONSTRAINT `FK_397b4518d982abc4cc6d7ddbd9b` FOREIGN KEY (`budgetId`) REFERENCES `budget`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget` ADD CONSTRAINT `FK_ff801bc9019e58fa30aa02813bb` FOREIGN KEY (`aggregateOrderId`) REFERENCES `budget`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget` ADD CONSTRAINT `FK_c096ba1d47568823685a8bd4e28` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `budget_promotions_promotion` ADD CONSTRAINT `FK_6b84cb29d3d7b9d9d6bd420cd04` FOREIGN KEY (`budgetId`) REFERENCES `budget`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `budget_promotions_promotion` ADD CONSTRAINT `FK_bac9422901e06cb0781328619b7` FOREIGN KEY (`promotionId`) REFERENCES `promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `budget_channels_channel` ADD CONSTRAINT `FK_3fcd78fa2c1132827d7773d8741` FOREIGN KEY (`budgetId`) REFERENCES `budget`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
        await queryRunner.query("ALTER TABLE `budget_channels_channel` ADD CONSTRAINT `FK_6b5ee26d62c5cddb2e0d781bcec` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `budget_channels_channel` DROP FOREIGN KEY `FK_6b5ee26d62c5cddb2e0d781bcec`", undefined);
        await queryRunner.query("ALTER TABLE `budget_channels_channel` DROP FOREIGN KEY `FK_3fcd78fa2c1132827d7773d8741`", undefined);
        await queryRunner.query("ALTER TABLE `budget_promotions_promotion` DROP FOREIGN KEY `FK_bac9422901e06cb0781328619b7`", undefined);
        await queryRunner.query("ALTER TABLE `budget_promotions_promotion` DROP FOREIGN KEY `FK_6b84cb29d3d7b9d9d6bd420cd04`", undefined);
        await queryRunner.query("ALTER TABLE `budget` DROP FOREIGN KEY `FK_c096ba1d47568823685a8bd4e28`", undefined);
        await queryRunner.query("ALTER TABLE `budget` DROP FOREIGN KEY `FK_ff801bc9019e58fa30aa02813bb`", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` DROP FOREIGN KEY `FK_397b4518d982abc4cc6d7ddbd9b`", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` DROP FOREIGN KEY `FK_ff363515650286f575dd4560b0f`", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` DROP FOREIGN KEY `FK_37afdfd6cac6a1918a63e5298d4`", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` DROP FOREIGN KEY `FK_444e36eb3fc8ef62b7e665e884e`", undefined);
        await queryRunner.query("ALTER TABLE `budget_line` DROP FOREIGN KEY `FK_458fbba2fc4f5766c385727cdf2`", undefined);
        await queryRunner.query("DROP INDEX `IDX_6b5ee26d62c5cddb2e0d781bce` ON `budget_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3fcd78fa2c1132827d7773d874` ON `budget_channels_channel`", undefined);
        await queryRunner.query("DROP TABLE `budget_channels_channel`", undefined);
        await queryRunner.query("DROP INDEX `IDX_bac9422901e06cb0781328619b` ON `budget_promotions_promotion`", undefined);
        await queryRunner.query("DROP INDEX `IDX_6b84cb29d3d7b9d9d6bd420cd0` ON `budget_promotions_promotion`", undefined);
        await queryRunner.query("DROP TABLE `budget_promotions_promotion`", undefined);
        await queryRunner.query("DROP INDEX `IDX_c096ba1d47568823685a8bd4e2` ON `budget`", undefined);
        await queryRunner.query("DROP INDEX `IDX_e2b339de2490dfd14122c4975f` ON `budget`", undefined);
        await queryRunner.query("DROP INDEX `IDX_a8b96820b2d7cc66ad39df9760` ON `budget`", undefined);
        await queryRunner.query("DROP INDEX `IDX_ff801bc9019e58fa30aa02813b` ON `budget`", undefined);
        await queryRunner.query("DROP TABLE `budget`", undefined);
        await queryRunner.query("DROP INDEX `IDX_397b4518d982abc4cc6d7ddbd9` ON `budget_line`", undefined);
        await queryRunner.query("DROP INDEX `IDX_ff363515650286f575dd4560b0` ON `budget_line`", undefined);
        await queryRunner.query("DROP INDEX `IDX_37afdfd6cac6a1918a63e5298d` ON `budget_line`", undefined);
        await queryRunner.query("DROP INDEX `IDX_444e36eb3fc8ef62b7e665e884` ON `budget_line`", undefined);
        await queryRunner.query("DROP INDEX `IDX_458fbba2fc4f5766c385727cdf` ON `budget_line`", undefined);
        await queryRunner.query("DROP TABLE `budget_line`", undefined);
   }

}
