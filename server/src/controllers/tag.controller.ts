import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const tagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50, 'Tag name too long')
});

export const getTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { labs: true } }
      }
    });
    res.status(200).json({ tags });
  } catch (err) {
    next(err);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = tagSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
      return;
    }
    const { name } = parseResult.data;

    const existing = await prisma.tag.findFirst({
      where: { name: { equals: name } }
    });
    if (existing) {
      res.status(200).json({ tag: existing });
      return;
    }

    const tag = await prisma.tag.create({
      data: { name }
    });
    res.status(201).json({ tag });
  } catch (err) {
    next(err);
  }
};

export const updateTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parseResult = tagSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
      return;
    }
    const { name } = parseResult.data;

    const tag = await prisma.tag.update({
      where: { id },
      data: { name }
    });
    res.status(200).json({ tag });
  } catch (err) {
    next(err);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.tag.delete({ where: { id } });
    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (err) {
    next(err);
  }
};
