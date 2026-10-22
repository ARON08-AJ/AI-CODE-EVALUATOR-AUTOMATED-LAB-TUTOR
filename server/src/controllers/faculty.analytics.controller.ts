import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFacultyAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const facultyId = req.user!.id;
    const isFaculty = req.user?.role === 'FACULTY';
    const labWhere = isFaculty ? { createdById: facultyId } : {};

    // 1. Fetch all assignments for faculty's labs
    const assignments = await prisma.labAssignment.findMany({
      where: { lab: labWhere },
      select: {
        id: true,
        studentId: true,
        labId: true,
        assignedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            registerNumber: true,
            department: true,
            year: true,
            section: true
          }
        },
        lab: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topicId: true,
            topic: { select: { id: true, name: true } }
          }
        }
      }
    });

    // 2. Fetch all submissions for faculty's labs
    const submissions = await prisma.submission.findMany({
      where: { lab: labWhere },
      select: {
        id: true,
        studentId: true,
        labId: true,
        status: true,
        createdAt: true
      }
    });

    // Map accepted status: ACCEPTED or PASSED
    const isAccepted = (status: string) => status === 'ACCEPTED' || status === 'PASSED';

    // Track unique solved (studentId, labId) pairs
    const solvedSet = new Set<string>(); // "studentId:labId"
    const studentSubmissionsMap = new Map<string, typeof submissions>(); // studentId -> submissions
    const labSubmissionsMap = new Map<string, typeof submissions>(); // labId -> submissions

    submissions.forEach(sub => {
      if (isAccepted(sub.status)) {
        solvedSet.add(`${sub.studentId}:${sub.labId}`);
      }
      
      const stSubs = studentSubmissionsMap.get(sub.studentId) || [];
      stSubs.push(sub);
      studentSubmissionsMap.set(sub.studentId, stSubs);

      const lSubs = labSubmissionsMap.get(sub.labId) || [];
      lSubs.push(sub);
      labSubmissionsMap.set(sub.labId, lSubs);
    });

    const totalAssigned = assignments.length;
    let totalSolved = 0;
    assignments.forEach(a => {
      if (solvedSet.has(`${a.studentId}:${a.labId}`)) {
        totalSolved++;
      }
    });

    const totalSubmissions = submissions.length;
    const acceptedSubmissionsCount = submissions.filter(s => isAccepted(s.status)).length;
    const overallCompletionRate = totalAssigned > 0 ? Math.round((totalSolved / totalAssigned) * 100) : 0;
    const overallAcceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissionsCount / totalSubmissions) * 100) : 0;

    // Average attempts per solved problem
    const solvedAttempts: number[] = [];
    const studentLabSubmissions = new Map<string, number>(); // "studentId:labId" -> count
    submissions.forEach(s => {
      const key = `${s.studentId}:${s.labId}`;
      studentLabSubmissions.set(key, (studentLabSubmissions.get(key) || 0) + 1);
    });

    solvedSet.forEach(key => {
      const count = studentLabSubmissions.get(key);
      if (count) solvedAttempts.push(count);
    });

    const avgAttemptsPerSolved = solvedAttempts.length > 0 
      ? Number((solvedAttempts.reduce((a, b) => a + b, 0) / solvedAttempts.length).toFixed(1)) 
      : 0;

    // 3. Student Level Aggregation
    const studentMap = new Map<string, {
      student: any;
      assignedLabs: Set<string>;
      solvedLabs: Set<string>;
      submissionCount: number;
      acceptedCount: number;
      lastSubmissionDate: Date | null;
    }>();

    assignments.forEach(a => {
      let data = studentMap.get(a.studentId);
      if (!data) {
        data = {
          student: a.student,
          assignedLabs: new Set(),
          solvedLabs: new Set(),
          submissionCount: 0,
          acceptedCount: 0,
          lastSubmissionDate: null
        };
        studentMap.set(a.studentId, data);
      }
      data.assignedLabs.add(a.labId);
      if (solvedSet.has(`${a.studentId}:${a.labId}`)) {
        data.solvedLabs.add(a.labId);
      }
    });

    // Populate submission stats per student
    studentMap.forEach((data, stId) => {
      const stSubs = studentSubmissionsMap.get(stId) || [];
      data.submissionCount = stSubs.length;
      data.acceptedCount = stSubs.filter(s => isAccepted(s.status)).length;
      if (stSubs.length > 0) {
        const sorted = [...stSubs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        data.lastSubmissionDate = sorted[0].createdAt;
      }
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let noSubmissionsCount = 0;
    let needsAttentionCount = 0;

    const studentAnalytics = Array.from(studentMap.values()).map(data => {
      const assigned = data.assignedLabs.size;
      const solved = data.solvedLabs.size;
      const completion = assigned > 0 ? Math.round((solved / assigned) * 100) : 0;
      const acceptance = data.submissionCount > 0 ? Math.round((data.acceptedCount / data.submissionCount) * 100) : 0;

      if (data.submissionCount === 0) noSubmissionsCount++;

      let statusTag = 'On Track';
      if (data.submissionCount === 0 || (data.lastSubmissionDate && data.lastSubmissionDate < sevenDaysAgo)) {
        statusTag = 'No Recent Submission';
        needsAttentionCount++;
      } else if (completion < 50) {
        statusTag = 'Low Completion';
        needsAttentionCount++;
      }

      return {
        studentId: data.student.id,
        name: data.student.name,
        registerNumber: data.student.registerNumber,
        department: data.student.department,
        year: data.student.year,
        section: data.student.section,
        assigned,
        solved,
        completionRate: completion,
        submissionCount: data.submissionCount,
        acceptedCount: data.acceptedCount,
        acceptanceRate: acceptance,
        statusTag,
        lastSubmissionDate: data.lastSubmissionDate
      };
    });

    // 4. Topic Level Aggregation
    const topicMap = new Map<string, {
      topicId: string;
      name: string;
      assignedCount: number;
      solvedCount: number;
      submissionCount: number;
      acceptedCount: number;
    }>();

    assignments.forEach(a => {
      const topicId = a.lab.topicId || 'unassigned';
      const topicName = a.lab.topic?.name || 'General';
      
      let data = topicMap.get(topicId);
      if (!data) {
        data = { topicId, name: topicName, assignedCount: 0, solvedCount: 0, submissionCount: 0, acceptedCount: 0 };
        topicMap.set(topicId, data);
      }
      data.assignedCount++;
      if (solvedSet.has(`${a.studentId}:${a.labId}`)) {
        data.solvedCount++;
      }
    });

    submissions.forEach(s => {
      const matchingAssign = assignments.find(a => a.labId === s.labId);
      if (matchingAssign) {
        const topicId = matchingAssign.lab.topicId || 'unassigned';
        const data = topicMap.get(topicId);
        if (data) {
          data.submissionCount++;
          if (isAccepted(s.status)) data.acceptedCount++;
        }
      }
    });

    const topicAnalytics = Array.from(topicMap.values()).map(t => ({
      topicId: t.topicId,
      name: t.name,
      assigned: t.assignedCount,
      solved: t.solvedCount,
      completionRate: t.assignedCount > 0 ? Math.round((t.solvedCount / t.assignedCount) * 100) : 0,
      submissions: t.submissionCount,
      acceptanceRate: t.submissionCount > 0 ? Math.round((t.acceptedCount / t.submissionCount) * 100) : 0
    }));

    // 5. Difficulty Level Aggregation
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];
    const difficultyAnalytics = difficulties.map(diff => {
      const diffAssignments = assignments.filter(a => a.lab.difficulty === diff);
      const diffAssigned = diffAssignments.length;
      let diffSolved = 0;
      diffAssignments.forEach(a => {
        if (solvedSet.has(`${a.studentId}:${a.labId}`)) diffSolved++;
      });

      const diffSubmissions = submissions.filter(s => {
        const matchingLab = assignments.find(a => a.labId === s.labId);
        return matchingLab?.lab.difficulty === diff;
      });
      const diffSubCount = diffSubmissions.length;
      const diffAcceptedCount = diffSubmissions.filter(s => isAccepted(s.status)).length;

      return {
        difficulty: diff,
        assigned: diffAssigned,
        solved: diffSolved,
        completionRate: diffAssigned > 0 ? Math.round((diffSolved / diffAssigned) * 100) : 0,
        submissions: diffSubCount,
        acceptanceRate: diffSubCount > 0 ? Math.round((diffAcceptedCount / diffSubCount) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalAssigned,
        totalSolved,
        overallCompletionRate,
        totalSubmissions,
        acceptedSubmissionsCount,
        overallAcceptanceRate,
        avgAttemptsPerSolved,
        noSubmissionsCount,
        needsAttentionCount
      },
      students: studentAnalytics,
      topics: topicAnalytics,
      difficulties: difficultyAnalytics
    });

  } catch (err) {
    next(err);
  }
};
