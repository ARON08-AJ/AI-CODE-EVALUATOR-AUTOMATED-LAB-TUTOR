import { Request, Response } from 'express';
import { generateHintForSubmission, generateTransientHint } from '../services/submission/ai.hint.service';

export const getAIHint = async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.id;
    const submissionId = req.params.id as string;

    if (!submissionId) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    let hintLevel: number | undefined = undefined;
    if (req.body && req.body.hintLevel !== undefined && req.body.hintLevel !== null) {
      const parsed = Number(req.body.hintLevel);
      if (!isNaN(parsed)) {
        hintLevel = parsed;
      }
    }

    const feedback = await generateHintForSubmission(studentId, submissionId, hintLevel);
    
    return res.status(200).json({ success: true, feedback });
  } catch (error: any) {
    if (error.message === 'SUBMISSION_NOT_FOUND') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (error.message === 'SUBMISSION_ACCEPTED') {
      return res.status(400).json({ error: 'AI hints are intended for submissions that need debugging.' });
    }
    if (error.message === 'INVALID_HINT_LEVEL') {
      return res.status(400).json({ error: 'Invalid hint level. Hint level must be 1, 2, or 3.' });
    }
    if (error.message === 'MAX_HINTS_REACHED') {
      return res.status(400).json({ error: 'Maximum of 3 hints reached for this submission.' });
    }
    if (error.message === 'PROVIDER_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI hint service is not configured.' });
    }
    if (error.message?.includes('AI provider') || error.message?.includes('AI response')) {
      return res.status(502).json({ error: 'AI feedback is temporarily unavailable. Please try again.' });
    }
    console.error('getAIHint error:', error);
    return res.status(500).json({ error: 'AI feedback is temporarily unavailable. Please try again.' });
  }
};

export const getRunHint = async (req: Request, res: Response) => {
  try {
    const labId = (req.params.id || req.body.labId) as string;
    const { language, sourceCode, status, stdout, stderr } = req.body;

    if (!labId || !language || !sourceCode || !status) {
      return res.status(400).json({ error: 'Missing required fields for hint generation' });
    }

    if (status === 'SUCCESS' || status === 'ACCEPTED' || status === 'PASSED') {
      return res.status(400).json({ error: 'AI hints are intended for code that needs debugging.' });
    }

    const feedback = await generateTransientHint(labId, language, sourceCode, status, stdout, stderr);
    
    return res.status(200).json({ success: true, feedback });
  } catch (error: any) {
    if (error.message === 'LAB_NOT_FOUND') {
      return res.status(404).json({ error: 'Lab not found' });
    }
    if (error.message?.includes('AI provider') || error.message?.includes('AI response')) {
      return res.status(502).json({ error: 'AI feedback is temporarily unavailable. Please try again.' });
    }
    console.error('getRunHint error:', error);
    return res.status(500).json({ error: 'AI feedback is temporarily unavailable. Please try again.' });
  }
};
