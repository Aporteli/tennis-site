import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI (migrate, db push, introspect) uses this
    // Prefer DIRECT_URL (non-pooled) when available; fall back to DATABASE_URL
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
