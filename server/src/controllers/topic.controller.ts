import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const topicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters')
});

export const getTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { labs: true }
        }
      }
    });

    res.status(200).json({ success: true, topics });
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = topicSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { name, description } = parseResult.data;

    const topic = await prisma.topic.create({
      data: {
        name,
        description,
        createdById: req.user!.id
      }
    });

    res.status(201).json({ success: true, topic });
  } catch (error) {
    next(error);
  }
};

export const getTopicLabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topicId = req.params.id as string;
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        labs: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { assignments: true, submissions: true } }
          }
        }
      }
    });

    if (!topic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    res.status(200).json({ success: true, topic });
  } catch (error) {
    next(error);
  }
};

// Seed/assign a default topic to labs that don't have one
export const seedDefaultTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const facultyId = req.user!.id;
    
    // Check if "General" topic exists for this faculty
    let generalTopic = await prisma.topic.findFirst({
      where: { name: 'General' }
    });

    if (!generalTopic) {
      generalTopic = await prisma.topic.create({
        data: {
          name: 'General',
          description: 'General programming problems',
          createdById: facultyId
        }
      });
    }

    const updateResult = await prisma.lab.updateMany({
      where: { topicId: null },
      data: { topicId: generalTopic.id }
    });

    res.status(200).json({ success: true, updatedCount: updateResult.count });
  } catch (error) {
    next(error);
  }
};
