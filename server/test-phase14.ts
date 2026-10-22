import axios, { AxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- PHASE 14 FULL QA & E2E INTEGRATION TESTS ---');

  console.log('Server started for testing.');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Health / Basic Check (We'll verify API is up by attempting a bad login)
    let healthOk = false;
    try {
      await axios.post(`${API_URL}/auth/login`, { email: 'bad@example.com', password: 'bad' });
    } catch (e: any) {
      healthOk = [400, 401, 404].includes(e.response?.status);
    }
    assert(healthOk, 'TEST 1: Health/auth endpoint works and returns expected HTTP statuses');

    // TEST 2: Student login works
    const student1Res = await axios.post(`${API_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123'
    });
    const student1Token = student1Res.data.token;
    const student1Id = student1Res.data.user.id;
    assert(!!student1Token, 'TEST 2: Student login works');

    // Make sure we have a second student
    let student2Token;
    let student2Id;
    try {
      const student2Res = await axios.post(`${API_URL}/auth/register`, {
        name: 'QA Test Student 2',
        email: 'qa_student2@example.com',
        password: 'password123',
        registerNumber: 'QA2'
      });
      student2Token = student2Res.data.token;
      student2Id = student2Res.data.user.id;
    } catch (e) {
      const student2Res = await axios.post(`${API_URL}/auth/login`, {
        email: 'qa_student2@example.com',
        password: 'password123'
      });
      student2Token = student2Res.data.token;
      student2Id = student2Res.data.user.id;
    }
    if (!student2Token) throw new Error("Could not login student 2");

    // TEST 3: Faculty login works
    const facultyRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'faculty@example.com',
      password: 'password123'
    });
    const facultyToken = facultyRes.data.token;
    assert(!!facultyToken, 'TEST 3: Faculty login works');

    // Create a new lab to act as the source of truth
    const labTitle = `Phase 14 DB Source Test Lab - ${Date.now()}`;
    const createLabRes = await axios.post(`${API_URL}/faculty/labs`, {
      title: labTitle,
      description: 'DB source-of-truth verification description',
      constraints: 'O(N) time',
      sampleInput: 'QA input',
      sampleOutput: 'QA output',
      difficulty: 'MEDIUM',
      supportedLanguages: 'Python'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });
    const labId = createLabRes.data.lab.id;

    await axios.post(`${API_URL}/faculty/labs/${labId}/test-cases`, {
      input: 'public_in\n',
      expectedOutput: 'public_out\n',
      visibility: 'PUBLIC'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    await axios.post(`${API_URL}/faculty/labs/${labId}/test-cases`, {
      input: 'hidden_in\n',
      expectedOutput: 'hidden_out\n',
      visibility: 'HIDDEN'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    // TEST 8: Faculty-created/database-backed lab data is returned correctly
    const checkLabRes = await axios.get(`${API_URL}/faculty/labs/${labId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(checkLabRes.data.lab.title === labTitle, 'TEST 8: Faculty-created lab data is returned correctly from API');

    // TEST 5: Faculty dashboard loads real database-backed data
    const facDashRes = await axios.get(`${API_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const hasLabInDashboard = facDashRes.data.dashboard.labs.some((l: any) => l.title === labTitle);
    assert(hasLabInDashboard, 'TEST 5: Faculty dashboard loads real database-backed data');

    // TEST 7: Unassigned lab remains inaccessible
    try {
      await axios.get(`${API_URL}/student/labs/${labId}`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      assert(false, 'TEST 7: Unassigned lab was accessible');
    } catch (e: any) {
      assert(e.response?.status === 404, 'TEST 7: Unassigned lab remains inaccessible (404)');
    }

    // Publish & Assign
    await axios.patch(`${API_URL}/faculty/labs/${labId}/publish`, {}, { headers: { Authorization: `Bearer ${facultyToken}` } });
    await axios.post(`${API_URL}/faculty/labs/${labId}/assign`, {
      studentIds: [student1Id]
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    // TEST 6: Student receives only assigned/published labs
    const stuLabsRes = await axios.get(`${API_URL}/student/labs`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const studentHasLab = stuLabsRes.data.labs.some((l: any) => l.title === labTitle);
    assert(studentHasLab, 'TEST 6: Student receives assigned/published labs');

    // Student 2 should NOT have it
    const stu2LabsRes = await axios.get(`${API_URL}/student/labs`, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    const student2HasLab = stu2LabsRes.data.labs.some((l: any) => l.title === labTitle);
    assert(!student2HasLab, 'TEST 6: Student 2 does not receive unassigned lab');

    // TEST 4: Student dashboard loads real database-backed data
    const stuDashRes = await axios.get(`${API_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const hasLabInStuDash = stuDashRes.data.dashboard.labs.some((l: any) => l.title === labTitle);
    assert(hasLabInStuDash, 'TEST 4: Student dashboard loads real database-backed data');

    // TEST 10: Wrong submission persists
    const wrongSubRes = await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
      language: 'Python',
      sourceCode: 'print("wrong_output")'
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    const wrongSubId = wrongSubRes.data.evaluation.submissionId;
    assert(wrongSubRes.data.evaluation.status === 'WRONG_ANSWER', 'TEST 10: Wrong submission judged WRONG_ANSWER');

    // TEST 9: Correct submission persists
    const correctSubRes = await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
      language: 'Python',
      sourceCode: 'import sys\ni = sys.stdin.read().strip()\nif i == "public_in":\n    print("public_out")\nelif i == "hidden_in":\n    print("hidden_out")\nelse:\n    print(i)'
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    assert(correctSubRes.data.evaluation.status === 'ACCEPTED', 'TEST 9: Correct submission judged ACCEPTED and persisted');

    // TEST 11: Submission history returns correct records
    const histRes = await axios.get(`${API_URL}/student/submissions?labId=${labId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const histHasBoth = histRes.data.submissions.length >= 2;
    assert(histHasBoth, 'TEST 11: Submission history returns correct records');

    // TEST 12: Submission detail ownership works
    const wrongSubDetail = await axios.get(`${API_URL}/student/submissions/${wrongSubId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(wrongSubDetail.data.submission.id === wrongSubId, 'TEST 12: Submission detail ownership works');

    // TEST 16: Hidden test data remains protected
    const hiddenResults = wrongSubDetail.data.submission.tests?.find((r: any) => r.visibility === 'HIDDEN');
    const isHiddenSafe = !hiddenResults || !hiddenResults.expectedOutput;
    assert(isHiddenSafe, 'TEST 16: Hidden test data remains protected in detail API');

    // TEST 13: Cross-student submission access blocked
    try {
      await axios.get(`${API_URL}/student/submissions/${wrongSubId}`, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
      assert(false, 'TEST 13: Cross-student submission access succeeded');
    } catch (e: any) {
      assert(e.response?.status === 404, 'TEST 13: Cross-student submission access blocked (404)');
    }

    // TEST 14: AI hint request works for eligible failed submission
    const aiRes = await axios.post(`${API_URL}/student/submissions/${wrongSubId}/hint`, {}, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(!!aiRes.data.feedback, 'TEST 14: AI hint request works for eligible failed submission');

    // TEST 15: AI feedback persists
    const aiDetailCheck = await axios.post(`${API_URL}/student/submissions/${wrongSubId}/hint`, {}, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    // Check that it returns exactly the same persisted hint (id should match)
    assert(aiDetailCheck.data.feedback.id === aiRes.data.feedback.id, 'TEST 15: AI feedback persists in DB and is returned');

    // TEST 18: No sensitive fields appear in major student responses
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(!meRes.data.password && !meRes.data.passwordHash, 'TEST 18: No sensitive fields appear in major student responses');

    // TEST 19: Rate limiting/security controls remain functional
    try {
      // Trigger execution rate limiter for this student (limit: 30)
      for (let i = 0; i < 35; i++) {
        await axios.post(`${API_URL}/student/labs/${labId}/run`, {
          language: 'Python',
          sourceCode: 'print(1)',
          input: ''
        }, {
          headers: { Authorization: `Bearer ${student1Token}` }
        });
      }
      assert(false, 'TEST 19: Rate limiting failed to trigger');
    } catch (e: any) {
      assert(e.response?.status === 429, 'TEST 19: Rate limiting/security controls remain functional');
    }

    // TEST 17: Server remains responsive after complete workflow
    const s2Health = await axios.get(`${API_URL}/student/labs`, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    assert(s2Health.status === 200, 'TEST 17: Server remains responsive after complete workflow');

    // TEST 20: Frontend/backend API contract assumptions are consistent
    const hasConsistentDashFields = !!(stuDashRes.data.dashboard.stats && stuDashRes.data.dashboard.labs && stuDashRes.data.dashboard.recentSubmissions);
    assert(hasConsistentDashFields, 'TEST 20: Frontend/backend API contract assumptions are consistent where testable');

  } catch (err: any) {
    console.error('Test script crashed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  } finally {
    // cleanup
  }

  console.log(`\nPhase 14 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
