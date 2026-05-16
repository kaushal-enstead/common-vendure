import { EmailEventListener } from '@vendure/email-plugin';
import { SellerApprovalEvent, SellerRejectionEvent } from './event-types';
import { LanguageCode, RequestContext } from '@vendure/core';

const sellerApprovalHandler = new EmailEventListener('seller-approval')
    .on(SellerApprovalEvent)
    .setRecipient(event => event.email)
    .setSubject(event => {
        switch (event.ctx.languageCode) {
            case LanguageCode.pt:
            case LanguageCode.pt_PT:
                return 'A tua inscrição como vendedor foi aprovada';
            default:
                return 'Your seller registration was approved';
        }
    })
    .setTemplateVars(event => ({
        name: event.name,
    }))
    .setFrom('{{ fromAddress }}')
    .setMockEvent(
        new SellerApprovalEvent(RequestContext.empty(), '23sd34343sd', 'test Seller', 'test@test.com'),
    );

const sellerRejectionHandler = new EmailEventListener('seller-rejection')
    .on(SellerRejectionEvent)
    .setRecipient(event => event.email)
    .setSubject(event => {
        switch (event.ctx.languageCode) {
            case LanguageCode.pt:
            case LanguageCode.pt_PT:
                return 'A tua inscrição como vendedor não foi aprovada';
            default:
                return 'Your seller registration was not approved';
        }
    })
    .setTemplateVars(event => ({
        name: event.name,
        reason: event.reason,
    }))
    .setFrom('{{ fromAddress }}')
    .setMockEvent(
        new SellerRejectionEvent(
            RequestContext.empty(),
            '23sd34343sd',
            'test Seller',
            'test@test.com',
            'You were rejected',
        ),
    );

export { sellerRejectionHandler, sellerApprovalHandler };
