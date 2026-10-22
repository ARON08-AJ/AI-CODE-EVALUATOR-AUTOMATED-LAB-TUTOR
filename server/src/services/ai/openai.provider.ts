import axios from 'axios';
import { z } from 'zod';
import { AIHintContext, AIHintResponse, AIProvider } from './ai.interface';

const aiResponseSchema = z.object({
  errorType: z.string().max(100),
  explanation: z.string().max(1000),
  hint: z.string().max(1000),
  concepts: z.array(z.string().max(100)).max(5),
  nextSteps: z.array(z.string().max(200)).max(5)
});

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
  }

  async generateHint(context: AIHintContext): Promise<AIHintResponse> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an educational programming tutor. Do not provide a complete solution. Do not rewrite the student\'s entire code. Do not guess hidden input/output. Give conceptual debugging guidance. Focus on the detected error type. Keep the hint actionable but not a direct answer. Respond with JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenAI');
      }

      const rawContent = response.data.choices[0].message.content;
      let parsedJson;
      try {
        parsedJson = JSON.parse(rawContent);
      } catch (e) {
        throw new Error('Failed to parse OpenAI response as JSON');
      }

      const validated = aiResponseSchema.parse(parsedJson);
      return validated;

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new Error('AI response failed validation: ' + error.message);
      }
      throw new Error('Failed to communicate with AI provider: ' + (error.message || 'Unknown error'));
    }
  }

  private buildPrompt(context: AIHintContext): string {
    return `
      Please act as an educational programming tutor and help the student debug their code.
      DO NOT write the corrected code for them.
      
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

      Please return a JSON object with the following fields:
      - errorType: string (e.g. "WRONG_ANSWER", "RUNTIME_ERROR")
      - explanation: string (a short explanation of what the error means in this context)
      - hint: string (a specific conceptual hint for the student's code)
      - concepts: string[] (up to 5 concepts to review)
      - nextSteps: string[] (up to 5 actionable steps to trace or debug)
    `;
  }
}
