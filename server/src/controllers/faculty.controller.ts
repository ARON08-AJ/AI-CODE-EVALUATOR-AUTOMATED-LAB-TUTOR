import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.util';

const prisma = new PrismaClient();

const bulkEnrollSchema = z.object({
  prefix: z.string().min(1, 'Prefix is required').transform(s => s.trim()),
  start: z.number().int().nonnegative('Start must be non-negative'),
  end: z.number().int().nonnegative('End must be non-negative')
}).refine(data => data.start <= data.end, {
  message: 'Start must be less than or equal to End',
  path: ['start']
});

export const getStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, department, year, section } = req.query;

    const whereClause: any = { role: 'STUDENT' };

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { registerNumber: { contains: search } }
      ];
    }

    if (department && typeof department === 'string') {
      whereClause.department = department;
    }

    if (year && typeof year === 'string') {
      const parsedYear = parseInt(year, 10);
      if (!isNaN(parsedYear)) {
        whereClause.year = parsedYear;
      }
    }

    if (section && typeof section === 'string') {
      whereClause.section = section;
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        registerNumber: true,
        department: true,
        year: true,
        section: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
      orderBy: { registerNumber: 'asc' }
    });

    res.status(200).json({ students });
  } catch (err) {
    next(err);
  }
};

export const getStudentMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        department: true,
        year: true,
        section: true
      }
    });

    const departments = Array.from(new Set(students.map(s => s.department).filter(Boolean))) as string[];
    const years = Array.from(new Set(students.map(s => s.year).filter(Boolean))) as number[];
    const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean))) as string[];

    // Sort for predictable UI
    departments.sort();
    years.sort((a, b) => a - b);
    sections.sort();

    res.status(200).json({
      departments,
      years,
      sections
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        name: true,
        email: true,
        registerNumber: true,
        department: true,
        year: true,
        section: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        assignments: {
          include: {
            lab: {
              select: { id: true, title: true, difficulty: true }
            }
          }
        },
        submissions: {
          include: {
            lab: { select: { id: true, title: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student || student.role !== 'STUDENT') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.status(200).json({ student });
  } catch (err) {
    next(err);
  }
};

const generateRegisterNumbers = (prefix: string, start: number, end: number): string[] => {
  const result: string[] = [];
  for (let i = start; i <= end; i++) {
    const suffix = String(i).padStart(3, '0');
    result.push(`${prefix}${suffix}`);
  }
  return result;
};

export const previewBulkEnrollment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = bulkEnrollSchema.parse(req.body);
    const maxBulk = parseInt(process.env.MAX_BULK_STUDENTS || '500', 10);

    if (data.end - data.start + 1 > maxBulk) {
      res.status(400).json({ error: `Cannot process more than ${maxBulk} students at once.` });
      return;
    }

    const generatedRegNumbers = generateRegisterNumbers(data.prefix, data.start, data.end);

    const existingUsers = await prisma.user.findMany({
      where: { registerNumber: { in: generatedRegNumbers } },
      select: { registerNumber: true }
    });
    const existingSet = new Set(existingUsers.map(u => u.registerNumber));

    const preview = generatedRegNumbers.map(regNo => ({
      registerNumber: regNo,
      status: existingSet.has(regNo) ? 'EXISTING' : 'NEW'
    }));

    res.status(200).json({ preview });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const bulkEnrollStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = bulkEnrollSchema.parse(req.body);
    const maxBulk = parseInt(process.env.MAX_BULK_STUDENTS || '500', 10);

    if (data.end - data.start + 1 > maxBulk) {
      res.status(400).json({ error: `Cannot process more than ${maxBulk} students at once.` });
      return;
    }

    const generatedRegNumbers = generateRegisterNumbers(data.prefix, data.start, data.end);

    // Identify existing to skip
    const existingUsers = await prisma.user.findMany({
      where: { registerNumber: { in: generatedRegNumbers } },
      select: { registerNumber: true }
    });
    const existingSet = new Set(existingUsers.map(u => u.registerNumber));

    const newRegNumbers = generatedRegNumbers.filter(regNo => !existingSet.has(regNo));

    let createdCount = 0;
    let skippedCount = generatedRegNumbers.length - newRegNumbers.length;

    // Use sequential creation or Promise.all.
    // For large bulk inserts where Prisma might race, we will process sequentially for safe deduplication, 
    // wrapping in individual try-catch to guarantee idempotent failure recovery.
    for (const regNo of newRegNumbers) {
      try {
        const initialPassword = regNo.slice(-7);
        const passwordHash = await hashPassword(initialPassword);
        
        // Simple deterministic email format that fulfills DB uniqueness.
        const email = `${regNo.toLowerCase()}@student.example.com`;

        await prisma.user.create({
          data: {
            name: `Student ${regNo}`, // Placeholder name
            email,
            registerNumber: regNo,
            passwordHash,
            role: 'STUDENT',
            mustChangePassword: true
          }
        });
        createdCount++;
      } catch (err: any) {
        // If it's a unique constraint violation (P2002), we treat it as safely skipped.
        if (err.code === 'P2002') {
          skippedCount++;
        } else {
          // Re-throw unexpected DB errors
          throw err;
        }
      }
    }

    res.status(201).json({
      success: true,
      summary: {
        requested: generatedRegNumbers.length,
        created: createdCount,
        skipped: skippedCount
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

const singleStudentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  registerNumber: z.string().min(1, 'Register number is required')
});

export const addSingleStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = singleStudentSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        registerNumber: data.registerNumber
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Register number already exists' });
      return;
    }

    const initialPassword = data.registerNumber.slice(-7);
    const passwordHash = await hashPassword(initialPassword);
    const email = `${data.registerNumber.toLowerCase()}@student.example.com`;

    const newStudent = await prisma.user.create({
      data: {
        name: data.name,
        email,
        registerNumber: data.registerNumber,
        passwordHash,
        role: 'STUDENT',
        mustChangePassword: true
      }
    });

    res.status(201).json({ success: true, student: { id: newStudent.id, name: newStudent.name, registerNumber: newStudent.registerNumber } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const getSubmissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid submission ID' });
      return;
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        lab: { select: { id: true, title: true } },
        student: { select: { id: true, name: true, registerNumber: true } },
        testResults: {
          include: {
            testCase: { select: { id: true, input: true, expectedOutput: true, visibility: true } }
          }
        },
        aiFeedback: true
      }
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

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
      submission: {
        ...submission,
        aiFeedback: formattedFeedback
      }
    });
  } catch (err) {
    next(err);
  }
};
