/**
 * Manual QA Test Runner
 * Run with: bun manual-test.ts
 *
 * This script manually executes all the steps that Inngest job does,
 * so you can see exactly where it fails.
 */

import { WorkspaceService } from './src/service/workspace/Workspace.service';
import { QaRunService } from './src/service/qaRun/QaRun.service';
import { TestFlowService } from './src/service/testFlow/TestFlow.service';
import { db } from './src/lib/client';
import { qaRunsTable } from './src/db/qaRun.db';
import { desc } from 'drizzle-orm';

async function manualTest() {
  console.log('🚀 Manual QA Test Runner\n');

  // Get the latest QA run to use its config
  const [latestRun] = await db
    .select()
    .from(qaRunsTable)
    .orderBy(desc(qaRunsTable.createdAt))
    .limit(1);

  if (!latestRun) {
    console.log('❌ No QA runs found');
    return;
  }

  console.log('📋 Using config from latest run:');
  console.log(`   Repo: ${latestRun.repoUrl}`);
  console.log(`   Branch: ${latestRun.branch}`);
  console.log(`   Test Flows: ${latestRun.testFlowIds.join(', ')}`);
  console.log();

  let workspaceId: string;

  // Option 1: Use existing workspace if you want to skip setup
  const USE_EXISTING_WORKSPACE = true; // Set to false to create new workspace

  if (USE_EXISTING_WORKSPACE && latestRun.daytonaWorkspaceId) {
    console.log('♻️  Using existing workspace:', latestRun.daytonaWorkspaceId);
    workspaceId = latestRun.daytonaWorkspaceId;
    console.log();
  } else {
    // Step 1: Create workspace
    console.log('📦 Step 1: Creating Daytona workspace...');
    try {
      const workspace = await WorkspaceService.createWorkspace({
        language: 'typescript',
        public: false,
      });
      workspaceId = workspace.id;
      console.log('✅ Workspace created:', workspaceId);
      console.log();
    } catch (error: any) {
      console.error('❌ Failed to create workspace:', error.message);
      return;
    }

    // Step 2: Setup app
    console.log('🔧 Step 2: Setting up app (clone repo, npm install, start server)...');
    console.log('   This will take a while...');
    try {
      const result = await WorkspaceService.setupApp(
        workspaceId,
        latestRun.repoUrl,
        latestRun.branch
      );
      console.log('✅ App setup complete:', result);
      console.log();
    } catch (error: any) {
      console.error('❌ Failed to setup app:', error.message);
      console.log('\n💡 This is likely where Inngest is failing!');
      return;
    }

    // Step 3: Install browser-use
    console.log('🐍 Step 3: Installing browser-use...');
    try {
      await WorkspaceService.installBrowserUse(workspaceId);
      console.log('✅ browser-use installed');
      console.log();
    } catch (error: any) {
      console.error('❌ Failed to install browser-use:', error.message);
      return;
    }
  }

  // Step 4: Run test flows
  console.log('🧪 Step 4: Running test flows...');

  const testFlows = await TestFlowService.getByIds(latestRun.testFlowIds);
  console.log(`   Found ${testFlows.length} test flow(s)\n`);

  for (let i = 0; i < testFlows.length; i++) {
    const testFlow = testFlows[i];
    console.log(`\n📝 Running test flow ${i + 1}/${testFlows.length}: ${testFlow.name}`);
    console.log('─'.repeat(80));
    console.log('Task:');
    console.log(testFlow.task);
    console.log('─'.repeat(80));
    console.log();

    try {
      console.log('⏳ Executing (this may take a while)...\n');

      const result = await QaRunService.executeTestFlow(
        latestRun.id,
        testFlow,
        workspaceId
      );

      console.log('\n✅ Test flow completed!');
      console.log('   Success:', result.success);
      console.log('   Steps:', result.steps?.length || 0);
      console.log('   Extracted content:', result.extracted_content?.substring(0, 100) || 'None');
      console.log();

      if (result.steps && result.steps.length > 0) {
        console.log('   Step details:');
        result.steps.forEach((step: any, idx: number) => {
          console.log(`   ${idx + 1}. ${step.action} - ${step.status}`);
          if (step.error) {
            console.log(`      Error: ${step.error}`);
          }
        });
      }

    } catch (error: any) {
      console.error('\n❌ Test flow failed:', error.message);
      console.log('\n💡 Full error:');
      console.log(error);
      return;
    }
  }

  console.log('\n🎉 All test flows completed successfully!');
}

manualTest().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
