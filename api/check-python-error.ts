import { daytona } from './src/lib/daytona';
import { env } from './src/lib/env';

const workspace = await daytona.get('a5f629c8-349d-4f87-b116-6705572047ec');

// Find the test script
const scriptList = await workspace.process.executeCommand('ls -la /tmp/test_*.py 2>&1');
console.log('Test scripts:', scriptList.result);

// Read the Python output that already ran
const testResult = await workspace.process.executeCommand(
  `export ANTHROPIC_API_KEY="${env.ANTHROPIC_API_KEY}" && cd /tmp && python3 test_testFlow_01jcxqfakphq1c4gmr5dhy0djy.py 2>&1 | head -150`
);

console.log('\n=== Python Script Output ===');
console.log(testResult.result);
