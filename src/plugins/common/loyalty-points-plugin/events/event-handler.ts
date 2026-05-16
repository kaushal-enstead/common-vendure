import { EmailEventListener } from '@vendure/email-plugin';
import { LoyaltyPointsRedeemEvent, LoyaltyPointsEarnEvent } from './event-types';
import { LanguageCode, RequestContext } from '@vendure/core';

const loyaltyPointsEarnHandler = new EmailEventListener('loyalty-points-earn')
    .on(LoyaltyPointsEarnEvent)
    .setRecipient(event => event.email)
    .setSubject(event => {
        switch (event.ctx.languageCode) {
            case LanguageCode.pt:
            case LanguageCode.pt_PT:
                return `Os teus pontos de fidelidade foram creditados`;
            default:
                return `Your loyalty points have been credited`;
        }
    })
    .setTemplateVars(event => ({
        earned: event.points,
        balance: event.balance,
        orderId: event.orderId,
    }))
    .setFrom('{{ fromAddress }}')
    .setMockEvent(
        new LoyaltyPointsEarnEvent(RequestContext.empty(), 'test@test.com', 10, 100, 'shd3h4yu34u'),
    );

const loyaltyPointsRedeemHandler = new EmailEventListener('loyalty-points-redeem')
    .on(LoyaltyPointsRedeemEvent)
    .setRecipient(event => event.email)
    .setSubject(event => {
        switch (event.ctx.languageCode) {
            case LanguageCode.pt:
            case LanguageCode.pt_PT:
                return `Os seus pontos de fidelidade foram resgatados`;
            default:
                return `Your loyalty points have been redeemed`;
        }
    })
    .setTemplateVars(event => ({
        earned: event.points,
        balance: event.balance,
        orderId: event.orderId,
    }))
    .setFrom('{{ fromAddress }}')
    .setMockEvent(
        new LoyaltyPointsRedeemEvent(RequestContext.empty(), 'test@test.com', 10, 100, 'shd3h4yu34u'),
    );

export { loyaltyPointsEarnHandler, loyaltyPointsRedeemHandler };
