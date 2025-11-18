import { daytona } from './src/lib/daytona';

const WORKSPACE_ID = '23a46e35-6195-42cd-be28-a5336cc31d1d';

async function checkAppStatus() {
  console.log('🔗 Connecting to workspace...');
  const workspace = await daytona.get(WORKSPACE_ID);
  console.log('✅ Connected\n');

  // Check if pm2 is running
  console.log('📋 Checking PM2 status...');
  const pm2Status = await workspace.process.executeCommand('pm2 list');
  console.log(pm2Status.result);
  console.log();

  // Check if port 3000 is listening
  console.log('🔍 Checking if port 3000 is listening...');
  const portCheck = await workspace.process.executeCommand('lsof -i :3000 || netstat -tuln | grep 3000 || echo "Port 3000 not listening"');
  console.log(portCheck.result);
  console.log();

  // Try to curl localhost:3000
  console.log('🌐 Testing HTTP request to localhost:3000...');
  const curlTest = await workspace.process.executeCommand('curl -I http://localhost:3000 2>&1 | head -5');
  console.log(curlTest.result);
  console.log();

  // Check pm2 logs
  console.log('📜 Checking PM2 logs for "app"...');
  const pm2Logs = await workspace.process.executeCommand('pm2 logs app --lines 20 --nostream 2>&1 || echo "No logs available"');
  console.log(pm2Logs.result);
}

checkAppStatus().catch(console.error);
