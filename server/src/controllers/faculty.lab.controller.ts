import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export const bulkImportLabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON array
    const rows = xlsx.utils.sheet_to_json<any>(sheet);
    if (rows.length === 0) {
      res.status(400).json({ error: 'Excel file is empty' });
      return;
    }

    const createdById = req.user!.id;
    let createdLabs = 0;
    let skippedLabs = 0;
    let createdTopics = 0;

    for (const row of rows) {
      const topicName = row['Topic']?.toString().trim();
      const title = row['Title']?.toString().trim();
      const description = row['Description']?.toString().trim() || 'Imported Description';
      const constraints = row['Constraints']?.toString().trim() || 'None';
      const sampleInput = row['Sample Input']?.toString().trim() || '';
      const sampleOutput = row['Sample Output']?.toString().trim() || '';
      const problemKey = row['Problem Key']?.toString().trim() || null;
      const difficulty = row['Difficulty']?.toString().trim().toUpperCase() || 'EASY';
      const supportedLanguages = row['Supported Languages']?.toString().trim() || 'C,C++,Java,Python';

      if (!topicName || !title) {
        skippedLabs++;
        continue;
      }

      // Ensure topic exists
      let topic = await prisma.topic.findFirst({
        where: { name: topicName, createdById }
      });

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            name: topicName,
            description: `Questions related to ${topicName}`,
            createdById
          }
        });
        createdTopics++;
      }

      // Check if lab with same title in this topic already exists
      const existingLab = await prisma.lab.findFirst({
        where: {
          title,
          topicId: topic.id,
          createdById
        }
      });

      if (existingLab) {
        if (problemKey && !existingLab.problemKey) {
          // Backfill problemKey if missing
          await prisma.lab.update({
            where: { id: existingLab.id },
            data: { problemKey }
          });
        }
        skippedLabs++;
        continue; // Skip duplicates
      }

      const validatedDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'EASY';

      await prisma.lab.create({
        data: {
          title,
          description,
          constraints,
          sampleInput,
          sampleOutput,
          problemKey,
          difficulty: validatedDifficulty,
          supportedLanguages,
          published: false,
          topicId: topic.id,
          createdById
        }
      });

      createdLabs++;
    }

    res.status(200).json({ 
      message: 'Import completed successfully',
      summary: {
        totalRows: rows.length,
        createdTopics,
        createdLabs,
        skippedLabs
      }
    });

  } catch (err) {
    console.error('Error in bulk import:', err);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
};

export const bulkImportTestCases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows = xlsx.utils.sheet_to_json<any>(sheet);
    if (rows.length === 0) {
      res.status(400).json({ error: 'Excel file is empty' });
      return;
    }

    const createdById = req.user!.id;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    const errorsDetails: string[] = [];
    const skippedDetails: string[] = [];

    const problemKeyToLabId = new Map<string, string | null>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Assuming row 1 is header
      
      const problemKey = row['Problem Key']?.toString().trim();
      const input = row['Input']?.toString() || '';
      const expectedOutput = row['Expected Output']?.toString() || '';
      const visibilityRaw = row['Visibility']?.toString().trim().toUpperCase() || 'PUBLIC';
      
      const visibility = ['PUBLIC', 'HIDDEN'].includes(visibilityRaw) ? visibilityRaw : 'PUBLIC';

      if (!problemKey) {
        errors++;
        errorsDetails.push(`Row ${rowNumber}: Missing Problem Key`);
        continue;
      }

      let labId = problemKeyToLabId.get(problemKey);
      
      if (labId === undefined) {
        const lab = await prisma.lab.findUnique({
          where: { problemKey },
        });

        if (!lab || lab.createdById !== createdById) {
          problemKeyToLabId.set(problemKey, null);
          labId = null;
        } else {
          problemKeyToLabId.set(problemKey, lab.id);
          labId = lab.id;
        }
      }

      if (!labId) {
        errors++;
        errorsDetails.push(`Row ${rowNumber}: Problem Key '${problemKey}' not found or unauthorized`);
        continue;
      }

      const existingTestCase = await prisma.testCase.findFirst({
        where: {
          labId,
          input,
          expectedOutput
        }
      });

      if (existingTestCase) {
        skipped++;
        skippedDetails.push(`Row ${rowNumber}: Problem '${problemKey}' - test case already exists`);
        continue;
      }

      await prisma.testCase.create({
        data: {
          labId,
          input,
          expectedOutput,
          visibility: visibility as any
        }
      });

      imported++;
    }

    res.status(200).json({ 
      message: 'Test Cases import completed',
      summary: {
        totalRows: rows.length,
        imported,
        skipped,
        errors,
        errorsDetails,
        skippedDetails
      }
    });

  } catch (err) {
    console.error('Error in bulk import test cases:', err);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
};

const labSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  constraints: z.string(),
  sampleInput: z.string(),
  sampleOutput: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  supportedLanguages: z.string().min(1, 'Supported languages are required'),
  published: z.boolean().default(false).optional(),
  topicId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional()
});

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  visibility: z.enum(['PUBLIC', 'HIDDEN'])
});

