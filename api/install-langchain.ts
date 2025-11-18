import { daytona } from './src/lib/daytona';

async function installLangchain() {
  // Get workspace ID from test #11
  const WORKSPACE_ID = '6eb9ee10-883f-4662-9ee3-db84714504ed';

  console.log('🔍 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  console.log('📦 Installing langchain-anthropic...');
  const result = await workspace.process.executeCommand(
    'pip install langchain-anthropic'
  );

  console.log('Exit code:', result.exitCode);
  console.log('Output:', result.result);
  console.log('\n✅ Done!');
}

installLangchain().catch(console.error);
