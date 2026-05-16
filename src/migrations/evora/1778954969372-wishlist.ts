import {MigrationInterface, QueryRunner} from "typeorm";

export class Wishlist1778954969372 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `wishlist` (`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `type` varchar(255) NOT NULL, `sellerId` varchar(255) NULL, `productId` varchar(255) NULL, `bookingId` varchar(255) NULL, `customerId` varchar(255) NULL, `id` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` ADD CONSTRAINT `FK_e0cb3d07cc2e5a632af0fade798` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` ADD CONSTRAINT `FK_e80463611d190214d0bc396eded` FOREIGN KEY (`sellerId`) REFERENCES `seller`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` ADD CONSTRAINT `FK_17e00e49d77ccaf7ff0e14de37b` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` ADD CONSTRAINT `FK_e39975e2c6b2dbdccea291b46c2` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `wishlist` DROP FOREIGN KEY `FK_e39975e2c6b2dbdccea291b46c2`", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` DROP FOREIGN KEY `FK_17e00e49d77ccaf7ff0e14de37b`", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` DROP FOREIGN KEY `FK_e80463611d190214d0bc396eded`", undefined);
        await queryRunner.query("ALTER TABLE `wishlist` DROP FOREIGN KEY `FK_e0cb3d07cc2e5a632af0fade798`", undefined);
        await queryRunner.query("DROP TABLE `wishlist`", undefined);
   }

}
