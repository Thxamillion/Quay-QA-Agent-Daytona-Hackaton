import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Daytona
  DAYTONA_API_KEY: z.string().min(1),
  DAYTONA_API_URL: z.string().url().default('https://api.daytona.io'),

  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Server
  PORT: z.string().default('3001'),
});

export const env = envSchema.parse(process.env);
