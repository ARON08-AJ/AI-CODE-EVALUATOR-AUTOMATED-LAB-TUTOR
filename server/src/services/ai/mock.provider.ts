import { AIHintContext, AIHintResponse, AIProvider } from './ai.interface';

export class MockAIProvider implements AIProvider {
  // Store the last prompt so tests can inspect it
  public lastPrompt: string = '';

  async generateHint(context: AIHintContext): Promise<AIHintResponse> {
    this.lastPrompt = this.buildPrompt(context);
    const level = context.hintLevel || 1;
    const status = context.status;

    let explanation = '';
    let hint = '';
    let concepts: string[] = [];
    let nextSteps: string[] = [];

    if (status === 'COMPILATION_ERROR') {
      explanation = `Your code could not be compiled. Please check syntax errors and class declarations.`;
      hint = level === 1 
        ? 'Check for missing semicolons, unmatched braces, or unimported utility packages.'
        : 'Carefully review the class name and method signatures. For Java, make sure the class is named Main and has public static void main.';
      concepts = ['Syntax Rules', 'Compiler Errors', 'Type Declarations'];
      nextSteps = ['Review compiler message at line numbers indicated', 'Verify brackets and semicolons match'];
    } else if (status === 'WRONG_ANSWER') {
      const failedTest = context.testResults.find(t => t.status !== 'PASSED' && t.visibility === 'PUBLIC') || context.testResults[0];
      const actual = failedTest?.actualOutput ? `"${failedTest.actualOutput.trim()}"` : 'an unexpected value';
      const expected = failedTest?.expectedOutput ? `"${failedTest.expectedOutput.trim()}"` : 'the expected result';

      if (level === 1) {
        explanation = `Your program executed successfully, but produced ${actual} instead of ${expected}.`;
        hint = `Think about your algorithm's initial conditions and edge cases in "${context.problemTitle}". Are all boundary values handled?`;
      } else if (level === 2) {
        explanation = `The output diverged on test vectors. For input "${context.sampleInput}", the calculation produced unexpected output.`;
        hint = `Check the loop boundaries and variable updates. For example, verify if your accumulator or maximum variable starts with the first element or a valid minimum.`;
      } else {
        explanation = `Logic flaw identified in output generation: Check the comparison operators and array indexing.`;
        hint = `Trace the array step-by-step with negative or duplicate values. Make sure you are printing only the final result without extra debugging prints.`;
      }
      concepts = ['Boundary Conditions', 'Loop Termination', 'Array Indexing', 'Algorithmic Invariants'];
      nextSteps = ['Dry run your code with sample input: ' + context.sampleInput, 'Inspect variable values inside the loop'];
    } else if (status === 'TIME_LIMIT_EXCEEDED') {
      explanation = `Your solution exceeded the allowable execution time limit.`;
      hint = level === 1 
        ? 'Check for infinite loops (e.g. while loops where the condition is never updated).' 
        : 'Consider the time complexity of your approach. An O(N^2) solution might be too slow for large inputs.';
      concepts = ['Time Complexity', 'Infinite Loops', 'Algorithm Optimization'];
      nextSteps = ['Ensure loop counter increments every iteration', 'Avoid nested loops if not necessary'];
    } else {
      explanation = `A runtime exception occurred while executing your code.`;
      hint = 'Check for IndexOutOfBoundsException, NullPointerException, or DivisionByZero in your arithmetic.';
      concepts = ['Runtime Safety', 'Array Bounds', 'Input Parsing'];
      nextSteps = ['Verify array sizes match the input length N', 'Ensure scanner/input reads all expected tokens'];
    }

    return {
      errorType: status,
      explanation,
      hint,
      concepts,
      nextSteps
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
