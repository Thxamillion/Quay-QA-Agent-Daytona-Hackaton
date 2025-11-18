/**
 * Test commands inside Daytona workspace remotely
 * Run with: bun test-in-workspace.ts
 */

import { daytona } from './src/lib/daytona';
import { db } from './src/lib/client';
import { qaRunsTable } from './src/db/qaRun.db';
import { desc } from 'drizzle-orm';
import { env } from './src/lib/env';

async function testInWorkspace() {
  console.log('🔗 Getting latest workspace...\n');

  const [latestRun] = await db
    .select()
    .from(qaRunsTable)
    .orderBy(desc(qaRunsTable.createdAt))
    .limit(1);

  if (!latestRun || !latestRun.daytonaWorkspaceId) {
    console.log('❌ No workspace found');
    return;
  }

  const workspaceId = latestRun.daytonaWorkspaceId;
  console.log('📦 Workspace ID:', workspaceId);
  console.log();

  const workspace = await daytona.get(workspaceId);

  // Test 1: Check app status
  console.log('═'.repeat(80));
  console.log('TEST 1: Check if app is running');
  console.log('═'.repeat(80));

  const pm2Status = await workspace.process.executeCommand('pm2 list');
  console.log(pm2Status.result);
  console.log();

  const portCheck = await workspace.process.executeCommand('lsof -i :3000 2>&1 || echo "Port 3000 not listening"');
  console.log('Port 3000 status:', portCheck.result.trim());
  console.log();

  // Test 2: Check dependencies
  console.log('═'.repeat(80));
  console.log('TEST 2: Check if npm dependencies are installed');
  console.log('═'.repeat(80));

  const nodeModules = await workspace.process.executeCommand('ls -la ~/app/node_modules/.bin/next 2>&1');
  console.log(nodeModules.result);
  console.log();

  // Test 3: Check browser-use
  console.log('═'.repeat(80));
  console.log('TEST 3: Check if browser-use is installed');
  console.log('═'.repeat(80));

  const browserUse = await workspace.process.executeCommand('pip list | grep browser-use');
  console.log(browserUse.result || 'Not installed');
  console.log();

  const importTest = await workspace.process.executeCommand(
    'python3 -c "from browser_use import Agent, Browser, ChatAnthropic; print(\\"✅ Imports work\\")" 2>&1'
  );
  console.log(importTest.result);
  console.log();

  // Test 4: Check PM2 logs
  console.log('═'.repeat(80));
  console.log('TEST 4: PM2 Logs (last 30 lines)');
  console.log('═'.repeat(80));

  const logs = await workspace.process.executeCommand('pm2 logs app --lines 30 --nostream 2>&1');
  console.log(logs.result);
  console.log();

  // Test 5: Try to curl the app
  console.log('═'.repeat(80));
  console.log('TEST 5: HTTP request to localhost:3000');
  console.log('═'.repeat(80));

  const curlTest = await workspace.process.executeCommand('curl -I http://localhost:3000 2>&1 | head -10');
  console.log(curlTest.result);
  console.log();

  // Test 6: Check if test script exists
  console.log('═'.repeat(80));
  console.log('TEST 6: Check for test scripts');
  console.log('═'.repeat(80));

  const testScripts = await workspace.process.executeCommand('ls -lh /tmp/test_*.py 2>&1');
  console.log(testScripts.result);
  console.log();

  // Test 7: Try running a simple Python script with API key
  console.log('═'.repeat(80));
  console.log('TEST 7: Test ANTHROPIC_API_KEY environment variable');
  console.log('═'.repeat(80));

  const envTest = await workspace.process.executeCommand(
    `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && python3 -c "import os; key = os.environ.get('ANTHROPIC_API_KEY'); print(f'API key set: {bool(key)}'); print(f'Key length: {len(key) if key else 0}')"`
  );
  console.log(envTest.result);
  console.log();

  // Interactive prompt
  console.log('═'.repeat(80));
  console.log('💡 NEXT STEPS');
  console.log('═'.repeat(80));
  console.log();
  console.log('To run the actual test script, use:');
  console.log(`  bun run-test-in-workspace.ts ${workspaceId}`);
  console.log();
  console.log('Or manually execute:');
  console.log(`  export ANTHROPIC_API_KEY="..." && cd /tmp && python3 test_*.py`);
}

testInWorkspace().catch(console.error);
