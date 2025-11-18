# Backend Implementation Guide - QA Automation Agent

> **Tech Stack**: Bun + Elysia (TypeScript) + PostgreSQL + Drizzle ORM + Inngest + Daytona SDK

---

## 📁 Project Structure

```
api/
├── src/
│   ├── lib/                          # Client initialization
│   │   ├── daytona.ts                # Daytona SDK client
│   │   ├── client.ts                 # Database client (Drizzle)
│   │   ├── inngest-client.ts         # Inngest client
│   │   └── env.ts                    # Environment variables validation
│   │
│   ├── db/                           # Database schemas
│   │   ├── qaRun.db.ts               # QA run entity & table
│   │   ├── testFlow.db.ts            # Test flow entity & table
│   │   ├── testStep.db.ts            # Test step entity & table
│   │   └── seed.ts                   # Seed demo test flows
│   │
│   ├── service/                      # Business logic
│   │   ├── qaRun/
│   │   │   ├── QaRun.service.ts      # QA run CRUD + test execution
│   │   │   ├── QaRun.jobs.ts         # Inngest background jobs
│   │   │   └── QaRun.python.ts       # Python script generator
│   │   ├── testFlow/
│   │   │   └── TestFlow.service.ts   # Test flow CRUD
│   │   └── workspace/
│   │       └── Workspace.service.ts  # Daytona workspace operations
│   │
│   ├── types/                        # TypeScript types
│   │   └── index.ts                  # Shared types & ID helpers
│   │
│   └── index.ts                      # API entry point (Elysia server)
│
├── drizzle.config.ts                 # Drizzle ORM configuration
├── package.json
├── tsconfig.json
└── .env                              # Environment variables
```

---

## 🚀 Step-by-Step Implementation

### Step 1: Project Setup

**1.1 Initialize Bun project**
```bash
mkdir api && cd api
bun init -y
```

**1.2 Install dependencies**
```bash
# Core framework
bun add elysia

# Database
bun add drizzle-orm postgres
bun add -d drizzle-kit

# Background jobs
bun add inngest

# Daytona SDK
bun add @daytona/sdk

# Utilities
bun add nanoid zod
```

