import { daytona } from './src/lib/daytona';
import { env } from './src/lib/env';

const WORKSPACE_ID = '23a46e35-6195-42cd-be28-a5336cc31d1d';
const TEST_FLOW_ID = 'testFlow_bvmkqanslyxyg7nm';

async function debugPython() {
  console.log('🔍 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  // Check if API key is set locally
  console.log('🔑 Checking ANTHROPIC_API_KEY...');
  console.log('   Key set:', !!env.ANTHROPIC_API_KEY);
  console.log('   Key length:', env.ANTHROPIC_API_KEY?.length || 0);
  console.log('   Key preview:', env.ANTHROPIC_API_KEY?.substring(0, 20) + '...\n');

  // Run the Python script with fixed approach
  console.log('🐍 Running Python script with export command...');
  try {
    const result = await workspace.process.executeCommand(
      `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && cd /tmp && python3 test_${TEST_FLOW_ID}.py 2>&1`
    );

    console.log('Exit code:', result.exitCode);
    console.log('\n📄 Full output:');
    console.log(result.result || result.artifacts?.stdout || '(empty)');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  }
}

debugPython().catch(console.error);
