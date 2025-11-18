import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';

export interface QaRunEntity {
  id: Id<'qaRun'>;
  createdAt: string;
  updatedAt: string;

  // App under test
  repoUrl: string;
  appName: string;
  branch: string;

  // Daytona workspace
  daytonaWorkspaceId: string;
  appLocalUrl: string;                // http://localhost:3000

  // Test execution
  testFlowIds: Id<'testFlow'>[];
  status: 'pending' | 'setting_up' | 'running_tests' | 'completed' | 'failed';

  // Results
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;

  // Recording (from browser-use)
  videoRecordingUrl: string | null;   // Full session video URL
  videoRecordingPath: string | null;  // Path in workspace

  // Error tracking
  errorMessage: string | null;

  // AI Failure Analysis
  aiAnalysisSummary: string | null;
  aiAnalysisRootCause: string | null;
  aiAnalysisRecommendations: string[] | null;
  aiAnalysisSeverity: 'critical' | 'high' | 'medium' | 'low' | null;

  // Timestamps
  startedAt: string | null;
  completedAt: string | null;
}

export const qaRunsTable = pgTable('qa_runs', {
  id: text('id').$type<Id<'qaRun'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  repoUrl: text('repo_url').notNull(),
  appName: text('app_name').notNull(),
  branch: text('branch').notNull().default('main'),
  daytonaWorkspaceId: text('daytona_workspace_id').notNull(),
  appLocalUrl: text('app_local_url').notNull().default('http://localhost:3000'),
  testFlowIds: jsonb('test_flow_ids').$type<Id<'testFlow'>[]>().notNull(),
  status: text('status').$type<QaRunEntity['status']>().notNull(),
  totalSteps: integer('total_steps').notNull().default(0),
  passedSteps: integer('passed_steps').notNull().default(0),
  failedSteps: integer('failed_steps').notNull().default(0),
  videoRecordingUrl: text('video_recording_url'),
  videoRecordingPath: text('video_recording_path'),
  errorMessage: text('error_message'),
  aiAnalysisSummary: text('ai_analysis_summary'),
  aiAnalysisRootCause: text('ai_analysis_root_cause'),
  aiAnalysisRecommendations: jsonb('ai_analysis_recommendations').$type<string[]>(),
  aiAnalysisSeverity: text('ai_analysis_severity').$type<QaRunEntity['aiAnalysisSeverity']>(),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});
