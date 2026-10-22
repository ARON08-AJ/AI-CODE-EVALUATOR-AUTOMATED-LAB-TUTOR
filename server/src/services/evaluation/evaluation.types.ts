export type EvaluationStatus = 
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export type TestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export interface TestEvaluationResult {
  testNumber: number;
  visibility: TestCaseVisibility;
  status: EvaluationStatus;
  executionTime?: number | null;
  // Included only for public tests on failure, or as specified
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
}

export interface EvaluationResult {
  status: EvaluationStatus;
  passedTests: number;
  totalTests: number;
  failedTests: number;
  executionTime: number; // Aggregate or max execution time
  tests: TestEvaluationResult[];
  compilerOutput?: string;
}

export interface EvaluationResponse {
  success: boolean;
  evaluation?: EvaluationResult;
  error?: string;
}