**1.3 Configure TypeScript (`tsconfig.json`)**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["bun-types"],
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**1.4 Configure Drizzle (`drizzle.config.ts`)**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/*.db.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**1.5 Update `package.json` scripts**
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:seed": "bun src/db/seed.ts"
  }
}
```

---

### Step 2: Environment Variables (`src/lib/env.ts`)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Daytona
  DAYTONA_API_KEY: z.string().min(1),
  DAYTONA_API_URL: z.string().url().default('https://api.daytona.io'),

  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),

  // Server
  PORT: z.string().default('3001'),
});

export const env = envSchema.parse(process.env);
```

**Create `.env` file**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/qa_agent
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://api.daytona.io
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
PORT=3001
```

---

### Step 3: Types & Utilities (`src/types/index.ts`)

```typescript
import { customAlphabet } from 'nanoid';

// ID type branding
export type Id<T extends string> = string & { __brand: T };

// ID generator
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

export function generateId<T extends string>(prefix: T): Id<T> {
  return `${prefix}_${nanoid()}` as Id<T>;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

### Step 4: Database Schemas

**4.1 QA Run Schema (`src/db/qaRun.db.ts`)**
```typescript
import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';

export interface QaRunEntity {
  id: Id<'qaRun'>;
  createdAt: string;
  updatedAt: string;

  // App under test
  repoUrl: string;
  appName: string;
  branch: string;

  // Daytona workspace
  daytonaWorkspaceId: string;
  appLocalUrl: string;                // http://localhost:3000

  // Test execution
  testFlowIds: Id<'testFlow'>[];
  status: 'pending' | 'setting_up' | 'running_tests' | 'completed' | 'failed';

  // Results
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;

  // Recording (from browser-use)
  videoRecordingUrl: string | null;   // Full session video URL
  videoRecordingPath: string | null;  // Path in workspace

  // Error tracking
  errorMessage: string | null;

  // Timestamps
  startedAt: string | null;
  completedAt: string | null;
}

export const qaRunsTable = pgTable('qa_runs', {
  id: text('id').$type<Id<'qaRun'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  repoUrl: text('repo_url').notNull(),
  appName: text('app_name').notNull(),
  branch: text('branch').notNull().default('main'),
  daytonaWorkspaceId: text('daytona_workspace_id').notNull(),
  appLocalUrl: text('app_local_url').notNull().default('http://localhost:3000'),
  testFlowIds: jsonb('test_flow_ids').$type<Id<'testFlow'>[]>().notNull(),
  status: text('status').$type<QaRunEntity['status']>().notNull(),
  totalSteps: integer('total_steps').notNull().default(0),
  passedSteps: integer('passed_steps').notNull().default(0),
  failedSteps: integer('failed_steps').notNull().default(0),
  videoRecordingUrl: text('video_recording_url'),
  videoRecordingPath: text('video_recording_path'),
  errorMessage: text('error_message'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});
```

**4.2 Test Flow Schema (`src/db/testFlow.db.ts`)**
```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';

export interface TestFlowEntity {
  id: Id<'testFlow'>;
  createdAt: string;
  name: string;
  description: string;

  // Natural language task for browser-use agent
  task: string;  // e.g., "Go to localhost:3000, login with test@example.com, verify dashboard"

  // Is this a pre-built demo flow?
  isDemo: boolean;
}

export const testFlowsTable = pgTable('test_flows', {
  id: text('id').$type<Id<'testFlow'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  task: text('task').notNull(),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
});
```

**4.3 Test Step Schema (`src/db/testStep.db.ts`)**
```typescript
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import type { Id } from '@/types';
import { qaRunsTable } from './qaRun.db';
import { testFlowsTable } from './testFlow.db';

export interface TestStepEntity {
  id: Id<'testStep'>;
  createdAt: string;

  // Relations
  qaRunId: Id<'qaRun'>;
  testFlowId: Id<'testFlow'>;

  // Step details
  stepNumber: number;
  actionName: string;      // e.g., "click", "input", "navigate"
  description: string;

  // Execution
  status: 'pending' | 'running' | 'passed' | 'failed';
  executedAt: string | null;

  // Visual capture (from browser-use)
  screenshotBase64: string | null;    // Screenshot after this action

  // Error tracking
  errorMessage: string | null;
}

export const testStepsTable = pgTable('test_steps', {
  id: text('id').$type<Id<'testStep'>>().primaryKey(),
  createdAt: text('created_at').notNull(),
  qaRunId: text('qa_run_id').$type<Id<'qaRun'>>().references(() => qaRunsTable.id).notNull(),
  testFlowId: text('test_flow_id').$type<Id<'testFlow'>>().references(() => testFlowsTable.id).notNull(),
  stepNumber: integer('step_number').notNull(),
  actionName: text('action_name').notNull(),
  description: text('description').notNull(),
  status: text('status').$type<TestStepEntity['status']>().notNull(),
  executedAt: text('executed_at'),
  screenshotBase64: text('screenshot_base64'),
  errorMessage: text('error_message'),
});
```

---

### Step 5: Database Client (`src/lib/client.ts`)

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';

// PostgreSQL connection
const queryClient = postgres(env.DATABASE_URL);

// Drizzle ORM client
export const db = drizzle(queryClient);
```

---

### Step 6: Daytona Client (`src/lib/daytona.ts`)

```typescript
import { Daytona } from '@daytona/sdk';
import { env } from './env';

export const daytona = new Daytona({
  apiKey: env.DAYTONA_API_KEY,
  apiUrl: env.DAYTONA_API_URL,
});
```

---

### Step 7: Inngest Client (`src/lib/inngest-client.ts`)

```typescript
import { Inngest } from 'inngest';
import { env } from './env';

export const inngestClient = new Inngest({
  id: 'qa-automation-agent',
  eventKey: env.INNGEST_EVENT_KEY,
});
```

---

### Step 8: Workspace Service (`src/service/workspace/Workspace.service.ts`)

```typescript
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
```

---

### Step 9: Python Script Generator (`src/service/qaRun/QaRun.python.ts`)

```typescript
import type { TestFlowEntity } from '@/db/testFlow.db';

export abstract class QaRunPython {
  /**
   * Generate Python script for browser-use test
   */
  static generateTestScript(testFlow: TestFlowEntity): string {
    return `
import asyncio
import json
import base64
from pathlib import Path
from browser_use import Agent, Browser, ChatBrowserUse

async def run_test():
    # Create browser with video recording
    browser = Browser(
        headless=True,
        record_video_dir="/tmp/recordings",
        window_size={"width": 1920, "height": 1080}
    )

    # Create agent with test task
    agent = Agent(
        task="""${testFlow.task.replace(/"/g, '\\"')}""",
        browser=browser,
        llm=ChatBrowserUse()
    )

    # Run the test
    try:
        history = await agent.run()

        # Collect screenshots as base64
        screenshots = []
        for i, screenshot_path in enumerate(history.screenshots()):
            if screenshot_path and Path(screenshot_path).exists():
                with open(screenshot_path, 'rb') as f:
                    screenshots.append(base64.b64encode(f.read()).decode('utf-8'))

        # Collect results
        results = {
            "success": history.is_successful(),
            "screenshots": screenshots,
            "actions": history.action_names(),
            "extracted_content": history.final_result(),
            "errors": [str(e) for e in history.errors() if e is not None],
            "video_path": "/tmp/recordings/video.mp4"
        }
    except Exception as e:
        results = {
            "success": False,
            "screenshots": [],
            "actions": [],
            "extracted_content": None,
            "errors": [str(e)],
            "video_path": None
        }

    await browser.close()
    return results

# Run and output JSON
result = asyncio.run(run_test())
print(json.dumps(result))
`.trim();
  }
}
```

---

### Step 10: Test Flow Service (`src/service/testFlow/TestFlow.service.ts`)

```typescript
import { db } from '@/lib/client';
import { testFlowsTable, type TestFlowEntity } from '@/db/testFlow.db';
import { generateId, type Id } from '@/types';
import { eq } from 'drizzle-orm';

