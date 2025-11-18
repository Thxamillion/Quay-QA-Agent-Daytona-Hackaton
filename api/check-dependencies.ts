import { daytona } from './src/lib/daytona';

const WORKSPACE_ID = '23a46e35-6195-42cd-be28-a5336cc31d1d';

async function checkDependencies() {
  console.log('🔗 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  // Check where we are
  console.log('📂 Current working directory:');
  const pwd = await workspace.process.executeCommand('pwd');
  console.log(pwd.result);
  console.log();

  // Check app directory
  console.log('📂 Checking app directory structure...');
  const lsApp = await workspace.process.executeCommand('ls -la app/ 2>&1');
  console.log(lsApp.result);
  console.log();

  // Check if node_modules exists in app dir
  console.log('📦 Checking node_modules in app/...');
  const nodeModules = await workspace.process.executeCommand('ls -la app/node_modules/.bin/next 2>&1');
  console.log(nodeModules.result);
  console.log();

  // Check package.json
  console.log('📄 Checking package.json...');
  const packageJson = await workspace.process.executeCommand('cat app/package.json 2>&1 | head -30');
  console.log(packageJson.result);
  console.log();

  // Try running next directly
  console.log('🧪 Testing next command in app directory...');
  const nextTest = await workspace.process.executeCommand('cd app && ./node_modules/.bin/next --version 2>&1');
  console.log(nextTest.result);
  console.log();

  // Check PM2 working directory
  console.log('📋 PM2 process details...');
  const pm2Show = await workspace.process.executeCommand('pm2 show app 2>&1');
  console.log(pm2Show.result);
}

checkDependencies().catch(console.error);
