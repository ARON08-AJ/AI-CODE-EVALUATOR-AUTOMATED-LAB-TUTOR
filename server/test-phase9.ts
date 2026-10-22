import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

const generateToken = (payload: any) => jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

async function runTests() {
  console.log('--- Phase 9 Test Script ---');

  const uniqueSuffix = Date.now().toString();
  const facultyEmail = `faculty9_${uniqueSuffix}@example.com`;
  const studentEmail = `student9_${uniqueSuffix}@example.com`;
  const studentBEmail = `student9b_${uniqueSuffix}@example.com`;
  const studentPassword = 'password123';

  const facultyUser = await prisma.user.create({
    data: { name: 'Faculty 9', email: facultyEmail, passwordHash: 'dummy', role: 'FACULTY' }
  });
  const facultyToken = generateToken({ id: facultyUser.id, role: facultyUser.role });

  const studentUser = await prisma.user.create({
    data: { name: 'Student 9', email: studentEmail, passwordHash: 'dummy', registerNumber: 'S9A' + uniqueSuffix, role: 'STUDENT' }
  });
  const studentToken = generateToken({ id: studentUser.id, role: studentUser.role });

  const studentBUser = await prisma.user.create({
    data: { name: 'Student 9B', email: studentBEmail, passwordHash: 'dummy', registerNumber: 'S9B' + uniqueSuffix, role: 'STUDENT' }
  });
  const studentBToken = generateToken({ id: studentBUser.id, role: studentBUser.role });

  const lab = await prisma.lab.create({
    data: {
      title: 'Phase 9 Test Lab',
      description: 'Test lab',
      constraints: 'None',
      sampleInput: 'None',
      sampleOutput: 'None',
      difficulty: 'EASY',
      supportedLanguages: 'C,C++,Java,Python',
      createdById: facultyUser.id,
      published: true
    }
  });
  const labId = lab.id;

  await prisma.labAssignment.create({ data: { labId, studentId: studentUser.id } });

  // Create test cases
  await prisma.testCase.create({ data: { labId, input: '5\n10 20 5 30 15\n', expectedOutput: '30\n', visibility: 'PUBLIC' } });
  await prisma.testCase.create({ data: { labId, input: '2\n100 200\n', expectedOutput: '200', visibility: 'HIDDEN' } });
  
  // Output normalization specific test cases
  await prisma.testCase.create({ data: { labId, input: 'A', expectedOutput: '10 \n \n', visibility: 'PUBLIC' } }); // Test 3
  await prisma.testCase.create({ data: { labId, input: 'B', expectedOutput: '10', visibility: 'PUBLIC' } }); // Test 4

  console.log('✅ Setup Complete');

  const submitCode = async (language: string, sourceCode: string, token: string = studentToken, overrideLabId = labId) => {
    try {
      const res = await axios.post(`${API_URL}/student/labs/${overrideLabId}/submit`, { language, sourceCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { status: res.status, data: res.data };
    } catch (err: any) {
      return { status: err.response?.status || 500, data: err.response?.data };
    }
  };

  const runCode = async (language: string, sourceCode: string, input: string) => {
    try {
      const res = await axios.post(`${API_URL}/student/labs/${labId}/run`, { language, sourceCode, input }, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      return { status: res.status, data: res.data };
    } catch (err: any) {
      return { status: err.response?.status || 500, data: err.response?.data };
    }
  };

  // TEST 1 — All tests pass (ACCEPTED) with C++
  const cppCode = `
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;
int main() {
  string s;
  if (!(cin >> s)) return 0;
  if (s == "A") { cout << "10\\n"; return 0; }
  if (s == "B") { cout << "10\\n\\n"; return 0; } // Trailing newlines should be normalized
  
  // Actually we need to handle the first test cases which are integers
  int n = stoi(s);
  int max_val = -1;
  for (int i = 0; i < n; i++) {
    int x; cin >> x;
    if (x > max_val) max_val = x;
  }
  cout << max_val << "\\n";
  return 0;
}`;
  const test1 = await submitCode('C++', cppCode);
  if (test1.status === 200 && test1.data?.evaluation?.status === 'ACCEPTED' && test1.data.evaluation.passedTests === 4) {
    console.log('✅ PASSED: TEST 1 — All tests pass (C++) & normalization works');
  } else {
    console.error('❌ FAILED: TEST 1', test1.data);
  }

  // TEST 2 — Wrong Answer (Python)
  const pyCode = `print("999")`;
  const test2 = await submitCode('Python', pyCode);
  if (test2.status === 200 && test2.data?.evaluation?.status === 'WRONG_ANSWER') {
    console.log('✅ PASSED: TEST 2 — Wrong answer (Python)');
  } else {
    console.error('❌ FAILED: TEST 2', test2.data);
  }

  // TEST 3 — Compilation Error (C)
  const cCode = `int main() { printf("Hello") }`; // Missing semicolon
  const test3 = await submitCode('C', cCode);
  if (test3.status === 200 && test3.data?.evaluation?.status === 'COMPILATION_ERROR') {
    console.log('✅ PASSED: TEST 3 — Compilation error (C)');
  } else {
    console.error('❌ FAILED: TEST 3', test3.data);
  }

  // TEST 4 — Runtime Error (Java)
  const javaCode = `
public class Main {
  public static void main(String[] args) {
    int x = 1 / 0;
  }
}`;
  const test4 = await submitCode('Java', javaCode);
  if (test4.status === 200 && test4.data?.evaluation?.status === 'RUNTIME_ERROR') {
    console.log('✅ PASSED: TEST 4 — Runtime error (Java)');
  } else {
    console.error('❌ FAILED: TEST 4', test4.data);
  }

  // TEST 5 — Timeout
  const infLoopCode = `while True: pass`;
  const test5 = await submitCode('Python', infLoopCode);
  if (test5.status === 200 && test5.data?.evaluation?.status === 'TIME_LIMIT_EXCEEDED') {
    console.log('✅ PASSED: TEST 5 — Timeout');
  } else {
    console.error('❌ FAILED: TEST 5', test5.data);
  }

  // TEST 6 — Output limit
  const floodCode = `while True: print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")`;
  const test6 = await submitCode('Python', floodCode);
  if (test6.status === 200 && test6.data?.evaluation?.status === 'OUTPUT_LIMIT_EXCEEDED') {
    console.log('✅ PASSED: TEST 6 — Output limit');
  } else {
    console.error('❌ FAILED: TEST 6', test6.data);
  }

  // TEST 7 — Stdin handling regression (Run)
  const test7 = await runCode('Python', `x = input()\nprint(x)`, 'custom_input_test');
  if (test7.status === 200 && test7.data.result?.stdout === 'custom_input_test\n') {
    console.log('✅ PASSED: TEST 7 — Stdin handling (Run regression)');
  } else {
    console.error('❌ FAILED: TEST 7', test7.data);
  }

  // TEST 8 — Hidden Test Security
  const hiddenTestResult = test1.data?.evaluation?.tests.find((t: any) => t.visibility === 'HIDDEN');
  if (hiddenTestResult && !hiddenTestResult.input && !hiddenTestResult.expectedOutput) {
    console.log('✅ PASSED: TEST 8 — Hidden test security');
  } else {
    console.error('❌ FAILED: TEST 8 — Hidden test leaked data!', hiddenTestResult);
  }

  // TEST 9 — Unpublished lab blocked
  await prisma.lab.update({ where: { id: labId }, data: { published: false } });
  const test9 = await submitCode('Python', `print(1)`);
  if (test9.status === 404) {
    console.log('✅ PASSED: TEST 9 — Unpublished lab blocked');
  } else {
    console.error('❌ FAILED: TEST 9', test9.status);
  }
  await prisma.lab.update({ where: { id: labId }, data: { published: true } });

  // TEST 10 — Unassigned lab blocked & Student B blocked
  const test10 = await submitCode('Python', `print(1)`, studentBToken);
  if (test10.status === 404) {
    console.log('✅ PASSED: TEST 10 — Unassigned lab blocked');
  } else {
    console.error('❌ FAILED: TEST 10', test10.status);
  }

  // TEST 11 — Faculty cannot use submit
  const test11 = await submitCode('Python', `print(1)`, facultyToken);
  if (test11.status === 403) {
    console.log('✅ PASSED: TEST 11 — Faculty blocked from student endpoint');
  } else {
    console.error('❌ FAILED: TEST 11', test11.status);
  }

  // TEST 12 — Invalid language
  const test12 = await submitCode('Rust', `fn main() {}`);
  if (test12.status === 400) {
    console.log('✅ PASSED: TEST 12 — Invalid language rejected');
  } else {
    console.error('❌ FAILED: TEST 12', test12.status);
  }

  // TEST 13 — Zero test case lab rejected
  const emptyLab = await prisma.lab.create({
    data: {
      title: 'Empty Lab', description: 'Test', constraints: 'None', sampleInput: 'None', sampleOutput: 'None',
      difficulty: 'EASY', supportedLanguages: 'Python', createdById: facultyUser.id, published: true
    }
  });
  await prisma.labAssignment.create({ data: { labId: emptyLab.id, studentId: studentUser.id } });
  const test13 = await submitCode('Python', `print(1)`, studentToken, emptyLab.id);
  if (test13.status === 400 && test13.data.error?.includes('No test cases')) {
    console.log('✅ PASSED: TEST 13 — Zero test cases lab rejected');
  } else {
    console.error('❌ FAILED: TEST 13', test13.data);
  }

  // Server health
  const health = await axios.get('http://localhost:3000/api/health');
  if (health.status === 200) {
    console.log('✅ PASSED: Server remains responsive');
  }

  console.log('✅ ALL PHASE 9 INTEGRATION TESTS EXECUTED');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
