import {MigrationInterface, QueryRunner} from "typeorm";

export class Review1778954936526 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `review` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `type` varchar(255) NOT NULL, `comment` varchar(255) NULL, `public` tinyint NOT NULL DEFAULT 1, `rating` float NULL, `sellerId` varchar(255) NULL, `productId` varchar(255) NULL, `bookingId` varchar(255) NULL, `customerId` varchar(255) NULL, `deletedAt` datetime(6) NULL, `id` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `review` ADD CONSTRAINT `FK_e4d7f0ae06cc3b06f3d0af133d4` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `review` ADD CONSTRAINT `FK_4afd4e629c7e065272b3932617d` FOREIGN KEY (`sellerId`) REFERENCES `seller`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `review` ADD CONSTRAINT `FK_2a11d3c0ea1b2b5b1790f762b9a` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `review` ADD CONSTRAINT `FK_5672298e363f80650319557e8ce` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `review` DROP FOREIGN KEY `FK_5672298e363f80650319557e8ce`", undefined);
        await queryRunner.query("ALTER TABLE `review` DROP FOREIGN KEY `FK_2a11d3c0ea1b2b5b1790f762b9a`", undefined);
        await queryRunner.query("ALTER TABLE `review` DROP FOREIGN KEY `FK_4afd4e629c7e065272b3932617d`", undefined);
        await queryRunner.query("ALTER TABLE `review` DROP FOREIGN KEY `FK_e4d7f0ae06cc3b06f3d0af133d4`", undefined);
        await queryRunner.query("DROP TABLE `review`", undefined);
   }

}
