import type { ProjectVendureConfig } from './types';
import { ProjectName } from './types';
import { evoraConfig } from './evora/vendure-config';
import { barriosConfig } from './barrious/vendure-config';
import { alcobacaConfig } from './alcobaca/vendure-config';

const registry: Record<ProjectName, ProjectVendureConfig> = {
  [ProjectName.Evora]: evoraConfig,
  [ProjectName.Barrious]: barriosConfig,
  [ProjectName.Alcobaca]: alcobacaConfig,
};

export function getProject(name?: string): ProjectVendureConfig {
  const key = (name ?? ProjectName.Evora) as ProjectName;
  const project = registry[key];
  if (!project) {
    const known = Object.values(ProjectName).join(', ');
    throw new Error(`Unknown project "${key}". Known projects: ${known}`);
  }
  return project;
}
