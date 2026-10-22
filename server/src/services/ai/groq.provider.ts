import axios from 'axios';
import { z } from 'zod';
import { AIHintContext, AIHintResponse, AIProvider } from './ai.interface';

const aiResponseSchema = z.object({
  errorType: z.string().max(100),
  explanation: z.string().max(2000),
  hint: z.string().max(2000),
  concepts: z.array(z.string().max(150)).max(5),
  nextSteps: z.array(z.string().max(500)).max(5)
});

export class GroqProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private apiUrl: string = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama3-8b-8192';

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
  }

  async generateHint(context: AIHintContext): Promise<AIHintResponse> {
    const prompt = this.buildPrompt(context);
    const systemPrompt = `You are an educational programming tutor. Your goal is to guide the student to understand their mistake without giving them the direct answer.
STRICT RULES:
1. NEVER provide the complete finished solution.
2. NEVER rewrite the student's entire program.
3. NEVER provide a full replacement code block that solves the problem.
4. NEVER reveal hidden test cases or guess hidden input/output.
5. Explain what the code is currently doing vs what the problem requires.
6. Point out where the reasoning/implementation goes wrong and why it produces the observed result.
7. Suggest specific logical steps to change and what to test next.
8. RETURN EXACTLY A JSON OBJECT matching the schema below. No markdown blocks, no text outside JSON.

REQUIRED JSON SCHEMA:
{
  "errorType": "string (max 100 chars)",
  "explanation": "string (max 2000 chars)",
  "hint": "string (max 2000 chars)",
  "concepts": ["string (max 150 chars, max 5 items)"],
  "nextSteps": ["string (max 500 chars, max 5 items)"]
}
All 5 fields are mandatory. DO NOT add any other fields.`;

    let retryCount = 0;
    const maxRetries = 1;
    let lastError = '';

    while (retryCount <= maxRetries) {
      try {
        console.log(`[AI] Calling Groq model: ${this.model} (Attempt ${retryCount + 1})`);
        
        let messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];

        if (retryCount > 0) {
          messages.push({
            role: 'user',
            content: `Your previous response failed validation with error: ${lastError}. You MUST return EXACTLY the required JSON format and STRICTLY adhere to the character limits for explanation (<=2000), hint (<=2000), concepts (<=150 per item), and nextSteps (<=500 per item).`
          });
        }

        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (!response.data?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response structure from Groq');
        }

        let rawContent = response.data.choices[0].message.content;
        console.log(`[AI] Raw response:\n${rawContent}`);

        // Strip markdown code blocks if the model erroneously adds them
        if (rawContent.startsWith('```json')) {
          rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (rawContent.startsWith('```')) {
          rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
        }

        let parsedJson;
        try {
          parsedJson = JSON.parse(rawContent);
        } catch (e) {
          throw new Error('Failed to parse Groq response as JSON');
        }

        const validated = aiResponseSchema.parse(parsedJson);
        return validated;

      } catch (error: any) {
        lastError = error instanceof z.ZodError ? error.message : (error.message || 'Unknown error');
        console.error(`[AI] Validation or API error on attempt ${retryCount + 1}:`, lastError);
        retryCount++;
      }
    }

    throw new Error('AI response failed validation after retries.');
  }

  private buildPrompt(context: AIHintContext): string {
    const hintLevel = context.hintLevel || 1;

    let levelInstruction = '';
    if (hintLevel === 1) {
      levelInstruction = 'Requested Hint Level: 1 (Conceptual Guidance). Focus on high-level concepts, algorithmic logic, or underlying assumptions that might be wrong. Do NOT point directly to exact line edits.';
    } else if (hintLevel === 2) {
      levelInstruction = 'Requested Hint Level: 2 (Specific Debugging Direction). Point out specific expressions, loop boundaries, conditions, or variable usage that look suspicious.';
    } else if (hintLevel === 3) {
      levelInstruction = 'Requested Hint Level: 3 (Strong Debugging Guidance). Clearly explain the exact logical mistake and describe the step-by-step fix, but STILL DO NOT provide a complete program or full solution replacement code block.';
    }

    let previousHintsStr = '';
    if (context.previousHints && context.previousHints.length > 0) {
      previousHintsStr = `
      Previous Hints Already Delivered to Student:
      ${context.previousHints.map(p => `Level ${p.hintLevel}: ${p.hint}`).join('\n')}
      Ensure Hint Level ${hintLevel} builds progressively on previous hints without repeating identical text.
      `;
    }

    return `
      Please act as an educational programming tutor and help the student debug their code.
      DO NOT write the corrected code for them.

      ${levelInstruction}
      ${previousHintsStr}

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

      Test Results Summary (Only Public Tests included detailed I/O):
      ${context.testResults.map(t => {
        let str = `Test ${t.testNumber} (${t.visibility}): ${t.status}`;
        if (t.visibility === 'PUBLIC' && t.status !== 'PASSED' && t.status !== 'ACCEPTED') {
          str += `\n  Expected: ${t.expectedOutput}\n  Actual: ${t.actualOutput || 'N/A'}`;
        }
        return str;
      }).join('\n')}
    `;
  }
}
