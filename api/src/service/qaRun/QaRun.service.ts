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
   * Execute a test flow using browser-use
   */
  static async executeTestFlow(
    qaRunId: Id<'qaRun'>,
    testFlow: TestFlowEntity,
    workspaceId: string
  ): Promise<any> {
    const workspace = await daytona.get(workspaceId);

    // 1. Generate Python script
    const pythonScript = QaRunPython.generateTestScript(testFlow);

    // 2. Write to workspace
    const scriptPath = `/tmp/test_${testFlow.id}.py`;
    await workspace.fs.uploadFile(Buffer.from(pythonScript), scriptPath);

    // 3. Execute Python script with Anthropic API key
    // Use export to ensure env var is properly set in the shell
    const response = await workspace.process.executeCommand(
      `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && cd /tmp && python3 test_${testFlow.id}.py 2>&1`
    );

    // 4. Parse results from stdout
    const output = response.result || response.artifacts?.stdout || '';
    console.log('Raw Python output:', output.substring(0, 500));

    // Check if output contains Python error (traceback)
    if (output.includes('Traceback') || output.includes('Error:')) {
      throw new Error(`Python script failed:\n${output}`);
    }

    // Check if Python script exited with error
    if (response.exitCode !== 0) {
      throw new Error(`Python script failed with exit code ${response.exitCode}:\n${output}`);
    }

    // Try to parse JSON, handle errors gracefully
    let results;
    try {
      results = JSON.parse(output);
    } catch (parseError) {
      throw new Error(`Failed to parse Python output as JSON. Output was:\n${output.substring(0, 1000)}`);
    }

    // 5. Save steps to database
    await this.saveTestResults(qaRunId, testFlow.id, results);

    // 6. Generate AI failure analysis if test failed
    if (!results.success) {
      const steps = await this.getSteps(qaRunId);
      const analysis = await FailureAnalysisService.analyzeFailure(
        testFlow,
        steps,
        results.extracted_content
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

    // 7. Save video recording
    if (results.video_path) {
      // TODO: Upload video to storage and get URL
      const videoUrl = results.video_path; // Placeholder
      await db.update(qaRunsTable)
        .set({
          videoRecordingUrl: videoUrl,
          videoRecordingPath: results.video_path,
        })
        .where(eq(qaRunsTable.id, qaRunId));
    }

    return results;
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
