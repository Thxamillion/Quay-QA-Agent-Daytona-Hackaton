import { anthropic } from '@/lib/anthropic';
import type { TestStepEntity } from '@/db/testStep.db';
import type { TestFlowEntity } from '@/db/testFlow.db';

export interface FailureAnalysisResult {
  summary: string;
  rootCause: string;
  affectedSteps: number[];
  recommendations: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export abstract class FailureAnalysisService {
  /**
   * Analyze test failure using AI
   */
  static async analyzeFailure(
    testFlow: TestFlowEntity,
    steps: TestStepEntity[],
    extractedContent: any
  ): Promise<FailureAnalysisResult> {
    const failedSteps = steps.filter(s => s.status === 'failed');

    if (failedSteps.length === 0) {
      return {
        summary: 'All tests passed successfully',
        rootCause: 'N/A',
        affectedSteps: [],
        recommendations: [],
        severity: 'low',
      };
    }

    // Build context for Claude
    const stepsContext = steps.map(s => ({
      stepNumber: s.stepNumber,
      action: s.actionName,
      status: s.status,
      error: s.errorMessage,
      errorType: s.errorType,
    }));

    const prompt = `You are analyzing a failed QA automation test. Provide a detailed analysis.

**Test Task:**
${testFlow.task}

**Test Flow Description:**
${testFlow.description}

**Steps Executed:**
${JSON.stringify(stepsContext, null, 2)}

**Extracted Content:**
${JSON.stringify(extractedContent, null, 2)}

**Analysis Required:**
1. Summarize what went wrong (1-2 sentences)
2. Identify the root cause of the failure
3. List the step numbers that were affected
4. Provide 3-5 specific recommendations to fix the issue
5. Assess severity: critical (blocks core functionality), high (major feature broken), medium (minor feature issue), low (cosmetic issue)

Respond in JSON format:
{
  "summary": "Brief summary of the failure",
  "rootCause": "Root cause analysis",
  "affectedSteps": [1, 2, 3],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "severity": "critical|high|medium|low"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const analysis = JSON.parse(content.text);

    return {
      summary: analysis.summary,
      rootCause: analysis.rootCause,
      affectedSteps: analysis.affectedSteps,
      recommendations: analysis.recommendations,
      severity: analysis.severity,
    };
  }

  /**
   * Generate human-readable failure report
   */
  static formatReport(analysis: FailureAnalysisResult): string {
    return `
## Test Failure Analysis

**Severity:** ${analysis.severity.toUpperCase()}

**Summary:**
${analysis.summary}

**Root Cause:**
${analysis.rootCause}

**Affected Steps:** ${analysis.affectedSteps.join(', ')}

**Recommendations:**
${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`.trim();
  }
}
