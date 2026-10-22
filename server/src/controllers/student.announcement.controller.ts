import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStudentAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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

    const whereCondition = {
      published: true,
      roleVisibility: { in: ['STUDENT', 'ALL'] }
    };

    const total = await prisma.announcement.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const announcements = await prisma.announcement.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};
