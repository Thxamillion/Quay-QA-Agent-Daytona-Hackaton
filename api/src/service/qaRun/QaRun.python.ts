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
import os
from pathlib import Path
from browser_use import Agent, Browser, ChatAnthropic

async def run_test():
    # Create browser with video recording
    # Use system Chromium to avoid needing to download Playwright browsers
    browser = Browser(
        headless=True,
        record_video_dir="/tmp/recordings",
        window_size={"width": 1920, "height": 1080},
        browser_executable_path="/usr/bin/chromium",
        disable_security=True
    )

    # Create LLM using browser-use's wrapped ChatAnthropic
    llm = ChatAnthropic(model='claude-sonnet-4-20250514', temperature=0.0)

    # Create agent with test task
    agent = Agent(
        task="""${testFlow.task.replace(/"/g, '\\"')}""",
        browser=browser,
        llm=llm
    )

    # Run the test
    try:
        history = await agent.run()

        # Collect screenshots as base64
        screenshots = []
        screenshot_paths = history.screenshots()
        for i, screenshot_path in enumerate(screenshot_paths):
            if screenshot_path and Path(screenshot_path).exists():
                with open(screenshot_path, 'rb') as f:
                    screenshots.append(base64.b64encode(f.read()).decode('utf-8'))
            else:
                screenshots.append(None)

        # Get action history and errors
        actions = history.action_names()
        errors = history.errors()

        # Build per-step results
        steps = []
        for i, action in enumerate(actions):
            step_error = errors[i] if i < len(errors) and errors[i] is not None else None
            steps.append({
                "stepNumber": i + 1,
                "action": action,
                "status": "failed" if step_error else "passed",
                "error": str(step_error) if step_error else None,
                "errorType": classify_error(step_error) if step_error else None,
                "screenshot": screenshots[i] if i < len(screenshots) else None
            })

        # Collect overall results
        results = {
            "success": history.is_successful(),
            "steps": steps,
            "extracted_content": history.final_result(),
            "video_path": "/tmp/recordings/video.mp4"
        }
    except Exception as e:
        results = {
            "success": False,
            "steps": [{
                "stepNumber": 1,
                "action": "initialization",
                "status": "failed",
                "error": str(e),
                "errorType": "runtime_error",
                "screenshot": None
            }],
            "extracted_content": None,
            "video_path": None
        }

    await browser.stop()
    return results

def classify_error(error):
    """Classify error type based on error message"""
    if error is None:
        return None

    error_str = str(error).lower()

    if "timeout" in error_str or "timed out" in error_str:
        return "timeout"
    elif "not found" in error_str or "could not find" in error_str:
        return "element_not_found"
    elif "selector" in error_str:
        return "selector_error"
    elif "navigation" in error_str or "navigate" in error_str:
        return "navigation_error"
    elif "click" in error_str:
        return "click_error"
    elif "input" in error_str or "type" in error_str:
        return "input_error"
    elif "assertion" in error_str or "expected" in error_str:
        return "assertion_error"
    elif "connection" in error_str or "network" in error_str:
        return "network_error"
    else:
        return "unknown_error"

# Run and output JSON
result = asyncio.run(run_test())
print(json.dumps(result))
`.trim();
  }
}
