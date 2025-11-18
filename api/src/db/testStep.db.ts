import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';
import { qaRunsTable } from './qaRun.db';
import { testFlowsTable } from './testFlow.db';

export interface TestStepEntity {
  id: Id<'testStep'>;
  createdAt: string;

  // Relations
  qaRunId: Id<'qaRun'>;
  testFlowId: Id<'testFlow'>;

  // Step details
  stepNumber: number;
  actionName: string;      // e.g., "click", "input", "navigate"
  description: string;

  // Execution
  status: 'pending' | 'running' | 'passed' | 'failed';
  executedAt: string | null;

  // Visual capture (from browser-use)
  screenshotBase64: string | null;    // Screenshot after this action

  // Error tracking
  errorMessage: string | null;
  errorType: 'timeout' | 'element_not_found' | 'selector_error' | 'navigation_error' | 'click_error' | 'input_error' | 'assertion_error' | 'network_error' | 'runtime_error' | 'unknown_error' | null;
}

export const testStepsTable = pgTable('test_steps', {
  id: text('id').$type<Id<'testStep'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  qaRunId: text('qa_run_id').$type<Id<'qaRun'>>().references(() => qaRunsTable.id).notNull(),
  testFlowId: text('test_flow_id').$type<Id<'testFlow'>>().references(() => testFlowsTable.id).notNull(),
  stepNumber: integer('step_number').notNull(),
  actionName: text('action_name').notNull(),
  description: text('description').notNull(),
  status: text('status').$type<TestStepEntity['status']>().notNull(),
  executedAt: text('executed_at'),
  screenshotBase64: text('screenshot_base64'),
  errorMessage: text('error_message'),
  errorType: text('error_type').$type<TestStepEntity['errorType']>(),
});
