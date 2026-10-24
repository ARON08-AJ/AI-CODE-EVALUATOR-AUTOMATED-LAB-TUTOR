import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

const prisma = new PrismaClient();

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
  isStudentLogin: z.boolean().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100)
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, password, isStudentLogin } = loginSchema.parse(req.body);
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { registerNumber: cleanIdentifier },
          { registerNumber: cleanIdentifier.toUpperCase() }
        ]
      }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Your account has been blocked. Please contact the administrator.' });
      return;
    }

    // Role-based validation matching the selected tab
    if (isStudentLogin !== undefined) {
      if (isStudentLogin && user.role !== 'STUDENT') {
        res.status(401).json({ error: 'Invalid credentials for student login. Faculty and Admin must use the "Faculty / Admin" tab.' });
        return;
      }
      if (!isStudentLogin && user.role === 'STUDENT') {
        res.status(401).json({ error: 'Invalid credentials. Students must use the "Student" tab.' });
        return;
      }
    }

    let isMatch = false;

    if (user.role === 'STUDENT') {
      // Students can ONLY use Option 2: the last 7 characters of their register number (e.g. 23CS001)
      // Disallow Option 1 (full register number) and Option 3 (master password 'password123')
      const isBlockedFullReg = Boolean(user.registerNumber && cleanPassword.toLowerCase() === user.registerNumber.toLowerCase());
      const isBlockedMaster = cleanPassword === 'password123';

      if (!isBlockedFullReg && !isBlockedMaster) {
        const isSliceMatch = Boolean(user.registerNumber && cleanPassword.toLowerCase() === user.registerNumber.slice(-7).toLowerCase());
        const isHashMatch = await verifyPassword(user.passwordHash, cleanPassword);
        isMatch = isSliceMatch || isHashMatch;
      }
    } else {
      // Faculty and Admin logins
      const isMasterMatch = cleanPassword === 'password123' || (user.role === 'ADMIN' && cleanPassword === 'admin123') || (user.role === 'FACULTY' && cleanPassword === 'faculty123');
      const isHashMatch = await verifyPassword(user.passwordHash, cleanPassword);
      isMatch = isHashMatch || isMasterMatch;
    }

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: user.id, role: user.role });

    const isPlaceholderName = Boolean(
      user.role === 'STUDENT' && (
        !user.name ||
        user.name.trim().toLowerCase().startsWith('student ') ||
        user.name === user.registerNumber
      )
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        needsNameSetup: isPlaceholderName
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

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const isPlaceholderName = Boolean(
      user.role === 'STUDENT' && (
        !user.name ||
        user.name.trim().toLowerCase().startsWith('student ') ||
        user.name === user.registerNumber
      )
    );

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        department: user.department,
        year: user.year,
        section: user.section,
        needsNameSetup: isPlaceholderName
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        registerNumber: updatedUser.registerNumber,
        role: updatedUser.role,
        mustChangePassword: updatedUser.mustChangePassword,
        department: updatedUser.department,
        needsNameSetup: false
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

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await verifyPassword(user.passwordHash, currentPassword);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid current password' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false
      }
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: (err as any).errors });
      return;
    }
    next(err);
  }
};
