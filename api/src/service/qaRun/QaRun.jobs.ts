import { inngestClient } from '@/lib/inngest-client';
import { QaRunService } from './QaRun.service';
import { TestFlowService } from '../testFlow/TestFlow.service';
import { WorkspaceService } from '../workspace/Workspace.service';
import type { Id } from '@/types';
import { db } from '@/lib/client';
import { qaRunsTable } from '@/db/qaRun.db';
import { eq } from 'drizzle-orm';

export const runQaTestsJob = inngestClient.createFunction(
  {
    id: 'run-qa-tests',
    name: 'Run QA Tests',
  },
  { event: 'qa/run' },
  async ({ event, step }) => {
    const { qaRunId } = event.data as { qaRunId: Id<'qaRun'> };

    // Get QA run
    const qaRun = await QaRunService.getById(qaRunId);
    if (!qaRun) {
      throw new Error(`QA run ${qaRunId} not found`);
    }

    // Get test flows
    const testFlows = await TestFlowService.getByIds(qaRun.testFlowIds);

    try {
      // Step 1: Create Daytona workspace
      const workspace = await step.run('create-workspace', async () => {
        await QaRunService.updateStatus(qaRunId, 'setting_up');
        return await WorkspaceService.createWorkspace({
          language: 'typescript',
          public: false,
        });
      });

      // Update workspace ID in database
      await step.run('update-workspace-id', async () => {
        await db
          .update(qaRunsTable)
          .set({
            daytonaWorkspaceId: workspace.id,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(qaRunsTable.id, qaRunId));
      });

      // Step 2: Setup app
      await step.run('setup-app', async () => {
        return await WorkspaceService.setupApp(
          workspace.id,
          qaRun.repoUrl,
          qaRun.branch
        );
      });

      // Step 3: Install browser-use (keep simple, skip browser install due to network restrictions)
      await step.run('install-browser-use', async () => {
        const workspace = await daytona.get(workspace.id);
        // Just install browser-use package, skip browser download
        await workspace.process.executeCommand('pip install browser-use');
        return { installed: true };
      });

      // Step 4: Run each test flow
      await QaRunService.updateStatus(qaRunId, 'running_tests');

      for (const testFlow of testFlows) {
        await step.run(`run-flow-${testFlow.id}`, async () => {
          return await QaRunService.executeTestFlow(
            qaRunId,
            testFlow,
            workspace.id
          );
        });
      }

      // Step 5: Mark as completed
      await step.run('finalize', async () => {
        await QaRunService.updateStatus(qaRunId, 'completed');
        await db
          .update(qaRunsTable)
          .set({
            completedAt: new Date().toISOString(),
          })
          .where(eq(qaRunsTable.id, qaRunId));
      });

      return { success: true };
    } catch (error) {
      // Mark as failed
      await QaRunService.updateStatus(
        qaRunId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
);
