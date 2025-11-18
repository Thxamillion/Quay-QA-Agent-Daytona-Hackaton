import { daytona } from '@/lib/daytona';
import { env } from '@/lib/env';

export abstract class WorkspaceService {
  /**
   * Create Daytona workspace
   */
  static async createWorkspace(options: { language: string; public: boolean }) {
    const workspace = await daytona.create();

    return { id: workspace.id, workspace };
  }

  /**
   * Clone repo and start dev server
   */
  static async setupApp(
    workspaceId: string,
    repoUrl: string,
    branch: string = 'main'
  ) {
    const workspace = await daytona.get(workspaceId);
    const workDir = 'app';  // Relative path - Daytona will use sandbox home dir

    // Clone repository (with GitHub auth if token provided)
    if (env.GITHUB_TOKEN) {
      await workspace.git.clone(repoUrl, workDir, branch, undefined, 'git', env.GITHUB_TOKEN);
    } else {
      await workspace.git.clone(repoUrl, workDir, branch);
    }

    // Detect package manager (check for lock files)
    console.log('Detecting package manager...');
    const lockFileCheck = await workspace.process.executeCommand(
      'ls pnpm-lock.yaml yarn.lock package-lock.json 2>/dev/null || true',
      workDir
    );

    let installCommand = 'npm install';
    if (lockFileCheck.result?.includes('pnpm-lock.yaml')) {
      console.log('Detected pnpm - installing pnpm globally...');
      await workspace.process.executeCommand('npm install -g pnpm');
      installCommand = 'pnpm install';
    } else if (lockFileCheck.result?.includes('yarn.lock')) {
      console.log('Detected yarn - installing yarn globally...');
      await workspace.process.executeCommand('npm install -g yarn');
      installCommand = 'yarn install';
    }

    // Install dependencies with error checking
    console.log(`Installing dependencies with ${installCommand}...`);
    const installResult = await workspace.process.executeCommand(installCommand, workDir);
    if (installResult.exitCode !== 0) {
      throw new Error(`${installCommand} failed: ${installResult.result}`);
    }
    console.log('✓ Dependencies installed');

    // Verify next is available
    const nextCheck = await workspace.process.executeCommand(
      'ls node_modules/.bin/next',
      workDir
    );
    if (nextCheck.exitCode !== 0) {
      throw new Error('Next.js not installed properly - node_modules/.bin/next not found');
    }

    // Install PM2 globally
    console.log('Installing PM2...');
    const pm2Install = await workspace.process.executeCommand('npm install -g pm2');
    if (pm2Install.exitCode !== 0) {
      throw new Error(`PM2 install failed: ${pm2Install.result}`);
    }
    console.log('✓ PM2 installed');

    // Start dev server in background
    console.log('Starting dev server...');
    const pm2Start = await workspace.process.executeCommand(
      'pm2 start npm --name "app" -- run dev',
      workDir
    );
    if (pm2Start.exitCode !== 0) {
      throw new Error(`Failed to start dev server: ${pm2Start.result}`);
    }

    // Wait for server to be ready and verify it's running
    console.log('Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check PM2 status - must be "online" not "errored"
    const pm2Status = await workspace.process.executeCommand('pm2 jlist');

    if (pm2Status.exitCode === 0) {
      const processes = JSON.parse(pm2Status.result || '[]');
      const appProcess = processes.find((p: any) => p.name === 'app');

      if (!appProcess) {
        throw new Error('PM2 app process not found');
      }

      if (appProcess.pm2_env?.status !== 'online') {
        // Get PM2 logs for debugging
        const logs = await workspace.process.executeCommand('pm2 logs app --lines 50 --nostream');
        throw new Error(`Server failed to start. Status: ${appProcess.pm2_env?.status}. PM2 logs:\n${logs.result}`);
      }

      console.log('✓ PM2 app is online');
    } else {
      throw new Error(`Failed to check PM2 status: ${pm2Status.result}`);
    }

    console.log('✓ Server is running on localhost:3000');
    return { appUrl: 'http://localhost:3000', ready: true };
  }

  /**
   * Start desktop environment for Computer Use
   */
  static async startDesktop(workspaceId: string) {
    const workspace = await daytona.get(workspaceId);

    console.log('Starting desktop environment...');

    // Start VNC processes (Xvfb, x11vnc, novnc)
    await workspace.computerUse.start();
    console.log('✓ VNC started');

    // Wait for VNC to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch Chromium in desktop environment
    console.log('Launching Chromium...');
    await workspace.process.executeCommand(
      'DISPLAY=:1 chromium --no-sandbox --disable-dev-shm-usage --start-maximized http://localhost:3000 &'
    );

    // Wait for browser to open
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✓ Browser launched');

    return { started: true };
  }

  /**
   * Install browser-use in workspace (DEPRECATED - using Computer Use instead)
   */
  static async installBrowserUse(workspaceId: string) {
    const workspace = await daytona.get(workspaceId);

    // Install Python dependencies with verification
    console.log('Installing browser-use...');
    const installResult = await workspace.process.executeCommand(
      'pip install browser-use'
    );

    if (installResult.exitCode !== 0) {
      throw new Error(`Failed to install Python dependencies: ${installResult.result}`);
    }

    // Verify browser-use and ChatAnthropic are installed
    console.log('Verifying browser-use installation...');
    const verifyResult = await workspace.process.executeCommand(
      'python3 -c "from browser_use import Agent, Browser, ChatAnthropic; print(\\"OK\\")"'
    );

    if (verifyResult.exitCode !== 0) {
      throw new Error(`Dependencies not properly installed: ${verifyResult.result}`);
    }

    console.log('✓ All dependencies installed and verified');
    return { installed: true };
  }

  /**
   * Delete workspace
   */
  static async deleteWorkspace(workspaceId: string) {
    await daytona.delete(workspaceId);
    return { deleted: true };
  }
}
