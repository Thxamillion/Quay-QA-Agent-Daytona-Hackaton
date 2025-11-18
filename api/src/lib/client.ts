import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';

// PostgreSQL connection
const queryClient = postgres(env.DATABASE_URL);

// Drizzle ORM client
export const db = drizzle(queryClient);
