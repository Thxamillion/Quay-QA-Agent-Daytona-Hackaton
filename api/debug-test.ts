import { daytona } from './src/lib/daytona';

const WORKSPACE_ID = 'd23f41e1-fa92-44ec-9121-b6f52157bb30'; // Most recent workspace

async function debugTest() {
  console.log('🔍 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);

  console.log('✅ Connected to workspace:', WORKSPACE_ID);

  // Check if browser-use is installed
  console.log('\n📦 Checking browser-use installation...');
  try {
    const pipCheck = await workspace.process.executeCommand('pip list | grep browser-use');
    console.log('browser-use packages:', pipCheck.result);
  } catch (e) {
    console.error('❌ Error checking browser-use:', e);
  }

  // Check Python version
  console.log('\n🐍 Checking Python version...');
  try {
    const pythonVersion = await workspace.process.executeCommand('python3 --version');
    console.log('Python version:', pythonVersion.result);
  } catch (e) {
    console.error('❌ Error checking Python:', e);
  }

  // List files in /tmp
  console.log('\n📁 Checking /tmp directory...');
  try {
    const tmpFiles = await workspace.process.executeCommand('ls -la /tmp/test_*.py');
    console.log('Test files:', tmpFiles.result);
  } catch (e) {
    console.log('No test files found in /tmp');
  }

  // Try to read the test script if it exists
  console.log('\n📄 Reading test script...');
  try {
    const script = await workspace.readFile('/tmp/test_testFlow_sample_1.py');
    console.log('Script content (first 500 chars):');
    console.log(script.substring(0, 500));
  } catch (e) {
    console.error('❌ Could not read test script:', e);
  }

  // Try to run the script and capture output
  console.log('\n🚀 Attempting to run test script...');
  try {
    const result = await workspace.process.executeCommand(
      'cd /tmp && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY python3 test_testFlow_sample_1.py 2>&1'
    );
    console.log('Script output:', result.result);
    console.log('Exit code:', result.exitCode);
  } catch (e) {
    console.error('❌ Error running script:', e);
  }
}

debugTest().catch(console.error);
