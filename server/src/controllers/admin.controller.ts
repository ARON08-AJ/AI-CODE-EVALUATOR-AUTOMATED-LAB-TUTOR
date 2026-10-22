import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { z } from 'zod';

const prisma = new PrismaClient();

const facultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  registerNumber: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalFaculty,
      totalStudents,
      totalAdmins,
      totalLabs,
      totalSubmissions,
      totalAiFeedbacks
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'FACULTY' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.lab.count(),
      prisma.submission.count(),
      prisma.aIFeedback.count()
    ]);

    const facultyList = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        registerNumber: true,
        createdAt: true,
        isActive: true,
        mustChangePassword: true,
        _count: {
          select: {
            createdLabs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalFaculty,
        totalStudents,
        totalAdmins,
        totalLabs,
        totalSubmissions,
        totalAiFeedbacks
      },
      faculty: facultyList
    });
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        registerNumber: true,
        department: true,
        createdAt: true,
        isActive: true
      },
      orderBy: { registerNumber: 'asc' }
    });

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    next(error);
  }
};

export const addFaculty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = facultySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { name, email, registerNumber, department, password } = parseResult.data;

    // Check existing
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    if (registerNumber) {
      const existingReg = await prisma.user.findUnique({ where: { registerNumber } });
      if (existingReg) {
        res.status(409).json({ error: 'Faculty ID already in use' });
        return;
      }
    }

    const passwordHash = await argon2.hash(password);

    const newFaculty = await prisma.user.create({
      data: {
        name,
        email,
        registerNumber,
        department,
        passwordHash,
        role: 'FACULTY',
        mustChangePassword: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true
      }
    });

    res.status(201).json({ success: true, faculty: newFaculty });
  } catch (error) {
    next(error);
  }
};

const updateFacultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  registerNumber: z.string().optional(),
  department: z.string().optional(),
});

export const updateFaculty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid faculty ID' });
      return;
    }

    const parseResult = updateFacultySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { name, email, registerNumber, department } = parseResult.data;

    if (email) {
      const existingEmail = await prisma.user.findFirst({ where: { email, id: { not: id } } });
      if (existingEmail) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    if (registerNumber) {
      const existingReg = await prisma.user.findFirst({ where: { registerNumber, id: { not: id } } });
      if (existingReg) {
        res.status(409).json({ error: 'Faculty ID already in use' });
        return;
      }
    }

    const updatedFaculty = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(registerNumber && { registerNumber }),
        ...(department !== undefined && { department })
      },
      select: { id: true, name: true, email: true, department: true, registerNumber: true, isActive: true }
    });

    res.status(200).json({ success: true, faculty: updatedFaculty });
  } catch (error) {
    next(error);
  }
};

export const updateFacultyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid faculty ID' });
      return;
    }

    if (req.user?.id === id) {
      res.status(403).json({ error: 'You cannot block your own account' });
      return;
    }

    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive must be a boolean' });
      return;
    }

    const updatedFaculty = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, department: true, registerNumber: true, isActive: true }
    });

    res.status(200).json({ success: true, faculty: updatedFaculty });
  } catch (error) {
    next(error);
  }
};

export const updateStudentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    if (req.user?.id === id) {
      res.status(403).json({ error: 'You cannot block your own account' });
      return;
    }

    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive must be a boolean' });
      return;
    }

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, registerNumber: true, department: true, year: true, section: true, isActive: true }
    });

    res.status(200).json({ success: true, student: updatedStudent });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const { newPassword } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordToSet = newPassword && typeof newPassword === 'string' && newPassword.length >= 6
      ? newPassword
      : 'password123';
    const passwordHash = await argon2.hash(passwordToSet);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Password for ${targetUser.name} (${targetUser.role}) has been reset.`,
      tempPassword: passwordToSet
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [recentSubmissions, recentUsers] = await Promise.all([
      prisma.submission.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          passedTests: true,
          totalTests: true,
          language: true,
          createdAt: true,
          student: {
            select: { name: true, registerNumber: true }
          },
          lab: {
            select: { title: true }
          }
        }
      }),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
          isActive: true
        }
      })
    ]);

    res.status(200).json({
      success: true,
      recentSubmissions,
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};
