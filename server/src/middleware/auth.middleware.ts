import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { isActive: true }
  });

  if (!user || !user.isActive) {
    res.status(403).json({ error: 'Your account has been blocked. Please contact the administrator.' });
    return;
  }

  // Attach user identity from the validated JWT
  req.user = payload;
  next();
}
