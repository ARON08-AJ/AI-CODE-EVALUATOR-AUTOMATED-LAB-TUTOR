import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFacultyDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const facultyId = req.user!.id;

    // 1. Fetch faculty details
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
      select: {
        name: true,
        department: true
      }
    });

    if (!faculty) {
      res.status(404).json({ error: 'Faculty not found' });
      return;
    }

    // 2. Aggregate counts
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalLabs = await prisma.lab.count({ where: { createdById: facultyId } });
    const publishedLabs = await prisma.lab.count({ where: { createdById: facultyId, published: true } });
    const totalAssignments = await prisma.labAssignment.count({ where: { lab: { createdById: facultyId } } });
    const totalSubmissions = await prisma.submission.count({ where: { lab: { createdById: facultyId } } });
    const acceptedSubmissions = await prisma.submission.count({ where: { lab: { createdById: facultyId }, status: { in: ['ACCEPTED', 'PASSED'] } } });

    // 3. Lab Overview (stats per lab)
    const labs = await prisma.lab.findMany({
      where: { createdById: facultyId },
      select: {
        id: true,
        title: true,
        difficulty: true,
        published: true,
        _count: {
          select: {
            assignments: true,
            submissions: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Recent student submissions for this faculty's labs
    const recentSubmissions = await prisma.submission.findMany({
      where: { lab: { createdById: facultyId } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        labId: true,
        language: true,
        status: true,
        passedTests: true,
        totalTests: true,
        executionTime: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            registerNumber: true
          }
        },
        lab: {
          select: { title: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      dashboard: {
        faculty,
        stats: {
          students: totalStudents,
          labs: totalLabs,
          publishedLabs,
          assignments: totalAssignments,
          submissions: totalSubmissions,
          acceptedSubmissions
        },
        labs,
        recentSubmissions
      }
    });
  } catch (err) {
    next(err);
  }
};