export abstract class TestFlowService {
  /**
   * Get all test flows
   */
  static async getAll(): Promise<TestFlowEntity[]> {
    return await db.select().from(testFlowsTable);
  }

  /**
   * Get test flow by ID
   */
  static async getById(id: Id<'testFlow'>): Promise<TestFlowEntity | null> {
    const [flow] = await db
      .select()
      .from(testFlowsTable)
      .where(eq(testFlowsTable.id, id));

    return flow || null;
  }

  /**
   * Get multiple test flows by IDs
   */
  static async getByIds(ids: Id<'testFlow'>[]): Promise<TestFlowEntity[]> {
    if (ids.length === 0) return [];

    return await db
      .select()
      .from(testFlowsTable)
      .where(eq(testFlowsTable.id, ids[0])); // TODO: Use IN operator
  }

  /**
   * Create test flow
   */
  static async create(
    data: Omit<TestFlowEntity, 'id' | 'createdAt'>
  ): Promise<TestFlowEntity> {
    const flow: TestFlowEntity = {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      ...data,
    };

    await db.insert(testFlowsTable).values(flow);
    return flow;
  }

  /**
   * Delete test flow
   */
  static async delete(id: Id<'testFlow'>): Promise<void> {
    await db.delete(testFlowsTable).where(eq(testFlowsTable.id, id));
  }
}
```

---

### Step 11: QA Run Service (`src/service/qaRun/QaRun.service.ts`)

```typescript
import { db } from '@/lib/client';
import { daytona } from '@/lib/daytona';
import { qaRunsTable, type QaRunEntity } from '@/db/qaRun.db';
import { testStepsTable, type TestStepEntity } from '@/db/testStep.db';
import type { TestFlowEntity } from '@/db/testFlow.db';
import { generateId, type Id } from '@/types';
import { eq } from 'drizzle-orm';
import { QaRunPython } from './QaRun.python';
import { inngestClient } from '@/lib/inngest-client';

