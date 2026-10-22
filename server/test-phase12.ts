import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { MockAIProvider } from './src/services/ai/mock.provider';
import { AIFactory } from './src/services/ai/ai.factory';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('=== PHASE 12: AI HINT SYSTEM TESTS ===\n');

  try {
    // 1. Setup Test Data
    const student1 = await prisma.user.findFirst({ where: { role: 'STUDENT', email: 'alice@example.com' } });
    const student2 = await prisma.user.findFirst({ where: { role: 'STUDENT', email: 'bob@example.com' } });
    const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY', email: 'faculty@example.com' } });

    if (!student1 || !student2 || !faculty) throw new Error('Missing test users');

    // Get tokens
    const s1Res = await axios.post(`${API_URL}/auth/login`, { email: student1.email, password: 'password123' });
    const s1Token = s1Res.data.token;
    const s2Res = await axios.post(`${API_URL}/auth/login`, { email: student2.email, password: 'password123' });
    const s2Token = s2Res.data.token;
    const fRes = await axios.post(`${API_URL}/auth/login`, { email: faculty.email, password: 'password123' });
    const fToken = fRes.data.token;

    // Create a lab with public and hidden tests
    const lab = await prisma.lab.create({
      data: {
        title: 'AI Hint Test Lab',
        description: 'Test lab for AI hints',
        constraints: 'None',
        sampleInput: '5',
        sampleOutput: '30',
        difficulty: 'EASY',
        supportedLanguages: 'Python',
        published: true,
        createdById: faculty.id,
        testCases: {
          create: [
            { input: '5', expectedOutput: '30', visibility: 'PUBLIC' },
            { input: 'SECRET_HIDDEN_INPUT_123', expectedOutput: 'SECRET_HIDDEN_EXPECTED_456', visibility: 'HIDDEN' }
          ]
        }
      },
      include: { testCases: true }
    });

    const publicTest = lab.testCases.find(t => t.visibility === 'PUBLIC')!;
    const hiddenTest = lab.testCases.find(t => t.visibility === 'HIDDEN')!;

    // Create a WRONG_ANSWER submission for Student 1
    const s1SubmissionWA = await prisma.submission.create({
      data: {
        studentId: student1.id,
        labId: lab.id,
        language: 'Python',
        sourceCode: 'print(25)',
        status: 'WRONG_ANSWER',
        totalTests: 2,
        passedTests: 0,
        failedTests: 2,
        testResults: {
          create: [
            { testCaseId: publicTest.id, passed: false, status: 'FAILED' },
            { testCaseId: hiddenTest.id, passed: false, status: 'FAILED' }
          ]
        }
      }
    });

    // Create an ACCEPTED submission for Student 1
    const s1SubmissionOK = await prisma.submission.create({
      data: {
        studentId: student1.id,
        labId: lab.id,
        language: 'Python',
        sourceCode: 'print(30)',
        status: 'ACCEPTED',
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        testResults: {
          create: [
            { testCaseId: publicTest.id, passed: true, status: 'PASSED' },
            { testCaseId: hiddenTest.id, passed: true, status: 'PASSED' }
          ]
        }
      }
    });

    // Force MockAIProvider
    process.env.USE_MOCK_AI = 'true';
    AIFactory.resetProvider(); // Force factory to pick up env change (if it was cached)
    const mockProvider = AIFactory.getProvider() as MockAIProvider;

    // --- TESTS ---

    // Test 1: Unauthenticated
    try {
      await axios.post(`${API_URL}/student/submissions/${s1SubmissionWA.id}/hint`);
      console.error('❌ Test 1 Failed: Unauthenticated request should fail');
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('✅ Test 1 Passed: Unauthenticated request returns 401');
      } else {
        console.error('❌ Test 1 Failed:', err.response?.status);
      }
    }

    // Test 2: Faculty Access
    try {
      await axios.post(`${API_URL}/student/submissions/${s1SubmissionWA.id}/hint`, {}, {
        headers: { Authorization: `Bearer ${fToken}` }
      });
      console.error('❌ Test 2 Failed: Faculty request should fail');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('✅ Test 2 Passed: Faculty request returns 403');
      } else {
        console.error('❌ Test 2 Failed:', err.response?.status);
      }
    }

    // Test 3: Other student's submission
    try {
      await axios.post(`${API_URL}/student/submissions/${s1SubmissionWA.id}/hint`, {}, {
        headers: { Authorization: `Bearer ${s2Token}` }
      });
      console.error('❌ Test 3 Failed: Student requesting another student submission should fail');
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.log('✅ Test 3 Passed: Student requesting another student submission returns 404');
      } else {
        console.error('❌ Test 3 Failed:', err.response?.status);
      }
    }

    // Test 4: Accepted submission
    try {
      await axios.post(`${API_URL}/student/submissions/${s1SubmissionOK.id}/hint`, {}, {
        headers: { Authorization: `Bearer ${s1Token}` }
      });
      console.error('❌ Test 4 Failed: Accepted submission should not generate hint');
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.error.includes('need debugging')) {
        console.log('✅ Test 4 Passed: Accepted submission returns controlled 400');
      } else {
        console.error('❌ Test 4 Failed:', err.response?.status, err.response?.data);
      }
    }

    // Test 5: Missing AI Configuration
    // We simulate this by turning off the mock flag and clearing the API key
    process.env.USE_MOCK_AI = 'false';
    const oldApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    AIFactory.resetProvider();
    
    // We call the service directly because the running HTTP server process can't see this env change
    const { generateHintForSubmission } = await import('./src/services/submission/ai.hint.service');

    try {
      await generateHintForSubmission(student1.id, s1SubmissionWA.id);
      console.error('❌ Test 5 Failed: Unconfigured AI should fail');
    } catch (err: any) {
      if (err.message === 'PROVIDER_NOT_CONFIGURED') {
        console.log('✅ Test 5 Passed: Missing AI configuration returns PROVIDER_NOT_CONFIGURED');
      } else {
        console.error('❌ Test 5 Failed:', err.message);
      }
    }

    // Restore Mock Provider
    if (oldApiKey) process.env.OPENAI_API_KEY = oldApiKey;
    process.env.USE_MOCK_AI = 'true';
    AIFactory.resetProvider();

    // Test 6: Success Path & LEAK TEST (Direct call)
    let leakTestPassed = false;
    let successPassed = false;
    let persistencePassed = false;
    try {
      const result = await generateHintForSubmission(student1.id, s1SubmissionWA.id);

      if (result && result.errorType === 'WRONG_ANSWER') {
        successPassed = true;
      }

      // Check for prompt leak in the local mock provider
      const mockProviderInstance = AIFactory.getProvider() as MockAIProvider;
      const prompt = mockProviderInstance.lastPrompt;

      if (prompt.includes('SECRET_HIDDEN_INPUT_123') || 
          prompt.includes('SECRET_HIDDEN_EXPECTED_456') || 
          prompt.includes('SECRET_HIDDEN_ACTUAL_789')) {
        console.error('❌ CRITICAL FAILURE: Hidden test data leaked into AI prompt!');
        console.error('Prompt dump:', prompt);
      } else {
        leakTestPassed = true;
      }

      // Verify persistence
      const dbFeedback = await prisma.aIFeedback.findFirst({
        where: { submissionId: s1SubmissionWA.id },
        orderBy: { createdAt: 'desc' }
      });
      if (dbFeedback && dbFeedback.errorType === 'WRONG_ANSWER') {
        persistencePassed = true;
      }

    } catch (err: any) {
      console.error('❌ Test 6 Failed (Error):', err.message);
    }

    if (successPassed && leakTestPassed && persistencePassed) {
      console.log('✅ Test 6 Passed: AI hint generated, persisted, and NO HIDDEN DATA LEAKED');
    } else {
      console.error('❌ Test 6 Failed. Success:', successPassed, 'Leak Safe:', leakTestPassed, 'Persisted:', persistencePassed);
    }

  } catch (error) {
    console.error('Unexpected test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
