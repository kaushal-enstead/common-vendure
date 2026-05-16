import dotenv from 'dotenv';

const argIdx = process.argv.indexOf('--env-path');
const envPath = (argIdx !== -1 ? process.argv[argIdx + 1] : undefined) ?? process.env.ENV_PATH ?? '.env';

dotenv.config({ path: envPath });
