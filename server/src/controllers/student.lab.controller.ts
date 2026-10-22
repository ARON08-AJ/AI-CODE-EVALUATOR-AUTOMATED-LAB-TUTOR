import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { EvaluationService, TestCaseInput } from '../services/evaluation/evaluation.service';
import { EvaluationResponse } from '../services/evaluation/evaluation.types';
import { SubmissionService } from '../services/submission/submission.service';
import { judgeQueue } from '../services/queue/judge.queue';

const prisma = new PrismaClient();

export const getDeadlineStatus = (dueDate: Date | string | null): 'NO_DEADLINE' | 'ACTIVE' | 'OVERDUE' => {
  if (!dueDate) return 'NO_DEADLINE';
  const now = new Date();
  const due = new Date(dueDate);
  return now >= due ? 'OVERDUE' : 'ACTIVE';
};

export const getTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const topics = await prisma.topic.findMany({
      where: {
        labs: {
          some: {
            published: true,
            assignments: {
              some: { studentId }
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            labs: {
              where: {
                published: true,
                assignments: {
                  some: { studentId }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ topics });
  } catch (err) {
    next(err);
  }
};

export const getLabsByTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const topicId = req.params.topicId as string;
    const { tagId } = req.query;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    const assignments = await prisma.labAssignment.findMany({
      where: { studentId },
      select: { labId: true, dueDate: true }
    });
    const assignmentMap = new Map(assignments.map(a => [a.labId, a.dueDate]));

    const whereClause: any = { 
      topicId,
      published: true,
      assignments: {
        some: {
          studentId
        }
      }
    };

    if (tagId && typeof tagId === 'string') {
      whereClause.tags = { some: { id: tagId } };
    }

    const labs = await prisma.lab.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        difficulty: true,
        supportedLanguages: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        tags: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedLabs = labs.map(lab => {
      const assignmentDueDate = assignmentMap.get(lab.id);
      const effectiveDueDate = assignmentDueDate ?? lab.dueDate ?? null;
      return {
        ...lab,
        dueDate: effectiveDueDate,
        deadlineStatus: getDeadlineStatus(effectiveDueDate)
      };
    });

    res.status(200).json({ topic, labs: formattedLabs });
  } catch (err) {
    next(err);
  }
};

export const getPublishedLabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { tagId } = req.query;

    const assignments = await prisma.labAssignment.findMany({
      where: { studentId },
      select: { labId: true, dueDate: true }
    });
    const assignmentMap = new Map(assignments.map(a => [a.labId, a.dueDate]));

    const whereClause: any = { 
      published: true,
      assignments: {
        some: {
          studentId
        }
      }
    };

    if (tagId && typeof tagId === 'string') {
      whereClause.tags = { some: { id: tagId } };
    }

    const labs = await prisma.lab.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        difficulty: true,
        supportedLanguages: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        tags: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedLabs = labs.map(lab => {
      const assignmentDueDate = assignmentMap.get(lab.id);
      const effectiveDueDate = assignmentDueDate ?? lab.dueDate ?? null;
      return {
        ...lab,
        dueDate: effectiveDueDate,
        deadlineStatus: getDeadlineStatus(effectiveDueDate)
      };
    });

    res.status(200).json({ labs: formattedLabs });
  } catch (err) {
    next(err);
  }
};

export const getLabById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const studentId = req.user!.id;

    const assignment = await prisma.labAssignment.findUnique({
      where: {
        studentId_labId: {
          studentId,
          labId: id
        }
      },
      select: {
        dueDate: true
      }
    });

    let lab = await prisma.lab.findFirst({
      where: { 
        id, 
        published: true,
        assignments: {
          some: {
            studentId
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        constraints: true,
        sampleInput: true,
        sampleOutput: true,
        difficulty: true,
        supportedLanguages: true,
        published: true,
        dueDate: true,
        tags: { select: { id: true, name: true } },
        testCases: {
          where: { visibility: 'PUBLIC' },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
            visibility: true
          }
        }
      }
    });

    if (!lab) {
      const activeExamAttempt = await prisma.examAttempt.findFirst({
        where: {
          studentId,
          status: 'IN_PROGRESS',
          exam: {
            published: true,
            questions: { some: { labId: id } },
            endTime: { gte: new Date() }
          }
        }
      });

      if (activeExamAttempt) {
        lab = await prisma.lab.findFirst({
          where: { id, published: true },
          select: {
            id: true,
            title: true,
            description: true,
            constraints: true,
            sampleInput: true,
            sampleOutput: true,
            difficulty: true,
            supportedLanguages: true,
            published: true,
            dueDate: true,
            tags: { select: { id: true, name: true } },
            testCases: {
              where: { visibility: 'PUBLIC' },
              select: {
                id: true,
                input: true,
                expectedOutput: true,
                visibility: true
              }
            }
          }
        });
      }
    }

    if (!lab) {
      res.status(404).json({ error: 'Lab not found or you are not assigned to it' });
      return;
    }

    const effectiveDueDate = assignment?.dueDate ?? lab.dueDate ?? null;

    res.status(200).json({
      lab: {
        ...lab,
        dueDate: effectiveDueDate,
        deadlineStatus: getDeadlineStatus(effectiveDueDate)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const assignments = await prisma.labAssignment.findMany({
      where: { studentId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            supportedLanguages: true,
            published: true,
            dueDate: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    const publishedAssignments = assignments
      .filter(a => a.lab.published)
      .map(a => {
        const effectiveDueDate = a.dueDate ?? a.lab.dueDate ?? null;
        return {
          ...a,
          dueDate: effectiveDueDate,
          deadlineStatus: getDeadlineStatus(effectiveDueDate)
        };
      });

    res.status(200).json({ assignments: publishedAssignments });
  } catch (err) {
    next(err);
  }
};

const runLabSchema = z.object({
  language: z.enum(['C', 'C++', 'Java', 'Python']),
  sourceCode: z.string().min(1, 'Source code cannot be empty')
});

export const runLabCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const studentId = req.user!.id;

    const parseResult = runLabSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request', details: parseResult.error.format() });
      return;
    }
    const { language, sourceCode } = parseResult.data;

    const maxSourceSize = parseInt(process.env.MAX_SOURCE_CODE_SIZE || '100000', 10);
    if (Buffer.byteLength(sourceCode, 'utf8') > maxSourceSize) {
      res.status(400).json({ error: `Source code exceeds maximum allowed size of ${maxSourceSize} bytes.` });
      return;
    }

    let lab = await prisma.lab.findFirst({
      where: { 
        id, 
        published: true,
        assignments: {
          some: {
            studentId
          }
        }
      },
      select: { id: true }
    });

    if (!lab) {
      const activeExamAttempt = await prisma.examAttempt.findFirst({
        where: {
          studentId,
          status: 'IN_PROGRESS',
          exam: {
            published: true,
            questions: { some: { labId: id } },
            endTime: { gte: new Date() }
          }
        }
      });

      if (activeExamAttempt) {
        lab = await prisma.lab.findFirst({
          where: { id, published: true },
          select: { id: true }
        });
      }
    }

    if (!lab) {
      res.status(404).json({ error: 'Lab not found or you are not assigned to it' });
      return;
    }

    const testCasesDb = await prisma.testCase.findMany({
      where: { labId: id, visibility: 'PUBLIC' },
      orderBy: { createdAt: 'asc' }
    });

    if (testCasesDb.length === 0) {
      res.status(400).json({ error: 'No public test cases configured for this lab.' });
      return;
    }

    const testCases: TestCaseInput[] = testCasesDb.map(tc => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      visibility: tc.visibility as 'PUBLIC' | 'HIDDEN'
    }));

    const response = await judgeQueue.enqueueAndWait<EvaluationResponse>({
      type: 'EVALUATION',
      studentId,
      labId: id,
      language,
      sourceCode,
      testCases
    });
    
    if (!response.success && response.error?.includes('Server is currently busy')) {
      res.status(429).json(response);
      return;
    }

    if (!response.success) {
      res.status(500).json(response);
      return;
    }

    res.status(200).json(response);
  } catch (err: any) {
    if (err.message?.includes('duplicate') || err.message?.includes('busy')) {
      res.status(429).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

const submitLabSchema = z.object({
  language: z.enum(['C', 'C++', 'Java', 'Python']),
  sourceCode: z.string().min(1, 'Source code cannot be empty')
});

export const submitLabCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const studentId = req.user!.id;

    const parseResult = submitLabSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request', details: parseResult.error.format() });
      return;
    }
    const { language, sourceCode } = parseResult.data;

    const maxSourceSize = parseInt(process.env.MAX_SOURCE_CODE_SIZE || '100000', 10);

    if (Buffer.byteLength(sourceCode, 'utf8') > maxSourceSize) {
      res.status(400).json({ error: `Source code exceeds maximum allowed size of ${maxSourceSize} bytes.` });
      return;
    }

    const assignment = await prisma.labAssignment.findUnique({
      where: {
        studentId_labId: {
          studentId,
          labId: id
        }
      },
      include: {
        lab: {
          select: {
            id: true,
            published: true,
            dueDate: true
          }
        }
      }
    });

    let isExamSubmission = false;
    let targetLab = assignment?.lab;

    if (!targetLab || !targetLab.published) {
      const activeExamAttempt = await prisma.examAttempt.findFirst({
        where: {
          studentId,
          status: 'IN_PROGRESS',
          exam: {
            published: true,
            questions: { some: { labId: id } },
            endTime: { gte: new Date() }
          }
        }
      });

      if (activeExamAttempt) {
        const examLab = await prisma.lab.findFirst({
          where: { id, published: true },
          select: { id: true, published: true, dueDate: true }
        });
        if (examLab) {
          targetLab = examLab;
          isExamSubmission = true;
        }
      }
    }

    if (!targetLab || !targetLab.published) {
      res.status(404).json({ error: 'Lab not found or you are not assigned to it' });
      return;
    }

    // CHECK DEADLINE (only enforce homework deadline if not taking an active exam)
    if (!isExamSubmission && assignment) {
      const effectiveDueDate = assignment.dueDate ?? assignment.lab.dueDate ?? null;
      if (effectiveDueDate && new Date() >= new Date(effectiveDueDate)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DEADLINE_PASSED',
            message: 'The submission deadline has passed.'
          }
        });
        return;
      }
    }

    const testCasesDb = await prisma.testCase.findMany({
      where: { labId: id },
      orderBy: { createdAt: 'asc' }
    });

    if (testCasesDb.length === 0) {
      res.status(400).json({ error: 'No test cases configured for this lab.' });
      return;
    }

    const testCases: TestCaseInput[] = testCasesDb.map(tc => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      visibility: tc.visibility as 'PUBLIC' | 'HIDDEN'
    }));

    const response = await judgeQueue.enqueueAndWait<EvaluationResponse>({
      type: 'EVALUATION',
      studentId,
      labId: id,
      language,
      sourceCode,
      testCases
    });
    
    if (!response.success && response.error?.includes('Server is currently busy')) {
      res.status(429).json(response);
      return;
    }

    if (!response.success) {
      res.status(500).json(response);
      return;
    }

    if (response.evaluation) {
      const testCasesDbMap = new Map<number, string>();
      testCases.forEach((tc, index) => {
        testCasesDbMap.set(index + 1, tc.id);
      });

      try {
        const submission = await SubmissionService.saveSubmission(
          studentId,
          id,
          language,
          sourceCode,
          response.evaluation,
          testCasesDbMap
        );

        (response.evaluation as any).submissionId = submission.id;
      } catch (dbErr) {
        console.error(`[submitLabCode] Failed to persist submission for student ${studentId}:`, dbErr);
        res.status(500).json({ error: 'Evaluation succeeded but saving submission failed. Please try again.' });
        return;
      }
    }

    res.status(200).json(response);
  } catch (err: any) {
    if (err.message?.includes('duplicate') || err.message?.includes('busy')) {
      res.status(429).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

