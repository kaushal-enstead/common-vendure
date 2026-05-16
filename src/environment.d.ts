export {};

// Here we declare the members of the process.env object, so that we
// can use them in our application code in a type-safe manner.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ENV: string;
      PORT: string;
      COOKIE_SECRET: string;
      SUPERADMIN_USERNAME: string;
      SUPERADMIN_PASSWORD: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_NAME: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      PROJECT_NAME?: string;
      VENDURE_SHOP_URL?: string;
      API_HOST?: string;
      MAIL_HOST?: string;
      MAIL_PORT?: number;
      MAIL_USERNAME?: string;
      MAIL_PASSWORD?: string;
      MAIL_MAILER?: string;
      MAIL_FROM_NAME?: string;
      MAIL_FROM_ADDRESS?: string;
      IS_LOCAL?: string;
      GEOANALITYCS_USERNAME?: string;
      GEOANALITYCS_PASSWORD?: string;
      EASYPAY_API_BASE_URL?: string;
      EASYPAY_API_KEY?: string;
      EASYPAY_ACCOUNT_UID?: string;
      EASYPAY_USE_MOCK?: string;
      DPD_API_URL?: string;
      DPD_CLIENT_ID?: string;
      DPD_CLIENT_SECRET?: string;
      DPD_USERNAME?: string;
      DPD_PASSWORD?: string;
      DPD_SERVICE_CODE_SHOP2HOME?: string;
      VIZITAR_API_BASE_URL?: string;
      VIZITAR_VISIT_ID?: string;
      VIZITAR_API_SECRET?: string;
      MARKETPLACE_API_SECRET?: string;
    }
  }
}
