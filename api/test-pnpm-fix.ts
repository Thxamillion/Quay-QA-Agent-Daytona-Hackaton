import { daytona } from './src/lib/daytona';

const WORKSPACE_ID = 'a5f629c8-349d-4f87-b116-6705572047ec';

console.log('🔍 Testing pnpm detection and installation...\n');

const workspace = await daytona.get(WORKSPACE_ID);

// Step 1: Check for lock files
console.log('Step 1: Checking for lock files...');
const lockFileCheck = await workspace.process.executeCommand(
  'ls pnpm-lock.yaml yarn.lock package-lock.json 2>/dev/null || true',
  'app'
);
console.log('Lock files found:', lockFileCheck.result);

// Step 2: Determine package manager
let installCommand = 'npm install';
if (lockFileCheck.result?.includes('pnpm-lock.yaml')) {
  console.log('✓ Detected pnpm-lock.yaml - will use pnpm');
  installCommand = 'pnpm install';
} else if (lockFileCheck.result?.includes('yarn.lock')) {
  console.log('✓ Detected yarn.lock - will use yarn');
  installCommand = 'yarn install';
} else {
  console.log('✓ No lock file detected - will use npm');
}

// Step 3: Install pnpm globally if needed
if (installCommand === 'pnpm install') {
  console.log('\nStep 2: Installing pnpm globally...');
  const pnpmInstall = await workspace.process.executeCommand('npm install -g pnpm');
  console.log('Exit code:', pnpmInstall.exitCode);
  if (pnpmInstall.exitCode === 0) {
    console.log('✓ pnpm installed');
  } else {
    console.log('✗ pnpm installation failed:', pnpmInstall.result?.substring(0, 200));
  }
}

// Step 4: Install dependencies
console.log(`\nStep 3: Running ${installCommand}...`);
const installResult = await workspace.process.executeCommand(installCommand, 'app');
console.log('Exit code:', installResult.exitCode);
if (installResult.exitCode === 0) {
  console.log('✓ Dependencies installed');
} else {
  console.log('✗ Installation failed');
  console.log('Output:', installResult.result?.substring(0, 500));
}

// Step 5: Check if next is available
console.log('\nStep 4: Checking if Next.js is installed...');
const nextCheck = await workspace.process.executeCommand('ls node_modules/.bin/next', 'app');
if (nextCheck.exitCode === 0) {
  console.log('✓ Next.js found at node_modules/.bin/next');
} else {
  console.log('✗ Next.js NOT found');
  console.log('Output:', nextCheck.result);
}

// Step 6: Try to start the app
console.log('\nStep 5: Testing if we can start the app...');
const startTest = await workspace.process.executeCommand(
  'cd app && npx next --version',
  '.'
);
console.log('Next.js version check:', startTest.result);
console.log('Exit code:', startTest.exitCode);

console.log('\n✅ Test complete!');
