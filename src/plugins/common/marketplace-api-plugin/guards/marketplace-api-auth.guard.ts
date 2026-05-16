import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { MARKETPLACE_API_SECRET } from '../constants';

@Injectable()
export class MarketplaceApiAuthGuard implements CanActivate {
    constructor(@Inject(MARKETPLACE_API_SECRET) private secret: string) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const incoming = req.headers['x-marketplace-secret'];
        if (!incoming || incoming !== this.secret) {
            throw new UnauthorizedException();
        }
        return true;
    }
}
