import type { VendureConfig } from '@vendure/core';

export enum ProjectName {
  Evora = 'evora',
  Barrious = 'barrious',
  Alcobaca = 'alcobaca',
}

export type ProjectVendureConfig = Partial<VendureConfig> & {
  migrationPath: string;
};
