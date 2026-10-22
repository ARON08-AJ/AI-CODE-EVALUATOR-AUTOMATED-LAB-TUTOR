import { spawn } from 'child_process';
import { ExecutionResult, ExecutionStatus } from './execution.types';

export class ProcessRunner {
  static async runProcess(
    command: string,
    args: string[],
    cwd: string,
    input: string,
    timeoutMs: number,
    outputLimit: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let stdoutData = '';
      let stderrData = '';
      let isFinished = false;
      let limitExceeded = false;
      const startTime = Date.now();

      const child = spawn(command, args, {
        cwd,
        env: { PATH: process.env.PATH }, // minimal environment
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let timeoutTimer: NodeJS.Timeout | null = setTimeout(() => {
        if (isFinished) return;
        isFinished = true;
        child.kill('SIGKILL');
        resolve({
          status: 'TIME_LIMIT_EXCEEDED',
          stdout: stdoutData,
          stderr: 'Execution timed out.',
          executionTime: timeoutMs
        });
      }, timeoutMs);

      const appendOutput = (data: Buffer, isError: boolean) => {
        if (limitExceeded || isFinished) return;
        
        const text = data.toString('utf-8');
        if (isError) {
          stderrData += text;
        } else {
          stdoutData += text;
        }

        if (stdoutData.length + stderrData.length > outputLimit) {
          limitExceeded = true;
          isFinished = true;
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
          }
          child.kill('SIGKILL');
          resolve({
            status: 'OUTPUT_LIMIT_EXCEEDED',
            stdout: stdoutData.substring(0, outputLimit),
            stderr: 'Output limit exceeded.',
            executionTime: Date.now() - startTime
          });
        }
      };

      if (child.stdout) {
        child.stdout.on('data', (data) => appendOutput(data, false));
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => appendOutput(data, true));
      }

      child.on('error', (err) => {
        if (isFinished) return;
        isFinished = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        
        resolve({
          status: 'RUNTIME_ERROR',
          stdout: stdoutData,
          stderr: err.message,
          executionTime: Date.now() - startTime
        });
      });

      child.on('close', (code, signal) => {
        if (isFinished) return;
        isFinished = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        
        const executionTime = Date.now() - startTime;
        
        if (signal === 'SIGKILL' || signal === 'SIGTERM') {
          // Already handled by timeout or output limit.
          return;
        }

        if (code !== 0) {
          resolve({
            status: 'RUNTIME_ERROR',
            stdout: stdoutData,
            stderr: stderrData || `Process exited with code ${code}`,
            executionTime
          });
        } else {
          resolve({
            status: 'SUCCESS',
            stdout: stdoutData,
            stderr: stderrData,
            executionTime
          });
        }
      });

      // Write input to stdin
      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
    });
  }
}
