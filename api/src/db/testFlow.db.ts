import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';

export interface TestFlowEntity {
  id: Id<'testFlow'>;
  createdAt: string;
  name: string;
  description: string;

  // Natural language task for browser-use agent
  task: string;  // e.g., "Go to localhost:3000, login with test@example.com, verify dashboard"

  // Is this a pre-built demo flow?
  isDemo: boolean;
}

export const testFlowsTable = pgTable('test_flows', {
  id: text('id').$type<Id<'testFlow'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  task: text('task').notNull(),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(0),
});
