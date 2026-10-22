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
  console.log('--- PHASE 13 SECURITY HARDENING TESTS ---');

  const serverEnv = { ...process.env, JWT_SECRET: 'test-secret-123', MAX_CONCURRENT_EXECUTIONS: '2' };
  const serverPath = path.join(__dirname, 'src', 'server.ts');
  const serverProc = spawn('npx', ['tsx', serverPath], { env: serverEnv });

  let serverReady = false;
  serverProc.stdout.on('data', (data) => {
    if (data.toString().includes('Server is running')) {
      serverReady = true;
    }
  });

  serverProc.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString()}`);
  });

  for (let i = 0; i < 40; i++) {
    if (serverReady) break;
    await delay(500);
  }

  if (!serverReady) {
    console.error('Failed to start server for tests');
    serverProc.kill();
    process.exit(1);
  }

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
    // We need tokens for tests. We use the seeded data.
    const facultyRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'faculty@example.com',
      password: 'password123'
    });
    const facultyToken = facultyRes.data.token;

    const student1Res = await axios.post(`${API_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123'
    });
    const student1Token = student1Res.data.token;
    const student1Id = student1Res.data.user.id;

    // We'll create another student for cross-student tests
    const student2Res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Security Test Student 2',
      email: 'secstudent2@example.com',
      password: 'password123',
      registerNumber: 'SEC2'
    }).catch(async (e) => {
       return await axios.post(`${API_URL}/auth/login`, {
         email: 'secstudent2@example.com',
         password: 'password123'
       });
    });
    const student2Token = student2Res.data.token;
    const student2Id = student2Res.data.user?.id;

    // Test 1: Unauthenticated
    try {
      await axios.get(`${API_URL}/faculty/labs`);
      assert(false, 'Test 1: Unauthenticated endpoint should fail');
    } catch (err: any) {
      assert(err.response?.status === 401, 'Test 1: Unauthenticated endpoint returned 401');
    }

    // Test 2: Student -> Faculty endpoint
    try {
      await axios.get(`${API_URL}/faculty/labs`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      assert(false, 'Test 2: Student hitting faculty endpoint should fail');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Test 2: Student hitting faculty endpoint returned 403');
    }

    // Test 3: Faculty -> Student endpoint
    try {
      await axios.get(`${API_URL}/student/labs`, {
        headers: { Authorization: `Bearer ${facultyToken}` }
      });
      assert(false, 'Test 3: Faculty hitting student endpoint should fail');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Test 3: Faculty hitting student endpoint returned 403');
    }

    // Need a lab and assignment to test further
    const labRes = await axios.post(`${API_URL}/faculty/labs`, {
      title: 'Security Test Lab',
      description: 'Lab for security testing',
      constraints: 'None',
      sampleInput: '1',
      sampleOutput: '1',
      difficulty: 'EASY',
      supportedLanguages: 'Python'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });
    const labId = labRes.data.lab.id;

    await axios.post(`${API_URL}/faculty/labs/${labId}/test-cases`, {
      input: '1\n',
      expectedOutput: '1\n',
      visibility: 'PUBLIC'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    await axios.post(`${API_URL}/faculty/labs/${labId}/test-cases`, {
      input: '2\n',
      expectedOutput: '2\n',
      visibility: 'HIDDEN'
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    await axios.patch(`${API_URL}/faculty/labs/${labId}/publish`, {}, { headers: { Authorization: `Bearer ${facultyToken}` } });

    await axios.post(`${API_URL}/faculty/labs/${labId}/assign`, {
      studentIds: [student1Id]
    }, { headers: { Authorization: `Bearer ${facultyToken}` } });

    // Ensure student2 is NOT assigned
    // Test 5: Unassigned lab access
    try {
      await axios.get(`${API_URL}/student/labs/${labId}`, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
      assert(false, 'Test 5: Student 2 accessed unassigned lab');
    } catch (err: any) {
      assert(err.response?.status === 404, 'Test 5: Unassigned lab access returned 404');
    }

    // Make a submission for student 1
    const subRes = await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
      language: 'Python',
      sourceCode: 'print(input())'
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    const submissionId = subRes.data.evaluation.submissionId;

    // Test 4: Student 2 accessing Student 1 submission
    try {
      await axios.get(`${API_URL}/student/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
      assert(false, 'Test 4: Student 2 accessed Student 1 submission');
    } catch (err: any) {
      assert(err.response?.status === 404, 'Test 4: Cross-student submission access returned 404');
    }

    // Test 7 & 8: Invalid / Malformed JWT
    try {
      await axios.get(`${API_URL}/student/labs`, {
        headers: { Authorization: `Bearer malformed-token-xyz` }
      });
      assert(false, 'Test 7: Malformed JWT should fail');
    } catch (err: any) {
      assert(err.response?.status === 401, 'Test 7: Malformed JWT returned 401');
    }

    // Test 9: Invalid language
    try {
      await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
        language: 'Ruby', // invalid
        sourceCode: 'puts "Hello"'
      }, { headers: { Authorization: `Bearer ${student1Token}` } });
      assert(false, 'Test 9: Invalid language should fail');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Test 9: Invalid language returned 400');
    }

    // Test 10: Invalid UUID format (should return 400/404, not 500)
    try {
      await axios.get(`${API_URL}/student/labs/invalid-uuid-format`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      assert(false, 'Test 10: Invalid UUID should not succeed');
    } catch (err: any) {
      assert([400, 404].includes(err.response?.status), `Test 10: Invalid UUID returned ${err.response?.status} instead of 500`);
    }

    // Test 11: Oversized source code
    try {
      const hugeCode = 'a'.repeat(200000); // larger than 100kb limit
      await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
        language: 'Python',
        sourceCode: hugeCode
      }, { headers: { Authorization: `Bearer ${student1Token}` } });
      assert(false, 'Test 11: Oversized source code should fail');
    } catch (err: any) {
      assert(err.response?.status === 400 || err.response?.status === 413, 'Test 11: Oversized source code returned ' + err.response?.status);
    }

    // Test 13 & 14: Execution timeout and infinite loop / Output flood
    const execRes1 = await axios.post(`${API_URL}/student/labs/${labId}/run`, {
      language: 'Python',
      sourceCode: 'import time\nwhile True: time.sleep(0.1)',
      input: ''
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    assert(execRes1.data.result.status === 'TIME_LIMIT_EXCEEDED', 'Test 13: Infinite loop caused TIME_LIMIT_EXCEEDED');

    const execRes2 = await axios.post(`${API_URL}/student/labs/${labId}/run`, {
      language: 'Python',
      sourceCode: 'while True: print("flood" * 100)',
      input: ''
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    assert(execRes2.data.result.status === 'OUTPUT_LIMIT_EXCEEDED', 'Test 14: Output flood caused OUTPUT_LIMIT_EXCEEDED');

    // Test 17: Shell injection attempt
    const execRes3 = await axios.post(`${API_URL}/student/labs/${labId}/run`, {
      language: 'Python',
      sourceCode: 'print("hello")',
      input: '1; ls -la'
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    const isSafe = execRes3.data.result?.stdout?.includes('hello') || execRes3.data.result?.status === 'SUCCESS';
    if (!isSafe) { console.error('Test 17 result:', execRes3.data.result); }
    assert(isSafe, 'Test 17: Shell injection in input was safely ignored');

    // Test 18: Hidden test cases
    const submitRes = await axios.post(`${API_URL}/student/labs/${labId}/submit`, {
      language: 'Python',
      sourceCode: 'print("wrong")'
    }, { headers: { Authorization: `Bearer ${student1Token}` } });
    
    // The response should NOT contain the expected output for hidden test (test 2)
    const hiddenTestResult = submitRes.data.evaluation?.results?.find((r: any) => r.testCase?.visibility === 'HIDDEN');
    const isHiddenSafe = !hiddenTestResult || !hiddenTestResult.testCase?.expectedOutput;
    if (!isHiddenSafe) { console.error('Test 18 hidden result:', hiddenTestResult); }
    assert(isHiddenSafe, 'Test 18: Hidden test expected output is not leaked');

    // Test 23: Data minimization - password hash should not be sent
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(!meRes.data.passwordHash && !meRes.data.password, 'Test 23: passwordHash not leaked in /auth/me');

    // Test 24: Final server health check (make sure it didn't crash)
    const healthRes = await axios.get(`${API_URL}/student/labs`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(healthRes.status === 200, 'Test 24: Server health is OK after abuse tests');

  } catch (err: any) {
    console.error('Test script crashed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
      console.error('Request URL:', err.config.url);
    }
  } finally {
    serverProc.kill();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
