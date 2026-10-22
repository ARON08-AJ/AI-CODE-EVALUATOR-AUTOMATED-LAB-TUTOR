import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStudentLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    // 1. Pagination parameters validation and normalization
    let page = parseInt(req.query.page as string, 10);
    let limit = parseInt(req.query.limit as string, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || limit < 1) {
      limit = 20;
    }
    if (limit > 100) {
      limit = 100;
    }

    // 2. Fetch all active student users with their published lab assignments and submissions
    const activeStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        registerNumber: true,
        department: true,
        year: true,
        section: true,
        assignments: {
          where: {
            lab: {
              published: true
            }
          },
          select: {
            labId: true
          }
        },
        submissions: {
          select: {
            labId: true,
            status: true
          }
        }
      }
    });

    // 3. Compute metrics for each student
    const studentMetrics = activeStudents.map(student => {
      // Published assigned lab IDs
      const assignedLabIds = new Set(student.assignments.map(a => a.labId));
      const assignedProblems = assignedLabIds.size;

      // Submissions on assigned published labs
      const relevantSubmissions = student.submissions.filter(sub => assignedLabIds.has(sub.labId));
      const totalSubmissions = relevantSubmissions.length;

      const acceptedSubmissionsList = relevantSubmissions.filter(
        sub => sub.status === 'ACCEPTED' || sub.status === 'PASSED'
      );
      const acceptedSubmissions = acceptedSubmissionsList.length;

      const solvedLabIds = new Set(acceptedSubmissionsList.map(sub => sub.labId));
      const solvedProblems = solvedLabIds.size;

      const score = solvedProblems * 10;

      const completionRate = assignedProblems > 0
        ? Math.round((solvedProblems / assignedProblems) * 100)
        : 0;

      const acceptanceRate = totalSubmissions > 0
        ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
        : 0;

      return {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
        year: student.year,
        section: student.section,
        score,
        solvedProblems,
        assignedProblems,
        completionRate,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        rank: 0 // Will be calculated after sorting
      };
    });

    // 4. Deterministic Ranking Sort
    // Primary: score DESC
    // Secondary: solvedProblems DESC
    // Tertiary: acceptanceRate DESC
    // Quaternary: registerNumber ASC (stable tie-breaker)
    studentMetrics.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.solvedProblems !== a.solvedProblems) {
        return b.solvedProblems - a.solvedProblems;
      }
      if (b.acceptanceRate !== a.acceptanceRate) {
        return b.acceptanceRate - a.acceptanceRate;
      }
      const regA = a.registerNumber || a.id;
      const regB = b.registerNumber || b.id;
      return regA.localeCompare(regB);
    });

    // 5. Assign 1-based global ranks
    studentMetrics.forEach((student, index) => {
      student.rank = index + 1;
    });

    // 6. Find logged-in student's global position and stats
    const currentStudentMetric = studentMetrics.find(s => s.id === currentUserId);

    let currentStudent = null;
    if (currentStudentMetric) {
      currentStudent = {
        rank: currentStudentMetric.rank,
        score: currentStudentMetric.score,
        solvedProblems: currentStudentMetric.solvedProblems,
        assignedProblems: currentStudentMetric.assignedProblems,
        completionRate: currentStudentMetric.completionRate,
        totalSubmissions: currentStudentMetric.totalSubmissions,
        acceptedSubmissions: currentStudentMetric.acceptedSubmissions,
        acceptanceRate: currentStudentMetric.acceptanceRate,
        student: {
          id: currentStudentMetric.id,
          name: currentStudentMetric.name,
          registerNumber: currentStudentMetric.registerNumber,
          department: currentStudentMetric.department,
          year: currentStudentMetric.year,
          section: currentStudentMetric.section
        }
      };
    }

    // 7. Paginate results
    const total = studentMetrics.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = studentMetrics.slice(startIndex, startIndex + limit);

    const leaderboard = paginatedItems.map(s => ({
      rank: s.rank,
      student: {
        id: s.id,
        name: s.name,
        registerNumber: s.registerNumber,
        department: s.department,
        year: s.year,
        section: s.section
      },
      score: s.score,
      solvedProblems: s.solvedProblems,
      assignedProblems: s.assignedProblems,
      completionRate: s.completionRate,
      totalSubmissions: s.totalSubmissions,
      acceptedSubmissions: s.acceptedSubmissions,
      acceptanceRate: s.acceptanceRate
    }));

    res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      currentStudent
    });
  } catch (err) {
    next(err);
  }
};