export const createLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = labSchema.parse(req.body);

    const lab = await prisma.lab.create({
      data: {
        title: data.title,
        description: data.description,
        constraints: data.constraints,
        sampleInput: data.sampleInput,
        sampleOutput: data.sampleOutput,
        difficulty: data.difficulty,
        supportedLanguages: data.supportedLanguages,
        published: data.published ?? false,
        topicId: data.topicId || null,
        createdById: req.user!.id,
        tags: data.tagIds && data.tagIds.length > 0 ? { connect: data.tagIds.map(id => ({ id })) } : undefined
      },
      include: { tags: true }
    });

    res.status(201).json({ lab });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const getLabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, difficulty, published, tagId } = req.query;
    
    const whereClause: any = { createdById: req.user!.id };

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    if (difficulty && typeof difficulty === 'string') {
      whereClause.difficulty = difficulty;
    }

    if (published && typeof published === 'string') {
      whereClause.published = published === 'true';
    }

    if (tagId && typeof tagId === 'string') {
      whereClause.tags = { some: { id: tagId } };
    }

    const labs = await prisma.lab.findMany({
      where: whereClause,
      include: { tags: true, topic: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ labs });
  } catch (err) {
    next(err);
  }
};

export const getLabById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: { testCases: true, tags: true }
    });

    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to view this lab' });
      return;
    }

    res.status(200).json({ lab });
  } catch (err) {
    next(err);
  }
};

export const updateLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = labSchema.parse(req.body);

    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to modify this lab' });
      return;
    }

    const updatedLab = await prisma.lab.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        constraints: data.constraints,
        sampleInput: data.sampleInput,
        sampleOutput: data.sampleOutput,
        difficulty: data.difficulty,
        supportedLanguages: data.supportedLanguages,
        topicId: data.topicId || null,
        tags: data.tagIds ? { set: data.tagIds.map(id => ({ id })) } : undefined
      },
      include: { tags: true }
    });

    res.status(200).json({ lab: updatedLab });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const deleteLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to delete this lab' });
      return;
    }

    await prisma.lab.delete({ where: { id } });

    res.status(200).json({ message: 'Lab deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const publishLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to publish this lab' });
      return;
    }

    // Safety check for publishing
    if (!lab.title || !lab.description || !lab.difficulty || !lab.supportedLanguages) {
      res.status(400).json({ error: 'Lab is missing required fields and cannot be published' });
      return;
    }

    const updatedLab = await prisma.lab.update({
      where: { id },
      data: { published: true }
    });

    res.status(200).json({ lab: updatedLab });
  } catch (err) {
    next(err);
  }
};

export const unpublishLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to unpublish this lab' });
      return;
    }

    const updatedLab = await prisma.lab.update({
      where: { id },
      data: { published: false }
    });

    res.status(200).json({ lab: updatedLab });
  } catch (err) {
    next(err);
  }
};

export const createTestCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = testCaseSchema.parse(req.body);

    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      res.status(404).json({ error: 'Lab not found' });
      return;
    }

    if (lab.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to modify test cases for this lab' });
      return;
    }

    const testCase = await prisma.testCase.create({
      data: {
        labId: id,
        input: data.input,
        expectedOutput: data.expectedOutput,
        visibility: data.visibility
      }
    });

    res.status(201).json({ testCase });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const deleteTestCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const testCase = await prisma.testCase.findUnique({ 
      where: { id },
      include: { lab: true }
    });

    if (!testCase) {
      res.status(404).json({ error: 'Test case not found' });
      return;
    }

    if (testCase.lab.createdById !== req.user!.id && testCase.lab.createdById !== null && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: You are not authorized to delete this test case' });
      return;
    }

    await prisma.testCase.delete({ where: { id } });

    res.status(200).json({ message: 'Test case deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const exportLabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isFaculty = req.user?.role === 'FACULTY';
    const whereClause: any = isFaculty ? { createdById: req.user!.id } : {};

    const labs = await prisma.lab.findMany({
      where: whereClause,
      include: {
        topic: { select: { name: true } },
        tags: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const exportData = labs.map(lab => ({
      'Problem Key': lab.problemKey || '',
      'Title': lab.title,
      'Description': lab.description,
      'Topic': lab.topic?.name || '',
      'Difficulty': lab.difficulty,
      'Constraints': lab.constraints || '',
      'Sample Input': lab.sampleInput || '',
      'Sample Output': lab.sampleOutput || '',
      'Supported Languages': lab.supportedLanguages,
      'Published': lab.published ? 'Yes' : 'No',
      'Tags': lab.tags.map(t => t.name).join(', ')
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Problems');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="autolab_problems_export.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting labs:', err);
    next(err);
  }
};

export const exportTestCases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isFaculty = req.user?.role === 'FACULTY';
    const labId = req.query.labId as string | undefined;

    const whereClause: any = {};
    if (isFaculty) {
      whereClause.lab = { createdById: req.user!.id };
    }
    if (labId) {
      whereClause.labId = labId;
    }

    const testCases = await prisma.testCase.findMany({
      where: whereClause,
      include: {
        lab: { select: { problemKey: true, title: true } }
      },
      orderBy: [{ labId: 'asc' }, { createdAt: 'asc' }]
    });

    const exportData = testCases.map(tc => ({
      'Problem Key': tc.lab.problemKey || tc.lab.title,
      'Test Case ID': tc.id,
      'Input': tc.input,
      'Expected Output': tc.expectedOutput,
      'Visibility': tc.visibility,
      'Created At': tc.createdAt.toISOString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="autolab_testcases_export.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting test cases:', err);
    next(err);
  }
};


