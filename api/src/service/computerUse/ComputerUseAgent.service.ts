import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import { daytona } from '@/lib/daytona';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export abstract class ComputerUseAgent {
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
      console.log(`Step ${i + 1}/${maxSteps}: Taking screenshot...`);

      // 1. Take screenshot
      const screenshot = await workspace.computerUse.screenshot.takeCompressed({
        format: 'jpeg',
        quality: 80,
        showCursor: true
      });

      // 2. Ask Claude what to do next
      const action = await this.getNextAction(task, screenshot, steps);
      console.log(`Step ${i + 1}: Action:`, JSON.stringify(action));

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
        console.log('✅ Task completed:', action.result);
        return {
          success: true,
          steps,
          result: action.result
        };
      } else if (action.type === 'failed') {
        console.log('❌ Task failed:', action.reason);
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

      // Wait between steps to allow page rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      success: false,
      steps,
      error: 'Max steps reached without completion'
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
1. Look at the screenshot carefully
2. Decide the next single action to progress toward completing the task
3. Respond with ONLY valid JSON (no markdown, no code blocks, no explanation)

**Available actions**:
- {"type": "click", "x": 123, "y": 456, "description": "what you're clicking"}
- {"type": "type", "text": "text to type"}
- {"type": "scroll", "deltaX": 0, "deltaY": 100}
- {"type": "done", "result": "extracted information or completion confirmation"}
- {"type": "failed", "reason": "why task cannot be completed"}

**Important**: Respond with ONLY the JSON action, nothing else.`
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
