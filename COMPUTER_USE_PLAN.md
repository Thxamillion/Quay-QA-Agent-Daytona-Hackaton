# Computer Use Implementation Plan

**Problem**: browser-use cannot work in Daytona due to network egress restrictions blocking downloads of Playwright browsers and extensions.

**Solution**: Use Daytona's Computer Use API with Claude Vision to build a custom AI agent for web testing.

---

## Architecture Overview

Replace browser-use with a custom AI agent using:
- **Daytona Computer Use API** - Mouse/keyboard/screenshot control
- **Claude API (Vision)** - Analyze screenshots and decide actions
- **Simple agent loop** - Screenshot → Claude → Action → Repeat

---

## Phase 1: Setup Desktop Environment (10 min)

### Start VNC and Browser in Workspace

```typescript
// In Workspace.service.ts - add after app setup
static async startDesktop(workspaceId: string) {
  const workspace = await daytona.get(workspaceId);

  // Start VNC processes (Xvfb, x11vnc, novnc)
  await workspace.computerUse.start();

  // Launch Chromium in desktop environment
  await workspace.process.executeCommand(
    'DISPLAY=:1 chromium --no-sandbox --disable-dev-shm-usage http://localhost:3000 &'
  );

  // Wait for browser to open
  await new Promise(resolve => setTimeout(resolve, 3000));
}
```

---

## Phase 2: Build AI Agent (20 min)

### Create ComputerUseAgent Service

```typescript
// api/src/service/computerUse/ComputerUseAgent.service.ts

import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import { daytona } from '@/lib/daytona';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export class ComputerUseAgent {
  /**
   * Execute a natural language task using Computer Use + Claude Vision
   */
  static async executeTask(
    workspaceId: string,
    task: string,
    maxSteps: number = 15
  ) {
    const workspace = await daytona.get(workspaceId);
    const steps = [];

    for (let i = 0; i < maxSteps; i++) {
      console.log(`Step ${i + 1}: Taking screenshot...`);

      // 1. Take screenshot
      const screenshot = await workspace.computerUse.screenshot.takeCompressed({
        format: 'jpeg',
        quality: 80,
        showCursor: true
      });

      // 2. Ask Claude what to do next
      const action = await this.getNextAction(task, screenshot, steps);
      console.log(`Step ${i + 1}: Action:`, action);

      // 3. Execute action
      if (action.type === 'click') {
        await workspace.computerUse.mouse.click(action.x, action.y);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (action.type === 'type') {
        await workspace.computerUse.keyboard.type(action.text);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (action.type === 'scroll') {
        await workspace.computerUse.mouse.scroll(action.deltaX || 0, action.deltaY || 0);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (action.type === 'done') {
        console.log('Task completed:', action.result);
        return {
          success: true,
          steps,
          result: action.result
        };
      } else if (action.type === 'failed') {
        console.log('Task failed:', action.reason);
        return {
          success: false,
          steps,
          error: action.reason
        };
      }

      steps.push({
        action,
        screenshot: screenshot.toString('base64'),
        timestamp: new Date().toISOString()
      });

      // Wait between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      success: false,
      steps,
      error: 'Max steps reached'
    };
  }

  /**
   * Use Claude Vision to determine next action
   */
  static async getNextAction(
    task: string,
    screenshot: Buffer,
    history: any[]
  ) {
    const historyText = history.map((h, i) =>
      `Step ${i + 1}: ${h.action.type} ${JSON.stringify(h.action)}`
    ).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: screenshot.toString('base64')
            }
          },
          {
            type: 'text',
            text: `You are controlling a desktop browser to complete a task.

**Task**: ${task}

**Previous actions**:
${historyText || 'None'}

**Instructions**:
1. Look at the screenshot
2. Decide the next action to complete the task
3. Respond with ONLY valid JSON (no markdown, no explanation)

**Available actions**:
- {"type": "click", "x": 123, "y": 456, "description": "what you're clicking"}
- {"type": "type", "text": "hello world"}
- {"type": "scroll", "deltaX": 0, "deltaY": 100}
- {"type": "done", "result": "extracted information or completion message"}
- {"type": "failed", "reason": "why task cannot be completed"}

