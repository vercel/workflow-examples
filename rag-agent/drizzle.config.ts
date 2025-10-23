import type { Config } from 'drizzle-kit';
import './envConfig';

export default {
  schema: './lib/db/schema',
  dialect: 'postgresql',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
