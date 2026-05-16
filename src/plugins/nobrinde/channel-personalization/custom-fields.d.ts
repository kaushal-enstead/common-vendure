import '@vendure/core';
import { Asset } from '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomChannelFields {
    logo?: Asset;
    favicon?: Asset;
    colors?: {
      primary?: string;
      secondary?: string;
      foreground?: string;
      background?: string;
    };
    fontFamily?: string;
    storeDisplayName?: string;
    privacyPolicyUrl?: string;
    storeAddress?: string;
    emailHeaderText?: string;
    emailFooterText?: string;
    fromEmail?: string;
    replyToEmail?: string;
    supportEmail?: string;
    billingEmail?: string;
    channelDomain?: string;
    certificateProvider?: string;
    certificateRef?: string;
    certificateStatus?: string;
    tlsEnforced?: boolean;
  }
}
