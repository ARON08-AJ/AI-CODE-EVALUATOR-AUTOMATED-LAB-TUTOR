import { PrismaClient } from '@prisma/client';
import { AIFactory } from '../ai/ai.factory';
import { AIHintContext, SafeTestResult } from '../ai/ai.interface';

const prisma = new PrismaClient();

export const generateHintForSubmission = async (
  studentId: string, 
  submissionId: string, 
  requestedHintLevel?: number
) => {
  // 1. Load submission and enforce ownership
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      lab: {
        include: {
          testCases: true
        }
      },
      testResults: {
        include: {
          testCase: true
        }
      }
    }
  });

  if (!submission || submission.studentId !== studentId) {
    throw new Error('SUBMISSION_NOT_FOUND');
  }

  // 2. Abort if accepted
  if (submission.status === 'ACCEPTED' || submission.status === 'PASSED') {
    throw new Error('SUBMISSION_ACCEPTED');
  }

  // 3. Load all existing hints for this submission
  const existingFeedbacks = await prisma.aIFeedback.findMany({
    where: { submissionId },
    orderBy: { hintLevel: 'asc' }
  });

  // 4. Determine target hint level
  let targetHintLevel: number;

  if (requestedHintLevel !== undefined && requestedHintLevel !== null) {
    if (![1, 2, 3].includes(requestedHintLevel)) {
      throw new Error('INVALID_HINT_LEVEL');
    }
    targetHintLevel = requestedHintLevel;
  } else {
    // Auto-determine next unused hint level
    const existingLevels = new Set(existingFeedbacks.map(f => f.hintLevel));
    if (!existingLevels.has(1)) {
      targetHintLevel = 1;
    } else if (!existingLevels.has(2)) {
      targetHintLevel = 2;
    } else if (!existingLevels.has(3)) {
      targetHintLevel = 3;
    } else {
      throw new Error('MAX_HINTS_REACHED');
    }
  }

  // 5. Cache-First Check: Return existing hint for this level immediately without calling Groq
  const existingTargetHint = existingFeedbacks.find(f => f.hintLevel === targetHintLevel);
  if (existingTargetHint) {
    return {
      ...existingTargetHint,
      concepts: JSON.parse(existingTargetHint.conceptsToReview),
      nextSteps: JSON.parse(existingTargetHint.nextSteps)
    };
  }

  // 6. Max 3 Hints limit check
  if (existingFeedbacks.length >= 3) {
    throw new Error('MAX_HINTS_REACHED');
  }

  // 7. Build safe test results for AI context
  const safeTestResults: SafeTestResult[] = submission.testResults.map(tr => {
    const isPublic = tr.testCase.visibility === 'PUBLIC';
    return {
      testNumber: submission.lab.testCases.findIndex(tc => tc.id === tr.testCaseId) + 1,
      status: tr.status,
      visibility: tr.testCase.visibility as 'PUBLIC' | 'HIDDEN',
      // ONLY include payloads for PUBLIC tests
      expectedOutput: isPublic ? tr.testCase.expectedOutput : undefined,
    };
  });

  // 8. Build previous hints history for AI context
  const previousHints = existingFeedbacks.map(f => ({
    hintLevel: f.hintLevel,
    explanation: f.explanation,
    hint: f.hint
  }));

  // 9. Create AI Context
  const context: AIHintContext = {
    language: submission.language,
    sourceCode: submission.sourceCode,
    status: submission.status,
    problemTitle: submission.lab.title,
    problemDescription: submission.lab.description,
    constraints: submission.lab.constraints,
    sampleInput: submission.lab.sampleInput,
    sampleOutput: submission.lab.sampleOutput,
    testResults: safeTestResults,
    hintLevel: targetHintLevel,
    previousHints
  };

  // 10. Get provider and generate hint
  let provider;
  try {
    provider = AIFactory.getProvider();
  } catch (e: any) {
    throw new Error('PROVIDER_NOT_CONFIGURED');
  }

  const response = await provider.generateHint(context);

  // 11. Persist AIFeedback with race condition protection
  let feedback;
  try {
    feedback = await prisma.aIFeedback.create({
      data: {
        submissionId: submission.id,
        hintLevel: targetHintLevel,
        errorType: response.errorType,
        explanation: response.explanation,
        hint: response.hint,
        conceptsToReview: JSON.stringify(response.concepts),
        nextSteps: JSON.stringify(response.nextSteps)
      }
    });
  } catch (dbErr: any) {
    if (dbErr.code === 'P2002' || dbErr.message?.includes('Unique constraint')) {
      const racedFeedback = await prisma.aIFeedback.findFirst({
        where: { submissionId, hintLevel: targetHintLevel }
      });
      if (racedFeedback) {
        return {
          ...racedFeedback,
          concepts: JSON.parse(racedFeedback.conceptsToReview),
          nextSteps: JSON.parse(racedFeedback.nextSteps)
        };
      }
    }
    throw dbErr;
  }

  return {
    ...feedback,
    concepts: response.concepts,
    nextSteps: response.nextSteps
  };
};

export const generateTransientHint = async (
  labId: string,
  language: string,
  sourceCode: string,
  status: string,
  stdout?: string,
  stderr?: string
) => {
  const lab = await prisma.lab.findUnique({
    where: { id: labId }
  });

  if (!lab) throw new Error('LAB_NOT_FOUND');

  const context: AIHintContext = {
    language,
    sourceCode,
    status,
    problemTitle: lab.title,
    problemDescription: lab.description,
    constraints: lab.constraints,
    sampleInput: lab.sampleInput,
    sampleOutput: lab.sampleOutput,
    testResults: [] // Transient run might not have structured test results, or it's a single run
  };

  // If there's stderr, we could pass it in some way, but AIHintContext might not support it directly.
  // We can just append it to sourceCode or testResults for context if it's a compilation error.
  if (status === 'COMPILATION_ERROR' && stderr) {
    context.testResults.push({
      testNumber: 0,
      status: 'COMPILATION_ERROR',
      visibility: 'PUBLIC',
      expectedOutput: 'Compilation success',
      // We'll map actualOutput to stderr so the AI sees it
    } as any); 
  } else if (stderr) {
    context.testResults.push({
      testNumber: 0,
      status: 'RUNTIME_ERROR',
      visibility: 'PUBLIC',
      // map actualOutput to stderr
    } as any);
  }

  let provider;
  try {
    provider = AIFactory.getProvider();
  } catch (e: any) {
    throw new Error('PROVIDER_NOT_CONFIGURED');
  }

  const response = await provider.generateHint(context);
  
  return response;
};
