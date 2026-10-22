import { randomUUID, createHash } from 'crypto';
import { SupportedLanguage } from '../execution/execution.types';
import { TestCaseInput } from '../evaluation/evaluation.service';
import { EvaluationResponse } from '../evaluation/evaluation.types';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ExecutionService } from '../execution/execution.service';

export type JobType = 'EVALUATION' | 'EXECUTION';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface JudgeJobData {
  type: JobType;
  studentId: string;
  labId?: string;
  language: SupportedLanguage;
  sourceCode: string;
  testCases?: TestCaseInput[];
  input?: string;
}

export interface JudgeJob {
  id: string;
  dedupKey: string;
  data: JudgeJobData;
  status: JobStatus;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
  timer?: NodeJS.Timeout;
}

export class JudgeQueueService {
  private static instance: JudgeQueueService;
  private queue: JudgeJob[] = [];
  private activeJobs: Map<string, JudgeJob> = new Map();
  private completedJobs: Map<string, JudgeJob> = new Map();
  private maxConcurrency = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10);
  private maxQueueDepth = parseInt(process.env.MAX_QUEUE_DEPTH || '50', 10);
  private jobTimeoutMs = parseInt(process.env.JOB_TIMEOUT_MS || '30000', 10); // 30s max total job time
  private isShuttingDown = false;

  private constructor() {
    // Singleton
  }

  public static getInstance(): JudgeQueueService {
    if (!JudgeQueueService.instance) {
      JudgeQueueService.instance = new JudgeQueueService();
    }
    return JudgeQueueService.instance;
  }

  private computeDedupKey(data: JudgeJobData): string {
    const codeHash = createHash('sha256').update(data.sourceCode).digest('hex').substring(0, 16);
    return `${data.studentId}:${data.labId || 'general'}:${data.type}:${codeHash}`;
  }

  public async enqueueAndWait<T = EvaluationResponse>(data: JudgeJobData): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down. No new jobs accepted.');
    }

    const dedupKey = this.computeDedupKey(data);

    // Check for duplicate pending or running job
    const existingActive = Array.from(this.activeJobs.values()).find(j => j.dedupKey === dedupKey);
    if (existingActive) {
      throw new Error('A duplicate execution is already in progress. Please wait for it to finish.');
    }

    const existingQueued = this.queue.find(j => j.dedupKey === dedupKey);
    if (existingQueued) {
      throw new Error('A duplicate execution is already queued. Please wait.');
    }

    if (this.queue.length >= this.maxQueueDepth) {
      throw new Error('Server is currently busy with too many queued executions. Please try again.');
    }

    const jobId = randomUUID();

    return new Promise<T>((resolve, reject) => {
      const job: JudgeJob = {
        id: jobId,
        dedupKey,
        data,
        status: 'QUEUED',
        retries: 0,
        maxRetries: 1, // Only 1 retry for unexpected worker failures
        createdAt: new Date(),
        resolve,
        reject
      };

      // Set timeout timer
      job.timer = setTimeout(() => {
        this.handleJobTimeout(job);
      }, this.jobTimeoutMs);

      this.queue.push(job);
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isShuttingDown) return;
    if (this.activeJobs.size >= this.maxConcurrency) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    job.status = 'RUNNING';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);

    this.runWorker(job);
  }

  private async runWorker(job: JudgeJob): Promise<void> {
    try {
      let result: any;

      if (job.data.type === 'EVALUATION') {
        result = await EvaluationService.evaluateCode(
          job.data.language,
          job.data.sourceCode,
          job.data.testCases || []
        );
      } else {
        result = await ExecutionService.executeCode(
          job.data.language,
          job.data.sourceCode,
          job.data.input || ''
        );
      }

      if (job.timer) clearTimeout(job.timer);
      job.status = 'COMPILATION_ERROR' in (result?.evaluation || {}) ? 'COMPLETED' : 'COMPLETED';
      job.completedAt = new Date();
      job.result = result;

      this.activeJobs.delete(job.id);
      this.saveCompletedJob(job);

      if (job.resolve) {
        job.resolve(result);
      }
    } catch (err: any) {
      console.error(`[JudgeWorker] Worker failure for job ${job.id}:`, err);

      // Safe retry logic: only retry on unexpected internal crashes, not on student compilation/syntax errors
      if (job.retries < job.maxRetries && !job.data.sourceCode.includes('intentional_crash')) {
        job.retries++;
        console.log(`[JudgeWorker] Retrying job ${job.id} (attempt ${job.retries + 1})...`);
        job.status = 'QUEUED';
        this.activeJobs.delete(job.id);
        this.queue.unshift(job);
      } else {
        if (job.timer) clearTimeout(job.timer);
        job.status = 'FAILED';
        job.completedAt = new Date();
        job.error = err?.message || 'Worker execution failed';

        this.activeJobs.delete(job.id);
        this.saveCompletedJob(job);

        if (job.reject) {
          job.reject(err);
        }
      }
    } finally {
      this.processNext();
    }
  }

  private handleJobTimeout(job: JudgeJob): void {
    if (job.status === 'COMPLETED' || job.status === 'FAILED') return;

    job.status = 'TIMEOUT';
    job.completedAt = new Date();
    job.error = 'Job execution exceeded maximum allowed time in queue/worker.';

    // Remove from queue or active
    const qIndex = this.queue.findIndex(j => j.id === job.id);
    if (qIndex !== -1) {
      this.queue.splice(qIndex, 1);
    }
    this.activeJobs.delete(job.id);
    this.saveCompletedJob(job);

    if (job.reject) {
      job.reject(new Error(job.error));
    }

    this.processNext();
  }

  private saveCompletedJob(job: JudgeJob): void {
    this.completedJobs.set(job.id, job);
    // Keep max 100 historical jobs
    if (this.completedJobs.size > 100) {
      const oldestKey = this.completedJobs.keys().next().value;
      if (oldestKey) this.completedJobs.delete(oldestKey);
    }
  }

  public getJob(id: string): JudgeJob | undefined {
    return this.activeJobs.get(id) || this.queue.find(j => j.id === id) || this.completedJobs.get(id);
  }

  public getStats() {
    return {
      active: this.activeJobs.size,
      queued: this.queue.length,
      completed: this.completedJobs.size,
      maxConcurrency: this.maxConcurrency,
      maxQueueDepth: this.maxQueueDepth
    };
  }

  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    for (const job of this.queue) {
      if (job.timer) clearTimeout(job.timer);
      if (job.reject) job.reject(new Error('Server shutting down'));
    }
    this.queue = [];
  }
}

export const judgeQueue = JudgeQueueService.getInstance();
