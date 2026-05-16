import type { VendureConfig } from '@vendure/core';

export enum ProjectName {
  Evora = 'evora',
  Setubal = 'setubal',
  Alcobaca = 'alcobaca',
}

export type ProjectVendureConfig = Partial<VendureConfig> & {
  migrationPath: string;
};
