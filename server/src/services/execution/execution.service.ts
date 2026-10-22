import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SupportedLanguage, ExecutionResponse, ExecutionResult } from './execution.types';
import { languageConfigs } from './language.config';
import { ProcessRunner } from './process.runner';

export class ExecutionService {
  private static activeExecutions = 0;
  private static maxConcurrentExecutions = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10);
  private static executionTimeoutMs = parseInt(process.env.EXECUTION_TIMEOUT_MS || '5000', 10);
  private static outputLimit = parseInt(process.env.EXECUTION_OUTPUT_LIMIT || '100000', 10);
  private static maxSourceCodeSize = parseInt(process.env.MAX_SOURCE_CODE_SIZE || '65536', 10); // 64KB
  private static dockerImage = process.env.DOCKER_SANDBOX_IMAGE || 'code-eval-sandbox:latest';
  private static useDockerSandbox = process.env.USE_DOCKER_SANDBOX !== 'false';

  public static async executeCode(
    language: SupportedLanguage,
    sourceCode: string,
    input: string
  ): Promise<ExecutionResponse> {
    if (sourceCode.length > this.maxSourceCodeSize) {
      return {
        success: false,
        result: {
          status: 'RUNTIME_ERROR',
          stdout: '',
          stderr: `Source code exceeds maximum allowed size of ${this.maxSourceCodeSize} bytes.`,
          executionTime: null
        }
      };
    }

    if (this.activeExecutions >= this.maxConcurrentExecutions) {
      return {
        success: false,
        result: {
          status: 'EXECUTION_LIMIT_REACHED',
          stdout: '',
          stderr: 'Server is currently busy with too many executions. Please try again.',
          executionTime: null
        }
      };
    }

    this.activeExecutions++;
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

      // Helper for executing commands locally or inside Docker container
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

      // 1. Compile Phase
      if (config.compileRequired && config.compiler && config.compileArgs) {
        const executable = config.executableFilename || 'main';
        const compileArgs = config.compileArgs(config.sourceFilename, executable);
        
        const compileResult = await runCmd(
          config.compiler,
          compileArgs,
          '',
          parseInt(process.env.COMPILATION_TIMEOUT_MS || '15000', 10) // Compilation timeout (15s)
        );

        if (compileResult.status !== 'SUCCESS') {
          return {
            success: true,
            result: {
              status: 'COMPILATION_ERROR',
              stdout: compileResult.stdout,
              stderr: this.sanitizePath(compileResult.stderr, workspacePath),
              executionTime: null
            }
          };
        }
      }

      // 2. Execution Phase
      const executableTarget = config.compileRequired ? (config.executableFilename || 'main') : config.sourceFilename;
      const executeCommand = config.executeArgs(executableTarget, config.mainClass);
      
      const executionResult = await runCmd(
        executeCommand[0], // Executable or Interpreter
        executeCommand.slice(1), // Args
        input,
        this.executionTimeoutMs
      );

      return {
        success: true,
        result: {
          status: executionResult.status,
          stdout: executionResult.stdout,
          stderr: this.sanitizePath(executionResult.stderr, workspacePath),
          executionTime: executionResult.executionTime
        }
      };

    } catch (err: any) {
      console.error(`[ExecutionService] Unexpected error for ${executionId}:`, err);
      return {
        success: false,
        result: {
          status: 'INTERNAL_ERROR',
          stdout: '',
          stderr: 'An unexpected error occurred during execution.',
          executionTime: null
        }
      };
    } finally {
      this.activeExecutions--;
      try {
        await fs.rm(workspacePath, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`[ExecutionService] Failed to clean up workspace ${workspacePath}:`, rmErr);
      }
    }
  }

  private static sanitizePath(text: string, workspacePath: string): string {
    if (!text) return text;
    const escapedWorkspacePath = workspacePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedWorkspacePath}/`, 'g');
    return text.replace(regex, '').replace(/\/workspace\//g, '');
  }
}