export abstract class QaRunService {
  /**
   * Create QA run and trigger background job
   */
  static async create(data: {
    repoUrl: string;
    appName: string;
    branch: string;
    testFlowIds: Id<'testFlow'>[];
  }): Promise<QaRunEntity> {
    const qaRun: QaRunEntity = {
      id: generateId('qaRun'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repoUrl: data.repoUrl,
      appName: data.appName,
      branch: data.branch,
      daytonaWorkspaceId: '', // Will be set by job
      appLocalUrl: 'http://localhost:3000',
      testFlowIds: data.testFlowIds,
      status: 'pending',
      totalSteps: 0,
      passedSteps: 0,
      failedSteps: 0,
      videoRecordingUrl: null,
      videoRecordingPath: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    };

    // Save to database
    await db.insert(qaRunsTable).values(qaRun);

    // Trigger Inngest job
    await inngestClient.send({
      name: 'qa/run',
      data: { qaRunId: qaRun.id },
    });

    return qaRun;
  }

  /**
   * Get QA run by ID
   */
  static async getById(id: Id<'qaRun'>): Promise<QaRunEntity | null> {
    const [qaRun] = await db
      .select()
      .from(qaRunsTable)
      .where(eq(qaRunsTable.id, id));

    return qaRun || null;
  }

  /**
   * Get all QA runs
   */
  static async getAll(): Promise<QaRunEntity[]> {
    return await db.select().from(qaRunsTable);
  }

  /**
   * Update QA run status
   */
  static async updateStatus(
    id: Id<'qaRun'>,
    status: QaRunEntity['status'],
    errorMessage?: string
  ): Promise<void> {
    await db
      .update(qaRunsTable)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qaRunsTable.id, id));
  }

  /**
   * Execute a test flow using browser-use
   */
  static async executeTestFlow(
    qaRunId: Id<'qaRun'>,
    testFlow: TestFlowEntity,
    workspaceId: string
  ): Promise<any> {
    const workspace = await daytona.get(workspaceId);

    // 1. Generate Python script
    const pythonScript = QaRunPython.generateTestScript(testFlow);

    // 2. Write to workspace
    const scriptPath = `/tmp/test_${testFlow.id}.py`;
    await workspace.writeFile(scriptPath, pythonScript);

    // 3. Execute Python script
    const output = await workspace.process.executeCommand(
      `cd /tmp && python3 test_${testFlow.id}.py`
    );

    // 4. Parse results
    const results = JSON.parse(output);

    // 5. Save steps to database
    await this.saveTestResults(qaRunId, testFlow.id, results);

    // 6. Save video recording
    if (results.video_path) {
      // TODO: Upload video to storage and get URL
      const videoUrl = results.video_path; // Placeholder
      await db.update(qaRunsTable)
        .set({
          videoRecordingUrl: videoUrl,
          videoRecordingPath: results.video_path,
        })
        .where(eq(qaRunsTable.id, qaRunId));
    }

    return results;
  }

  /**
   * Save test results to database
   */
  static async saveTestResults(
    qaRunId: Id<'qaRun'>,
    testFlowId: Id<'testFlow'>,
    results: any
  ): Promise<void> {
    const screenshots = results.screenshots || [];
    const actions = results.actions || [];

    // Create test steps
    for (let i = 0; i < actions.length; i++) {
      const step: TestStepEntity = {
        id: generateId('testStep'),
        createdAt: new Date().toISOString(),
        qaRunId,
        testFlowId,
        stepNumber: i + 1,
        actionName: actions[i],
        description: `Step ${i + 1}: ${actions[i]}`,
        status: 'passed',  // browser-use completed it
        executedAt: new Date().toISOString(),
        screenshotBase64: screenshots[i] || null,
        errorMessage: null,
      };

      await db.insert(testStepsTable).values(step);
    }

    // Update QA run stats
    const totalSteps = actions.length;
    const passedSteps = results.success ? totalSteps : 0;
    const failedSteps = results.success ? 0 : totalSteps;

    await db.update(qaRunsTable)
      .set({
        totalSteps,
        passedSteps,
        failedSteps,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qaRunsTable.id, qaRunId));
  }

  /**
   * Get test steps for QA run
   */
  static async getSteps(qaRunId: Id<'qaRun'>): Promise<TestStepEntity[]> {
    return await db
      .select()
      .from(testStepsTable)
      .where(eq(testStepsTable.qaRunId, qaRunId));
  }
}
```

---

### Step 12: Inngest Jobs (`src/service/qaRun/QaRun.jobs.ts`)

```typescript
import { inngestClient } from '@/lib/inngest-client';
import { QaRunService } from './QaRun.service';
import { TestFlowService } from '../testFlow/TestFlow.service';
import { WorkspaceService } from '../workspace/Workspace.service';
import type { Id } from '@/types';

