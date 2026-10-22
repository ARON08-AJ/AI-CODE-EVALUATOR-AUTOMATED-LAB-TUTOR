export type ExecutionStatus = 
  | 'SUCCESS'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'EXECUTION_LIMIT_REACHED'
  | 'INTERNAL_ERROR';

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  executionTime: number | null;
}

export interface ExecutionResponse {
  success: boolean;
  result: ExecutionResult;
}

export type SupportedLanguage = 'C' | 'C++' | 'Java' | 'Python';

export interface LanguageConfig {
  compiler?: string;
  interpreter?: string;
  compileRequired: boolean;
  sourceFilename: string;
  executableFilename?: string;
  mainClass?: string;
  compileArgs?: (sourceFile: string, executableFile: string) => string[];
  executeArgs: (executableFile: string, mainClass?: string) => string[];
}
