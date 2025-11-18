import { daytona } from '@/lib/daytona';

export abstract class WorkspaceService {
  /**
   * Create Daytona workspace
   */
  static async createWorkspace(options: { language: string; public: boolean }) {
    const workspace = await daytona.create({
      language: options.language,
      public: options.public,
    });

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
    const workDir = '/workspace/app';

    // Clone repository
    await workspace.git.clone(repoUrl, workDir, { branch });

    // Install dependencies
    await workspace.process.executeCommand('npm install', { cwd: workDir });

    // Install PM2 globally
    await workspace.process.executeCommand('npm install -g pm2');

    // Start dev server in background
    await workspace.process.executeCommand(
      'pm2 start npm --name "app" -- run dev',
      { cwd: workDir }
    );

    // Wait for server to be ready (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 10000));

    return { appUrl: 'http://localhost:3000', ready: true };
  }

  /**
   * Install browser-use in workspace
   */
  static async installBrowserUse(workspaceId: string) {
    const workspace = await daytona.get(workspaceId);

    // Install Python dependencies
    await workspace.process.executeCommand(
      'pip install browser-use && uvx browser-use install'
    );

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
