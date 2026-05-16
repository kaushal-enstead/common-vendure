import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MarketplaceApiAuthGuard } from '../guards/marketplace-api-auth.guard';
import { MarketplaceApiSellersService } from '../services/marketplace-api-sellers.service';

@Controller('marketplace-api')
@UseGuards(MarketplaceApiAuthGuard)
export class SellersController {
    constructor(private sellersService: MarketplaceApiSellersService) {}

    @Get('sellers')
    getSellers(@Query('take') take = '20', @Query('skip') skip = '0') {
        return this.sellersService.findAll({
            take: Math.min(Math.max(+take || 20, 1), 100),
            skip: Math.max(+skip || 0, 0),
        });
    }
}
