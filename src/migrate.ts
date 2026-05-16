import { intro, select, text, spinner, outro, isCancel, cancel } from '@clack/prompts';
import { runMigrations, generateMigration, revertLastMigration } from '@vendure/core';
import { config } from './vendure-config';
import path from 'path';

async function main() {
  console.log();
  intro('🛠️  Vendure migrations');

  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'run', label: 'Run pending migrations' },
      { value: 'generate', label: 'Generate a new migration' },
      { value: 'revert', label: 'Revert the last migration' },
    ],
  });

  if (isCancel(action)) {
    cancel('Cancelled');
    process.exit(0);
  }

  if (action === 'run') {
    const s = spinner();
    s.start('Running migrations...');
    const ran = await runMigrations(config);
    s.stop(ran.length ? `Ran ${ran.length} migration(s)` : 'No pending migrations');
  }

  if (action === 'generate') {
    const name = await text({
      message: 'Enter a name for the migration',
      placeholder: 'add-custom-fields',
      validate: v =>
        /^[a-zA-Z][a-zA-Z0-9_-]+$/.test(v) ? undefined : 'Letters, numbers, dashes, underscores only',
    });
    if (isCancel(name)) {
      cancel('Cancelled');
      process.exit(0);
    }

    const s = spinner();
    s.start('Generating migration...');
    const migrations = config.dbConnectionOptions.migrations as string[];
    const outputDir = path.dirname(migrations[0]);
    const result = await generateMigration(config, { name, outputDir });
    s.stop(
      typeof result === 'string' ? `Generated: ${result}` : 'No schema changes — nothing generated',
    );
  }

  if (action === 'revert') {
    const s = spinner();
    s.start('Reverting last migration...');
    await revertLastMigration(config);
    s.stop('Reverted last migration');
  }

  outro('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
