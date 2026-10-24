import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getDeadlineStatus } from './student.lab.controller';

const prisma = new PrismaClient();

export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.id;

    // 1. Fetch student details
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        name: true,
        registerNumber: true,
        department: true,
        year: true,
        section: true
      }
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // 2. Fetch basic stats (global submission metrics)
    const totalSubmissions = await prisma.submission.count({
      where: { studentId }
    });

    const acceptedSubmissions = await prisma.submission.count({
      where: { studentId, status: { in: ['ACCEPTED', 'PASSED'] } }
    });

    const acceptanceRate = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

    // 3. Fetch assigned labs with their latest status
    const assignments = await prisma.labAssignment.findMany({
      where: { studentId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            supportedLanguages: true,
            published: true,
            dueDate: true,
            topic: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Filter to only published labs
    const publishedAssignments = assignments.filter(a => a.lab.published);

    const labIds = publishedAssignments.map(a => a.lab.id);
    const labSubmissions = await prisma.submission.findMany({
      where: {
        studentId,
        labId: { in: labIds }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        labId: true,
        status: true,
        createdAt: true
      }
    });

    const labsProgress = publishedAssignments.map(assignment => {
      const submissionsForLab = labSubmissions.filter(sub => sub.labId === assignment.lab.id);
      
      let progress = 'NOT_STARTED';
      if (submissionsForLab.length > 0) {
        const hasAccepted = submissionsForLab.some(sub => sub.status === 'ACCEPTED' || sub.status === 'PASSED');
        progress = hasAccepted ? 'COMPLETED' : 'IN_PROGRESS';
      }

      const effectiveDueDate = assignment.dueDate ?? assignment.lab.dueDate ?? null;
      const deadlineStatus = getDeadlineStatus(effectiveDueDate);

      return {
        ...assignment.lab,
        dueDate: effectiveDueDate,
        deadlineStatus,
        progress,
        lastSubmissionStatus: submissionsForLab.length > 0 ? submissionsForLab[0].status : null,
        lastSubmissionAt: submissionsForLab.length > 0 ? submissionsForLab[0].createdAt : null,
      };
    });

    // Compute lab statistics based solely on the student's published, assigned labs
    const assignedLabsCount = publishedAssignments.length;
    const completedLabs = labsProgress.filter(l => l.progress === 'COMPLETED').length;
    const pendingLabs = assignedLabsCount - completedLabs;
    const completionRate = assignedLabsCount > 0 ? Math.round((completedLabs / assignedLabsCount) * 100) : 0;

    // Topic Progress calculation for assigned published labs
    const topicProgressMap = new Map<string, { topicId: string; name: string; assigned: number; solved: number }>();
    labsProgress.forEach(lab => {
      const topicId = lab.topic?.id || 'unassigned';
      const topicName = lab.topic?.name || 'General';
      let entry = topicProgressMap.get(topicId);
      if (!entry) {
        entry = { topicId, name: topicName, assigned: 0, solved: 0 };
        topicProgressMap.set(topicId, entry);
      }
      entry.assigned++;
      if (lab.progress === 'COMPLETED') {
        entry.solved++;
      }
    });

    const topicProgress = Array.from(topicProgressMap.values()).map(tp => ({
      ...tp,
      completionRate: tp.assigned > 0 ? Math.round((tp.solved / tp.assigned) * 100) : 0
    }));

    // Difficulty Progress calculation for assigned published labs
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];
    const difficultyProgress = difficulties.map(diff => {
      const labsForDiff = labsProgress.filter(l => l.difficulty === diff);
      const assigned = labsForDiff.length;
      const solved = labsForDiff.filter(l => l.progress === 'COMPLETED').length;
      return {
        difficulty: diff,
        assigned,
        solved,
        completionRate: assigned > 0 ? Math.round((solved / assigned) * 100) : 0
      };
    });

    // 4. Fetch 5 recent submissions overall (excluding source code)
    const recentSubmissions = await prisma.submission.findMany({
      where: { studentId },
      take: 5,
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
        lab: {
          select: { title: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      dashboard: {
        student: {
          ...student,
          needsNameSetup: Boolean(
            !student.name ||
            student.name.trim().toLowerCase().startsWith('student ') ||
            student.name === student.registerNumber
          )
        },
        stats: {
          assignedLabs: assignedLabsCount,
          completedLabs,
          pendingLabs,
          completionRate,
          totalSubmissions,
          acceptedSubmissions,
          acceptanceRate
        },
        topicProgress,
        difficultyProgress,
        labs: labsProgress,
        recentSubmissions
      }
    });
  } catch (err) {
    next(err);
  }
};
