export interface AIHintResponse {
  errorType: string;
  explanation: string;
  hint: string;
  concepts: string[];
  nextSteps: string[];
}

export interface SafeTestResult {
  testNumber: number;
  status: string;
  // NO HIDDEN payload fields here!
  // If visibility is PUBLIC, we might include expected/actual, but to be completely safe and uniform,
  // we can just pass status and maybe whether it was public/hidden.
  visibility: 'PUBLIC' | 'HIDDEN';
  expectedOutput?: string; // Only populated if PUBLIC
  actualOutput?: string; // Only populated if PUBLIC
}

export interface PreviousHint {
  hintLevel: number;
  explanation: string;
  hint: string;
}

export interface AIHintContext {
  language: string;
  sourceCode: string;
  status: string;
  problemTitle: string;
  problemDescription: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testResults: SafeTestResult[];
  hintLevel?: number;
  previousHints?: PreviousHint[];
}

export interface AIProvider {
  generateHint(context: AIHintContext): Promise<AIHintResponse>;
}
