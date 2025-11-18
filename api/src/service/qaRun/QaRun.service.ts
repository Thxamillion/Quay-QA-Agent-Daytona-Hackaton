import { db } from '@/lib/client';
import { daytona } from '@/lib/daytona';
import { env } from '@/lib/env';
import { qaRunsTable, type QaRunEntity } from '@/db/qaRun.db';
import { testStepsTable, type TestStepEntity } from '@/db/testStep.db';
import type { TestFlowEntity } from '@/db/testFlow.db';
import { generateId, type Id } from '@/types';
import { eq } from 'drizzle-orm';
import { QaRunPython } from './QaRun.python';
import { inngestClient } from '@/lib/inngest-client';
import { FailureAnalysisService } from '../ai/FailureAnalysis.service';
import { ComputerUseAgent } from '../computerUse/ComputerUseAgent.service';

export abstract class QaRunService {
  /**
   * Create QA run and trigger background job
   */
  static async create(data: {
    repoUrl: string;
    appName: string;
    branch: string;
    testFlowIds: Id<'testFlow'>[];
  }): Promise<QaRunEntity> {
    const qaRun: QaRunEntity = {
      id: generateId('qaRun'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repoUrl: data.repoUrl,
      appName: data.appName,
      branch: data.branch,
      daytonaWorkspaceId: '', // Will be set by job
      appLocalUrl: 'http://localhost:3000',
      testFlowIds: data.testFlowIds,
      status: 'pending',
      totalSteps: 0,
      passedSteps: 0,
      failedSteps: 0,
      videoRecordingUrl: null,
      videoRecordingPath: null,
      errorMessage: null,
      aiAnalysisSummary: null,
      aiAnalysisRootCause: null,
      aiAnalysisRecommendations: null,
      aiAnalysisSeverity: null,
      startedAt: null,
      completedAt: null,
    };

    // Save to database
    await db.insert(qaRunsTable).values(qaRun);

    // Trigger Inngest job
    await inngestClient.send({
      name: 'qa/run',
      data: { qaRunId: qaRun.id },
    });

    return qaRun;
  }

  /**
   * Get QA run by ID
   */
  static async getById(id: Id<'qaRun'>): Promise<QaRunEntity | null> {
    const [qaRun] = await db
      .select()
      .from(qaRunsTable)
      .where(eq(qaRunsTable.id, id));

    return qaRun || null;
  }

  /**
   * Get all QA runs
   */
  static async getAll(): Promise<QaRunEntity[]> {
    return await db.select().from(qaRunsTable);
  }

  /**
   * Update QA run status
   */
  static async updateStatus(
    id: Id<'qaRun'>,
    status: QaRunEntity['status'],
    errorMessage?: string
  ): Promise<void> {
    await db
      .update(qaRunsTable)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qaRunsTable.id, id));
  }

  /**
   * Execute a test flow using Computer Use + Claude Vision
   */
  static async executeTestFlow(
    qaRunId: Id<'qaRun'>,
    testFlow: TestFlowEntity,
    workspaceId: string
  ): Promise<any> {
    console.log('Executing test flow with Computer Use:', testFlow.name);

    // Use Computer Use instead of browser-use
    const result = await ComputerUseAgent.executeTask(
      workspaceId,
      testFlow.task,
      15  // max steps
    );

    // Convert to same format as before for database
    const steps = result.steps.map((step, i) => ({
      stepNumber: i + 1,
      action: step.action.description || step.action.type,
      status: step.action.type === 'failed' ? 'failed' : 'passed',
      screenshot: step.screenshot,
      error: step.action.type === 'failed' ? step.action.reason : null,
      errorType: step.action.type === 'failed' ? 'task_failure' : null
    }));

    // Save test results to database
    await this.saveTestResults(qaRunId, testFlow.id, {
      success: result.success,
      steps,
      extracted_content: result.result || result.error
    });

    // Generate AI failure analysis if test failed
    if (!result.success) {
      const savedSteps = await this.getSteps(qaRunId);
      const analysis = await FailureAnalysisService.analyzeFailure(
        testFlow,
        savedSteps,
        result.error || 'Test failed'
      );

      await db.update(qaRunsTable)
        .set({
          aiAnalysisSummary: analysis.summary,
          aiAnalysisRootCause: analysis.rootCause,
          aiAnalysisRecommendations: analysis.recommendations,
          aiAnalysisSeverity: analysis.severity,
        })
        .where(eq(qaRunsTable.id, qaRunId));
    }

    return result;
  }

  /**
   * Save test results to database
   */
  static async saveTestResults(
    qaRunId: Id<'qaRun'>,
    testFlowId: Id<'testFlow'>,
    results: any
  ): Promise<void> {
    const steps = results.steps || [];

    // Create test steps with proper error tracking
    let passedCount = 0;
    let failedCount = 0;

    for (const stepData of steps) {
      const step: TestStepEntity = {
        id: generateId('testStep'),
        createdAt: new Date().toISOString(),
        qaRunId,
        testFlowId,
        stepNumber: stepData.stepNumber,
        actionName: stepData.action,
        description: `Step ${stepData.stepNumber}: ${stepData.action}`,
        status: stepData.status,  // 'passed' or 'failed' from browser-use
        executedAt: new Date().toISOString(),
        screenshotBase64: stepData.screenshot || null,
        errorMessage: stepData.error || null,
        errorType: stepData.errorType || null,
      };

      await db.insert(testStepsTable).values(step);

      // Count passed/failed
      if (stepData.status === 'passed') {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    // Update QA run stats
    await db.update(qaRunsTable)
      .set({
        totalSteps: steps.length,
        passedSteps: passedCount,
        failedSteps: failedCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qaRunsTable.id, qaRunId));
  }

  /**
   * Get test steps for QA run
   */
  static async getSteps(qaRunId: Id<'qaRun'>): Promise<TestStepEntity[]> {
    return await db
      .select()
      .from(testStepsTable)
      .where(eq(testStepsTable.qaRunId, qaRunId));
  }
}
