import type { VendureConfig } from '@vendure/core';

export enum ProjectName {
  Evora = 'evora',
  Setubal = 'setubal',
  Alcobaca = 'alcobaca',
  Nobrinde = 'nobrinde',
}

export type ProjectVendureConfig = Partial<VendureConfig> & {
  migrationPath: string;
};
