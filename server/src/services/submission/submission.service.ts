import { PrismaClient } from '@prisma/client';
import { EvaluationResult, TestEvaluationResult } from '../evaluation/evaluation.types';

const prisma = new PrismaClient();

export class SubmissionService {
  /**
   * Persists an evaluation result as a Submission and its SubmissionTestResults.
   * Runs in a transaction to ensure integrity.
   */
  public static async saveSubmission(
    studentId: string,
    labId: string,
    language: string,
    sourceCode: string,
    evaluation: EvaluationResult,
    testCasesDbMap: Map<number, string> // Map from testNumber (1-indexed) to actual DB testCaseId
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the Submission record
      const submission = await tx.submission.create({
        data: {
          studentId,
          labId,
          language,
          sourceCode,
          status: evaluation.status,
          executionTime: evaluation.executionTime,
          totalTests: evaluation.totalTests,
          passedTests: evaluation.passedTests,
          failedTests: evaluation.failedTests
        }
      });

      // 2. Create the SubmissionTestResult records
      if (evaluation.tests && evaluation.tests.length > 0) {
        const testResultsData = evaluation.tests.map((testResult: TestEvaluationResult) => {
          const testCaseId = testCasesDbMap.get(testResult.testNumber);
          if (!testCaseId) {
            throw new Error(`testCaseId not found for testNumber ${testResult.testNumber}`);
          }
          
          return {
            submissionId: submission.id,
            testCaseId: testCaseId,
            passed: testResult.status === 'ACCEPTED',
            executionTime: testResult.executionTime || 0,
            status: testResult.status
          };
        });

        await tx.submissionTestResult.createMany({
          data: testResultsData
        });
      }

      return submission;
    });
  }
}