export const runQaTestsJob = inngestClient.createFunction(
  {
    id: 'run-qa-tests',
    name: 'Run QA Tests',
  },
  { event: 'qa/run' },
  async ({ event, step }) => {
    const { qaRunId } = event.data as { qaRunId: Id<'qaRun'> };

    // Get QA run
    const qaRun = await QaRunService.getById(qaRunId);
    if (!qaRun) {
      throw new Error(`QA run ${qaRunId} not found`);
    }

    // Get test flows
    const testFlows = await TestFlowService.getByIds(qaRun.testFlowIds);

    try {
      // Step 1: Create Daytona workspace
      const workspace = await step.run('create-workspace', async () => {
        await QaRunService.updateStatus(qaRunId, 'setting_up');
        return await WorkspaceService.createWorkspace({
          language: 'typescript',
          public: false,
        });
      });

      // Update workspace ID
      await step.run('update-workspace-id', async () => {
        await QaRunService.updateStatus(qaRunId, 'setting_up');
        // Update in database
      });

      // Step 2: Setup app
      await step.run('setup-app', async () => {
        return await WorkspaceService.setupApp(
          workspace.id,
          qaRun.repoUrl,
          qaRun.branch
        );
      });

      // Step 3: Install browser-use
      await step.run('install-browser-use', async () => {
        return await WorkspaceService.installBrowserUse(workspace.id);
      });

      // Step 4: Run each test flow
      await QaRunService.updateStatus(qaRunId, 'running_tests');

      for (const testFlow of testFlows) {
        await step.run(`run-flow-${testFlow.id}`, async () => {
          return await QaRunService.executeTestFlow(
            qaRunId,
            testFlow,
            workspace.id
          );
        });
      }

      // Step 5: Mark as completed
      await step.run('finalize', async () => {
        await QaRunService.updateStatus(qaRunId, 'completed');
      });

      return { success: true };
    } catch (error) {
      // Mark as failed
      await QaRunService.updateStatus(
        qaRunId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
);
```

---

### Step 13: API Routes (`src/index.ts`)

```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { env } from './lib/env';
import { QaRunService } from './service/qaRun/QaRun.service';
import { TestFlowService } from './service/testFlow/TestFlow.service';
import { serve } from '@inngest/serve';
import { runQaTestsJob } from './service/qaRun/QaRun.jobs';
import { inngestClient } from './lib/inngest-client';

const app = new Elysia()
  .use(cors())

  // Health check
  .get('/health', () => ({ status: 'ok' }))

  // Test Flows
  .get('/api/test-flow', async () => {
    const flows = await TestFlowService.getAll();
    return { success: true, data: flows };
  })

  .get('/api/test-flow/:id', async ({ params }) => {
    const flow = await TestFlowService.getById(params.id as any);
    if (!flow) {
      return { success: false, error: 'Test flow not found' };
    }
    return { success: true, data: flow };
  })

  .post('/api/test-flow', async ({ body }) => {
    const flow = await TestFlowService.create(body as any);
    return { success: true, data: flow };
  })

  // QA Runs
  .get('/api/qa-run', async () => {
    const runs = await QaRunService.getAll();
    return { success: true, data: runs };
  })

  .get('/api/qa-run/:id', async ({ params }) => {
    const run = await QaRunService.getById(params.id as any);
    if (!run) {
      return { success: false, error: 'QA run not found' };
    }
    return { success: true, data: run };
  })

  .get('/api/qa-run/:id/steps', async ({ params }) => {
    const steps = await QaRunService.getSteps(params.id as any);
    return { success: true, data: steps };
  })

  .post('/api/qa-run', async ({ body }) => {
    const run = await QaRunService.create(body as any);
    return { success: true, data: run };
  })

  // Inngest endpoint
  .use(serve({
    client: inngestClient,
    functions: [runQaTestsJob],
  }))

  .listen(env.PORT);

console.log(`🚀 Backend running at http://localhost:${env.PORT}`);
```

---

### Step 14: Database Seed (`src/db/seed.ts`)

```typescript
import { db } from '@/lib/client';
import { testFlowsTable, type TestFlowEntity } from './testFlow.db';
import { generateId } from '@/types';

async function seed() {
  console.log('Seeding database...');

  const flows: TestFlowEntity[] = [
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Login Flow',
      description: 'Test user login functionality',
      isDemo: true,
      task: `
Go to http://localhost:3000/login
Find the email input field and enter "test@example.com"
Find the password input field and enter "password123"
Click the login or submit button
Wait for the page to load
Verify that you are now on a dashboard or home page (not the login page)
Extract any welcome message or user information visible on the page
      `.trim(),
    },
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Navigation Flow',
      description: 'Test main navigation links',
      isDemo: true,
      task: `
Go to http://localhost:3000
Click on the "Products" navigation link
Wait for the products page to load
Verify that product listings are visible
Click on the "About" navigation link
Wait for the about page to load
Verify that about content is visible
Extract the page title and main heading
      `.trim(),
    },
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Form Submission Flow',
      description: 'Test contact form submission',
      isDemo: true,
      task: `
Go to http://localhost:3000/contact
Find and fill in the name field with "John Doe"
Find and fill in the email field with "john@example.com"
Find and fill in the message textarea with "This is a test message"
Click the submit button
Wait for form submission
Verify that a success message appears
Extract the success message text
      `.trim(),
    },
  ];

  for (const flow of flows) {
    await db.insert(testFlowsTable).values(flow);
  }

  console.log(`✅ Seeded ${flows.length} test flows`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
```

---

## 🎯 Next Steps

1. **Run setup commands:**
   ```bash
   cd api
   bun install
   bun run db:push
   bun run db:seed
   ```

2. **Start development server:**
   ```bash
   bun run dev
   ```

3. **Test endpoints:**
   - GET http://localhost:3001/health
   - GET http://localhost:3001/api/test-flow
   - POST http://localhost:3001/api/qa-run

4. **Configure Inngest:**
   - Set up Inngest account
   - Configure event key and signing key
   - Test background jobs

---

## 📚 API Reference

### Test Flows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test-flow` | Get all test flows |
| GET | `/api/test-flow/:id` | Get test flow by ID |
| POST | `/api/test-flow` | Create new test flow |

### QA Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qa-run` | Get all QA runs |
| GET | `/api/qa-run/:id` | Get QA run by ID |
| GET | `/api/qa-run/:id/steps` | Get test steps for QA run |
| POST | `/api/qa-run` | Create and start new QA run |

---

**Built for Daytona Hacksprint 2025** | Backend powered by **Bun + Elysia + Drizzle + Inngest**
