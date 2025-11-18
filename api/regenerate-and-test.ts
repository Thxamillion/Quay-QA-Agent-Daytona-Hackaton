import { daytona } from './src/lib/daytona';
import { db } from './src/lib/client';
import { testFlowsTable } from './src/db/testFlow.db';
import { env } from './src/lib/env';
import { QaRunPython } from './src/service/qaRun/QaRun.python';
import { eq } from 'drizzle-orm';

const WORKSPACE_ID = '23a46e35-6195-42cd-be28-a5336cc31d1d';
const TEST_FLOW_ID = 'testFlow_bvmkqanslyxyg7nm';

async function regenerateAndTest() {
  console.log('🔍 Getting test flow...');
  const [testFlow] = await db
    .select()
    .from(testFlowsTable)
    .where(eq(testFlowsTable.id, TEST_FLOW_ID));

  if (!testFlow) {
    console.error('❌ Test flow not found');
    return;
  }

  console.log('✅ Found test flow:', testFlow.name);

  console.log('\n🔗 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  // Generate new Python script with updated code
  console.log('📝 Generating new Python script...');
  const pythonScript = QaRunPython.generateTestScript(testFlow);

  console.log('Script preview (first 800 chars):');
  console.log('─'.repeat(80));
  console.log(pythonScript.substring(0, 800));
  console.log('─'.repeat(80));

  // Write to workspace
  console.log('\n📤 Uploading script to workspace...');
  const scriptPath = `/tmp/test_${TEST_FLOW_ID}.py`;
  await workspace.fs.uploadFile(Buffer.from(pythonScript), scriptPath);
  console.log('✅ Script uploaded\n');

  // Verify the script was written correctly
  console.log('🔍 Verifying script was uploaded...');
  const catResult = await workspace.process.executeCommand(`wc -l ${scriptPath}`);
  console.log(`   Lines in script: ${catResult.result.trim()}\n`);

  // Check if API key is set
  console.log('🔑 Checking ANTHROPIC_API_KEY...');
  console.log(`   Key length: ${env.ANTHROPIC_API_KEY?.length || 0}\n`);

  // Run the Python script with the fixed approach
  console.log('🚀 Running Python script...');
  console.log('   Command: export ANTHROPIC_API_KEY="..." && cd /tmp && python3 test_*.py 2>&1\n');

  const result = await workspace.process.executeCommand(
    `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && cd /tmp && python3 test_${TEST_FLOW_ID}.py 2>&1`
  );

  console.log('📊 Exit code:', result.exitCode);
  console.log('\n📄 Full output:');
  console.log('═'.repeat(80));
  console.log(result.result || result.artifacts?.stdout || '(empty)');
  console.log('═'.repeat(80));

  // Try to parse as JSON
  if (result.exitCode === 0) {
    try {
      const parsed = JSON.parse(result.result || '{}');
      console.log('\n✅ Successfully parsed JSON!');
      console.log('   Success:', parsed.success);
      console.log('   Steps:', parsed.steps?.length || 0);
    } catch (e) {
      console.log('\n❌ Failed to parse output as JSON');
    }
  }
}

regenerateAndTest().catch(console.error);
