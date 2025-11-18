import { daytona } from './src/lib/daytona';
import { env } from './src/lib/env';
import { QaRunPython } from './src/service/qaRun/QaRun.python';

async function testPythonScript() {
  const WORKSPACE_ID = '6eb9ee10-883f-4662-9ee3-db84714504ed';

  console.log('🔍 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  // Generate test script with our fixed code
  const testFlow = {
    id: 'test_flow_manual',
    task: `
      Go to http://localhost:3000
      Click on the "Products" link
      Click on the "About" link
      Extract the page title
    `
  };

  const pythonScript = QaRunPython.generateTestScript(testFlow as any);

  console.log('📝 Generated Python script (first 500 chars):');
  console.log(pythonScript.substring(0, 500));
  console.log('...\n');

  // Write script to workspace
  const scriptPath = '/tmp/test_manual.py';
  console.log('📤 Uploading script to workspace...');
  await workspace.fs.uploadFile(Buffer.from(pythonScript), scriptPath);
  console.log('✅ Uploaded\n');

  // Execute the script
  console.log('🚀 Executing Python script...');
  const response = await workspace.process.executeCommand(
    `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && cd /tmp && python3 test_manual.py 2>&1`
  );

  console.log('Exit code:', response.exitCode);
  console.log('\n📄 Full output:');
  console.log(response.result || response.artifacts?.stdout || 'No output');

  // Try to parse JSON
  if (response.exitCode === 0) {
    try {
      const results = JSON.parse(response.result || '');
      console.log('\n✅ Successfully parsed JSON!');
      console.log('Success:', results.success);
      console.log('Steps:', results.steps?.length || 0);
    } catch (e) {
      console.log('\n❌ Failed to parse JSON:', e);
    }
  }
}

testPythonScript().catch(console.error);
