import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Content must not exceed 5000 characters'),
  published: z.boolean().optional().default(false),
  roleVisibility: z.enum(['STUDENT', 'FACULTY', 'ALL']).optional().default('STUDENT')
});

const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters').optional(),
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Content must not exceed 5000 characters').optional(),
  published: z.boolean().optional(),
  roleVisibility: z.enum(['STUDENT', 'FACULTY', 'ALL']).optional()
});

export const getFacultyAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const facultyId = req.user!.id;

    const announcements = await prisma.announcement.findMany({
      where: {
        createdById: facultyId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            registerNumber: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      announcements
    });
  } catch (err) {
    next(err);
  }
};

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createAnnouncementSchema.parse(req.body);
    const facultyId = req.user!.id;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        published: validated.published,
        roleVisibility: validated.roleVisibility,
        createdById: facultyId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      announcement: newAnnouncement
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
      return;
    }
    next(err);
  }
};

export const getFacultyAnnouncementById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const facultyId = req.user!.id;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    if (announcement.createdById !== facultyId) {
      res.status(403).json({ error: 'Unauthorized to view this announcement' });
      return;
    }

    res.status(200).json({
      success: true,
      announcement
    });
  } catch (err) {
    next(err);
  }
};

export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const facultyId = req.user!.id;
    const validated = updateAnnouncementSchema.parse(req.body);

    const existing = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    if (existing.createdById !== facultyId) {
      res.status(403).json({ error: 'Unauthorized to edit this announcement' });
      return;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.published !== undefined && { published: validated.published }),
        ...(validated.roleVisibility !== undefined && { roleVisibility: validated.roleVisibility })
      },
      include: {
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
      announcement: updated
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
      return;
    }
    next(err);
  }
};

export const publishAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const facultyId = req.user!.id;

    const existing = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    if (existing.createdById !== facultyId) {
      res.status(403).json({ error: 'Unauthorized to publish this announcement' });
      return;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { published: true },
      include: {
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
      announcement: updated
    });
  } catch (err) {
    next(err);
  }
};

export const unpublishAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const facultyId = req.user!.id;

    const existing = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    if (existing.createdById !== facultyId) {
      res.status(403).json({ error: 'Unauthorized to unpublish this announcement' });
      return;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { published: false },
      include: {
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
      announcement: updated
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const facultyId = req.user!.id;

    const existing = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    if (existing.createdById !== facultyId) {
      res.status(403).json({ error: 'Unauthorized to delete this announcement' });
      return;
    }

    await prisma.announcement.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
