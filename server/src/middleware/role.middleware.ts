import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory to enforce that the authenticated user has one of the allowed roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User identity not found' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}
