import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SupportedLanguage } from '../execution/execution.types';
import { languageConfigs } from '../execution/language.config';
import { ProcessRunner } from '../execution/process.runner';
import { compareOutputs } from './output.comparator';
import {
  EvaluationResponse,
  EvaluationResult,
  EvaluationStatus,
  TestEvaluationResult,
  TestCaseVisibility
} from './evaluation.types';

export interface TestCaseInput {
  id: string;
  input: string;
  expectedOutput: string;
  visibility: TestCaseVisibility;
}

export class EvaluationService {
  private static activeEvaluations = 0;
  private static maxConcurrentExecutions = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10);
  private static executionTimeoutMs = parseInt(process.env.EXECUTION_TIMEOUT_MS || '5000', 10);
  private static dockerImage = process.env.DOCKER_SANDBOX_IMAGE || 'code-eval-sandbox:latest';
  private static useDockerSandbox = process.env.USE_DOCKER_SANDBOX !== 'false';
  private static outputLimit = parseInt(process.env.EXECUTION_OUTPUT_LIMIT || '100000', 10);

  public static async evaluateCode(
    language: SupportedLanguage,
    sourceCode: string,
    testCases: TestCaseInput[]
  ): Promise<EvaluationResponse> {
    if (this.activeEvaluations >= this.maxConcurrentExecutions) {
      return {
        success: false,
        error: 'Server is currently busy with too many executions. Please try again.',
      };
    }

    this.activeEvaluations++;
    const executionId = randomUUID();
    const workspacePath = path.join('/tmp', 'programming-lab-exec', executionId);

    try {
      const config = languageConfigs[language];
      if (!config) {
        throw new Error('Unsupported language');
      }

      await fs.mkdir(workspacePath, { recursive: true });
      const sourceFilePath = path.join(workspacePath, config.sourceFilename);
      await fs.writeFile(sourceFilePath, sourceCode, 'utf-8');

      const runCmd = async (
        cmd: string,
        args: string[],
        stdinInput: string,
        timeout: number
      ) => {
        if (this.useDockerSandbox) {
          const dockerArgs = [
            'run', '--rm', '-i',
            '--network', 'none',
            '--memory', '256m',
            '--memory-swap', '256m',
            '--cpus', '1.0',
            '--pids-limit', '64',
            '-v', `${workspacePath}:/workspace`,
            '-w', '/workspace',
            this.dockerImage,
            cmd,
            ...args
          ];
          return ProcessRunner.runProcess(
            'docker',
            dockerArgs,
            workspacePath,
            stdinInput,
            timeout,
            this.outputLimit
          );
        } else {
          return ProcessRunner.runProcess(
            cmd,
            args,
            workspacePath,
            stdinInput,
            timeout,
            this.outputLimit
          );
        }
      };

      // 1. Compile Phase (Once)
      if (config.compileRequired && config.compiler && config.compileArgs) {
        const executable = config.executableFilename || 'main';
        const compileArgs = config.compileArgs(config.sourceFilename, executable);

        const compileResult = await runCmd(
          config.compiler,
          compileArgs,
          '',
          10000 // Compilation timeout (10s)
        );

        if (compileResult.status !== 'SUCCESS') {
          return {
            success: true,
            evaluation: {
              status: 'COMPILATION_ERROR',
              passedTests: 0,
              totalTests: testCases.length,
              failedTests: testCases.length,
              executionTime: 0,
              tests: [],
              compilerOutput: this.sanitizePath(compileResult.stderr, workspacePath)
            }
          };
        }
      }

      // 2. Evaluation Phase (Multiple Tests sequentially)
      const executableTarget = config.compileRequired ? (config.executableFilename || 'main') : config.sourceFilename;
      const executeCommand = config.executeArgs(executableTarget, config.mainClass);

      const testResults: TestEvaluationResult[] = [];
      let totalExecutionTime = 0;
      let overallStatus: EvaluationStatus = 'ACCEPTED';

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const executionResult = await runCmd(
          executeCommand[0], // Executable or Interpreter
          executeCommand.slice(1), // Args
          tc.input,
          this.executionTimeoutMs
        );

        let testStatus: EvaluationStatus = 'ACCEPTED';

        // Map execution result to evaluation status
        if (executionResult.status === 'TIME_LIMIT_EXCEEDED') {
          testStatus = 'TIME_LIMIT_EXCEEDED';
        } else if (executionResult.status === 'OUTPUT_LIMIT_EXCEEDED') {
          testStatus = 'OUTPUT_LIMIT_EXCEEDED';
        } else if (executionResult.status === 'RUNTIME_ERROR') {
          testStatus = 'RUNTIME_ERROR';
        } else if (executionResult.status === 'SUCCESS') {
          const isCorrect = compareOutputs(executionResult.stdout, tc.expectedOutput);
          if (!isCorrect) {
            testStatus = 'WRONG_ANSWER';
          }
        } else {
          testStatus = 'INTERNAL_ERROR';
        }

        const timeTaken = executionResult.executionTime || 0;
        totalExecutionTime += timeTaken;

        // Build result safe for the student
        const resultItem: TestEvaluationResult = {
          testNumber: i + 1,
          visibility: tc.visibility,
          status: testStatus,
          executionTime: timeTaken
        };

        // Only include exact errors/outputs if it's PUBLIC and not accepted, or as needed
        if (tc.visibility === 'PUBLIC' && testStatus !== 'ACCEPTED') {
          if (testStatus === 'WRONG_ANSWER') {
            resultItem.expectedOutput = tc.expectedOutput;
            resultItem.actualOutput = executionResult.stdout;
          } else if (testStatus === 'RUNTIME_ERROR') {
            resultItem.error = this.sanitizePath(executionResult.stderr, workspacePath);
          }
        }

        testResults.push(resultItem);

        // Update overall status using strict precedence
        overallStatus = this.resolveOverallStatus(overallStatus, testStatus);
      }

      const passedTests = testResults.filter(r => r.status === 'ACCEPTED' || r.status === 'PASSED' as any).length;

      return {
        success: true,
        evaluation: {
          status: overallStatus,
          passedTests,
          totalTests: testCases.length,
          failedTests: testCases.length - passedTests,
          executionTime: totalExecutionTime,
          tests: testResults
        }
      };

    } catch (err: any) {
      console.error(`[EvaluationService] Unexpected error for ${executionId}:`, err);
      return {
        success: false,
        error: 'An unexpected error occurred during evaluation.'
      };
    } finally {
      this.activeEvaluations--;
      try {
        await fs.rm(workspacePath, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`[EvaluationService] Failed to clean up workspace ${workspacePath}:`, rmErr);
      }
    }
  }

  private static resolveOverallStatus(current: EvaluationStatus, next: EvaluationStatus): EvaluationStatus {
    const precedence: Record<EvaluationStatus, number> = {
      'COMPILATION_ERROR': 6,
      'TIME_LIMIT_EXCEEDED': 5,
      'OUTPUT_LIMIT_EXCEEDED': 4,
      'RUNTIME_ERROR': 3,
      'WRONG_ANSWER': 2,
      'ACCEPTED': 1,
      'INTERNAL_ERROR': 7
    };

    const currentWeight = precedence[current] || 0;
    const nextWeight = precedence[next] || 0;

    return nextWeight > currentWeight ? next : current;
  }

  private static sanitizePath(text: string, workspacePath: string): string {
    if (!text) return text;
    const escapedWorkspacePath = workspacePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedWorkspacePath}/`, 'g');
    return text.replace(regex, '').replace(/\/workspace\//g, '');
  }
}
