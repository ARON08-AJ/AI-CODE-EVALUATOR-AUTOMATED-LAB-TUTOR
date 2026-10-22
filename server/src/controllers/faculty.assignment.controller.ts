import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const MAX_BULK_ASSIGNMENTS = process.env.MAX_BULK_ASSIGNMENTS ? parseInt(process.env.MAX_BULK_ASSIGNMENTS) : 500;

const assignSchema = z.object({
  studentIds: z.array(z.string()).min(1).max(MAX_BULK_ASSIGNMENTS),
  dueDate: z.string().nullable().optional()
});

const deadlineSchema = z.object({
  dueDate: z.string().nullable().optional()
});

export const assignLab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const labId = req.params.id as string;
    const { studentIds, dueDate } = assignSchema.parse(req.body);

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || lab.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to manage this lab' });
      return;
    }

    let parsedDueDate: Date | null = null;
    if (dueDate !== undefined && dueDate !== null && dueDate.trim() !== '') {
      const dateObj = new Date(dueDate);
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({ error: 'Invalid due date format' });
        return;
      }
      parsedDueDate = dateObj;
    }

    // Verify all students exist and are actually students
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      }
    });

    if (students.length !== studentIds.length) {
      res.status(400).json({ error: 'One or more target users are invalid, nonexistent, or not students' });
      return;
    }

    // Fetch existing assignments to calculate created vs skipped correctly
    const existingAssignments = await prisma.labAssignment.findMany({
      where: {
        labId,
        studentId: { in: studentIds }
      }
    });

    const existingStudentIds = new Set(existingAssignments.map(a => a.studentId));
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    // If dueDate was specified, also update lab.dueDate and existing assignments
    if (parsedDueDate !== null) {
      await prisma.lab.update({
        where: { id: labId },
        data: { dueDate: parsedDueDate }
      });
      if (existingAssignments.length > 0) {
        await prisma.labAssignment.updateMany({
          where: {
            labId,
            studentId: { in: Array.from(existingStudentIds) }
          },
          data: { dueDate: parsedDueDate }
        });
      }
    }

    if (newStudentIds.length > 0) {
      const dataToInsert = newStudentIds.map(id => ({
        labId,
        studentId: id,
        dueDate: parsedDueDate ?? lab.dueDate
      }));

      await prisma.labAssignment.createMany({
        data: dataToInsert
      });
    }

    res.status(201).json({
      message: 'Assignments processed',
      summary: {
        requested: studentIds.length,
        created: newStudentIds.length,
        skipped: studentIds.length - newStudentIds.length,
        dueDate: parsedDueDate ?? lab.dueDate
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

export const updateAssignmentDeadline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const labId = req.params.id as string;
    const { dueDate } = deadlineSchema.parse(req.body);

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || lab.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to manage this lab' });
      return;
    }

    let parsedDueDate: Date | null = null;
    if (dueDate !== undefined && dueDate !== null && dueDate.trim() !== '') {
      const dateObj = new Date(dueDate);
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({ error: 'Invalid due date format' });
        return;
      }
      parsedDueDate = dateObj;
    }

    // Update Lab and all existing LabAssignments for this lab
    await prisma.$transaction([
      prisma.lab.update({
        where: { id: labId },
        data: { dueDate: parsedDueDate }
      }),
      prisma.labAssignment.updateMany({
        where: { labId },
        data: { dueDate: parsedDueDate }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Deadline updated successfully',
      dueDate: parsedDueDate
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};

export const getLabAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const labId = req.params.id as string;

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || lab.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to view this lab' });
      return;
    }

    const assignments = await prisma.labAssignment.findMany({
      where: { labId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            registerNumber: true,
            department: true,
            year: true,
            section: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.status(200).json({ assignments, labDueDate: lab.dueDate });
  } catch (err) {
    next(err);
  }
};

export const unassignStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const labId = req.params.labId as string;
    const studentId = req.params.studentId as string;

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || lab.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to manage this lab' });
      return;
    }

    const assignment = await prisma.labAssignment.findUnique({
      where: {
        studentId_labId: {
          studentId,
          labId
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    await prisma.labAssignment.delete({
      where: {
        studentId_labId: {
          studentId,
          labId
        }
      }
    });

    res.status(200).json({ success: true, message: 'Student unassigned successfully' });
  } catch (err) {
    next(err);
  }
};
