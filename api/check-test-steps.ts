import { db } from './src/lib/client';
import { qaRunsTable } from './src/db/qaRun.db';
import { testStepsTable } from './src/db/testStep.db';
import { desc, eq } from 'drizzle-orm';

async function checkTestSteps() {
  // Get latest run
  const [latestRun] = await db
    .select()
    .from(qaRunsTable)
    .orderBy(desc(qaRunsTable.createdAt))
    .limit(1);

  if (!latestRun) {
    console.log('No QA runs found');
    return;
  }

  console.log('📊 Latest QA Run Details:');
  console.log('ID:', latestRun.id);
  console.log('Status:', latestRun.status);
  console.log('Created:', latestRun.createdAt);
  console.log('Started:', latestRun.startedAt);
  console.log('Completed:', latestRun.completedAt);
  console.log('Total Steps:', latestRun.totalSteps);
  console.log('Passed Steps:', latestRun.passedSteps);
  console.log('Failed Steps:', latestRun.failedSteps);
  console.log('Error Message:', latestRun.errorMessage);
  console.log('Workspace ID:', latestRun.daytonaWorkspaceId);
  console.log();

  // Get test steps for this run
  const steps = await db
    .select()
    .from(testStepsTable)
    .where(eq(testStepsTable.qaRunId, latestRun.id));

  console.log('🔍 Test Steps:', steps.length);
  if (steps.length > 0) {
    console.log();
    steps.forEach((step, i) => {
      console.log(`Step ${step.stepNumber}:`);
      console.log(`  Action: ${step.actionName}`);
      console.log(`  Status: ${step.status}`);
      console.log(`  Error: ${step.errorMessage || 'None'}`);
      console.log(`  Screenshot: ${step.screenshotBase64 ? 'Yes' : 'No'}`);
      console.log();
    });
  } else {
    console.log('⚠️  No test steps found - tests may not have run!');
  }

  // Get all recent runs for comparison
  console.log('\n📋 Recent QA Runs:');
  const recentRuns = await db
    .select()
    .from(qaRunsTable)
    .orderBy(desc(qaRunsTable.createdAt))
    .limit(5);

  recentRuns.forEach(run => {
    console.log(`${run.id.substring(0, 20)}... | ${run.status.padEnd(15)} | Steps: ${run.totalSteps} | Created: ${run.createdAt.substring(11, 19)}`);
  });
}

checkTestSteps().catch(console.error);
