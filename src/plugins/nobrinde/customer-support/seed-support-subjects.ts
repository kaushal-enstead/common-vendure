import 'dotenv/config';

import { bootstrap, Logger, RequestContext } from '@vendure/core';
import { CustomerSupportPlugin } from './customer-support.plugin';
import { SupportSubjectService } from './services/support-subject.service';
import { LanguageCode } from '@vendure/common/lib/generated-types';
import { CreateSupportSubjectInput } from './gql/generated';
import { randomUUID } from 'node:crypto';

// Kill the server first and then run this script
// RUN npx ts-node ./src/plugins/customer-support/seed-support-subjects.ts

const sampleSupportSubjects: CreateSupportSubjectInput[] = [
  {
    code: 'general-inquiry',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'General Inquiry',
        description: 'General inquiry',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Consulta Geral',
        description: 'Consulta Geral',
      },
    ],
  },
  {
    code: 'technical-support',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Technical Support',
        description: 'Technical support',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Suporte Técnico',
        description: 'Suporte Técnico',
      },
    ],
  },
  {
    code: 'billing-question',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Billing Question',
        description: 'Billing question',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Questão de Faturação',
        description: 'Questão de Faturação',
      },
    ],
  },
  {
    code: 'order-status',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Order Status',
        description: 'Order status',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Estado da Encomenda',
        description: 'Estado da Encomenda',
      },
    ],
  },
  {
    code: 'product-question',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Product Question',
        description: 'Product question',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Questão sobre Produto',
        description: 'Questão sobre Produto',
      },
    ],
  },
  {
    code: 'complaint',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Complaint',
        description: 'Complaint',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Reclamação',
        description: 'Reclamação',
      },
    ],
  },
  {
    code: 'feature-request',
    isActive: true,
    translations: [
      {
        languageCode: LanguageCode.en,
        name: 'Feature Request',
        description: 'Feature request',
      },
      {
        languageCode: LanguageCode.pt,
        name: 'Pedido de Funcionalidade',
        description: 'Pedido de Funcionalidade',
      },
    ],
  },
];

const logCtx = 'Support Subject Seeder';

async function seedSupportSubjects() {
  const app = await bootstrap({
    plugins: [CustomerSupportPlugin.init({})],
    dbConnectionOptions: {
      type: 'mysql',
      synchronize: false,
      logging: false,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    },
  });

  const supportSubjectService = app.get(SupportSubjectService);
  const ctx = RequestContext.empty();

  Logger.info('Seeding support subjects...', logCtx);

  for (const subjectData of sampleSupportSubjects) {
    try {
      // We need to send id as randomUUID to avoid errors
      const newSubjectData = {
        ...subjectData,
        id: randomUUID(),
        translations: subjectData.translations.map(translation => ({
          ...translation,
          id: randomUUID(),
        })),
      } as any;
      await supportSubjectService.create(ctx, newSubjectData);
      Logger.info(`✓ Created support subject: ${subjectData.code}`, logCtx);
    } catch (error: any) {
      Logger.error(`✗ Failed to create support subject: ${subjectData.code}`, logCtx, error.stack);
    }
  }

  Logger.info('Support subjects seeding completed!', logCtx);
  await app.close();
}

if (require.main === module) {
  seedSupportSubjects().catch(Logger.error);
}

export { seedSupportSubjects };
