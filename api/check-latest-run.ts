import { db } from './src/lib/client';
import { qaRunsTable } from './src/db/qaRun.db';
import { desc } from 'drizzle-orm';

async function checkLatestRun() {
  const [latestRun] = await db
    .select()
    .from(qaRunsTable)
    .orderBy(desc(qaRunsTable.createdAt))
    .limit(1);

  if (!latestRun) {
    console.log('No QA runs found');
    return;
  }

  console.log('Latest QA Run:');
  console.log('ID:', latestRun.id);
  console.log('Status:', latestRun.status);
  console.log('Workspace ID:', latestRun.daytonaWorkspaceId);
  console.log('Test Flow IDs:', latestRun.testFlowIds);
  console.log('Error Message:', latestRun.errorMessage);
  console.log('\nTo debug, update debug-python.ts with:');
  console.log(`  WORKSPACE_ID = '${latestRun.daytonaWorkspaceId}'`);
  console.log(`  TEST_FLOW_ID = '${latestRun.testFlowIds[0]}'`);
}

checkLatestRun().catch(console.error);
