import { AIHintContext, AIHintResponse, AIProvider } from './ai.interface';

export class MockAIProvider implements AIProvider {
  // Store the last prompt so tests can inspect it
  public lastPrompt: string = '';

  async generateHint(context: AIHintContext): Promise<AIHintResponse> {
    this.lastPrompt = this.buildPrompt(context);

    // Return deterministic fake response for tests
    return {
      errorType: context.status,
      explanation: 'This is a mock explanation for ' + context.status,
      hint: 'This is a mock hint. Check your logic.',
      concepts: ['Mock Concept 1', 'Mock Concept 2'],
      nextSteps: ['Mock Step 1', 'Mock Step 2']
    };
  }

  private buildPrompt(context: AIHintContext): string {
    return `
      Problem Title: ${context.problemTitle}
      Description: ${context.problemDescription}
      Constraints: ${context.constraints}
      Sample Input: ${context.sampleInput}
      Sample Output: ${context.sampleOutput}

      Student's Language: ${context.language}
      Student's Source Code:
      \`\`\`
      ${context.sourceCode}
      \`\`\`

      Judge Status: ${context.status}

      Test Results Summary:
      ${context.testResults.map(t => {
        let str = `Test ${t.testNumber} (${t.visibility}): ${t.status}`;
        if (t.visibility === 'PUBLIC' && t.status !== 'PASSED') {
          str += `\n  Expected: ${t.expectedOutput}\n  Actual: ${t.actualOutput}`;
        }
        return str;
      }).join('\n')}
    `;
  }
}
