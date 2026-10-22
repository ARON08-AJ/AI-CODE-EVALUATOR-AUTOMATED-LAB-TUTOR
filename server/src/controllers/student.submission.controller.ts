import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const getSubmissionsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default('20').transform(Number),
  labId: z.string().optional()
});

export const getStudentSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const parseResult = getSubmissionsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parseResult.error.format() });
      return;
    }

    const { page, limit, labId } = parseResult.data;
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const whereClause: any = { studentId };
    if (labId) {
      whereClause.labId = labId;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          lab: {
            select: { title: true }
          }
        }
      }),
      prisma.submission.count({ where: whereClause })
    ]);

    // Format safe DTOs (omitting source code from list view to save bandwidth)
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      labId: sub.labId,
      labTitle: sub.lab.title,
      language: sub.language,
      status: sub.status,
      passedTests: sub.passedTests,
      totalTests: sub.totalTests,
      failedTests: sub.failedTests,
      executionTime: sub.executionTime,
      createdAt: sub.createdAt
    }));

    res.status(200).json({
      success: true,
      submissions: formattedSubmissions,
      metadata: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentSubmissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const submissionId = req.params.id as string;

    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentId
      },
      include: {
        aiFeedback: true,
        lab: {
          select: { title: true }
        },
        testResults: {
          include: {
            testCase: {
              select: {
                visibility: true,
                input: true,
                expectedOutput: true
              }
            }
          },
          orderBy: {
            testCase: {
              createdAt: 'asc'
            }
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Safely map test results based on visibility
    const safeTestResults = submission.testResults.map((tr, index) => {
      const isPublic = tr.testCase.visibility === 'PUBLIC';
      return {
        testNumber: index + 1,
        visibility: tr.testCase.visibility,
        status: tr.status,
        passed: tr.passed,
        executionTime: tr.executionTime,
        // Only include exact I/O details if public, according to constraints.
        // Actually, we don't strictly need to return exact input/output if they just want the verdict, 
        // but it is helpful for debugging. Phase 10 spec says "For PUBLIC tests: You may return safe actual/expected."
        ...(isPublic && tr.status === 'WRONG_ANSWER' && { expectedOutput: tr.testCase.expectedOutput })
      };
    });

    const formattedFeedback = submission.aiFeedback
      .sort((a, b) => a.hintLevel - b.hintLevel)
      .map(fb => ({
        id: fb.id,
        submissionId: fb.submissionId,
        hintLevel: fb.hintLevel,
        errorType: fb.errorType,
        explanation: fb.explanation,
        hint: fb.hint,
        concepts: fb.conceptsToReview ? JSON.parse(fb.conceptsToReview) : [],
        nextSteps: fb.nextSteps ? JSON.parse(fb.nextSteps) : [],
        createdAt: fb.createdAt
      }));

    res.status(200).json({
      success: true,
      submission: {
        id: submission.id,
        labId: submission.labId,
        labTitle: submission.lab.title,
        language: submission.language,
        sourceCode: submission.sourceCode,
        status: submission.status,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        failedTests: submission.failedTests,
        executionTime: submission.executionTime,
        createdAt: submission.createdAt,
        tests: safeTestResults,
        aiFeedback: formattedFeedback
      }
    });
  } catch (err) {
    next(err);
  }
};