Respond with JSON only:`
          }
        ]
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON in Claude response: ${text}`);
    }

    return JSON.parse(jsonMatch[0]);
  }
}
```

---

## Phase 3: Integration (15 min)

### 3.1 Update QaRun.service.ts

Replace Python script execution with Computer Use:

```typescript
// In QaRun.service.ts - replace executeTestFlow method

static async executeTestFlow(
  qaRunId: Id<'qaRun'>,
  testFlow: TestFlowEntity,
  workspaceId: string
): Promise<any> {
  console.log('Executing test flow with Computer Use:', testFlow.name);

  // Use Computer Use instead of Python script
  const result = await ComputerUseAgent.executeTask(
    workspaceId,
    testFlow.task,
    15  // max steps
  );

  // Convert to same format as before for database
  const steps = result.steps.map((step, i) => ({
    stepNumber: i + 1,
    action: step.action.description || step.action.type,
    status: step.action.type === 'failed' ? 'failed' : 'passed',
    screenshot: step.screenshot,
    error: step.action.type === 'failed' ? step.action.reason : null,
    errorType: step.action.type === 'failed' ? 'task_failure' : null
  }));

  // Save test results to database
  await this.saveTestResults(qaRunId, testFlow.id, {
    success: result.success,
    steps,
    extracted_content: result.result || result.error
  });

  return result;
}
```

### 3.2 Update Workspace Setup

```typescript
// In Workspace.service.ts - add new method

static async startDesktop(workspaceId: string) {
  const workspace = await daytona.get(workspaceId);

  console.log('Starting desktop environment...');

  // Start VNC processes
  await workspace.computerUse.start();
  console.log('✓ VNC started');

  // Wait for VNC to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Launch Chromium in desktop
  console.log('Launching Chromium...');
  await workspace.process.executeCommand(
    'DISPLAY=:1 chromium --no-sandbox --disable-dev-shm-usage --start-maximized http://localhost:3000 &'
  );

  // Wait for browser to open
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✓ Browser launched');

  return { started: true };
}
```

### 3.3 Update Inngest Job

```typescript
// In QaRun.jobs.ts - replace browser-use step

// REMOVE: Step 3: Install browser-use
// await step.run('install-browser-use', async () => {
//   return await WorkspaceService.installBrowserUse(workspace.id);
// });

// ADD: Step 3: Start desktop environment
await step.run('start-desktop', async () => {
  return await WorkspaceService.startDesktop(workspace.id);
});
```

---

## Phase 4: Testing (5 min)

```bash
# Test with a new QA run
cd api
bun manual-test.ts
```

---

## Trade-offs

| Aspect | browser-use | Computer Use |
|--------|-------------|--------------|
| **Speed** | ⚡ Fast (direct DOM) | 🐌 Slower (screenshot loop) |
| **Accuracy** | 🎯 High (DOM access) | 🤷 Medium (visual only) |
| **Setup** | ❌ Blocked by Daytona network | ✅ Works in Daytona |
| **Code complexity** | ✅ Simple (library) | 🔧 Custom agent loop |
| **Cost** | 💰 Moderate | 💰💰 Higher (Claude per step) |
| **Network deps** | ❌ Requires egress | ✅ No external downloads |

---

## Timeline

- ⏱️ **0-10 min**: Create ComputerUseAgent.service.ts
- ⏱️ **10-20 min**: Implement Claude vision loop
- ⏱️ **20-30 min**: Update QaRun.service.ts integration
- ⏱️ **30-40 min**: Update Workspace.service.ts + jobs
- ⏱️ **40-50 min**: Test end-to-end

---

## Why This Works

1. ✅ **No external downloads** - Uses Daytona's built-in Computer Use API
2. ✅ **No network egress** - Claude API calls happen from backend, not workspace
3. ✅ **Uses system Chromium** - Already installed in Daytona image
4. ✅ **AI-powered** - Claude Vision decides what to click (like browser-use)
5. ✅ **Same test format** - Results saved to DB in same structure

---

## Implementation Notes

- Computer Use screenshots are JPEG compressed to reduce Claude API costs
- 1-second delay between steps to allow page rendering
- Max 15 steps per test flow (configurable)
- Claude uses vision to understand UI and decide actions
- Falls back gracefully if task cannot be completed
