import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();

// Keep track of created users to clean up later or just run them and see
let facultyToken = '';
let studentAToken = '';
let studentBToken = '';
let studentAId = '';
let studentBId = '';
let devLabId = '';
import * as jwt from 'jsonwebtoken';

const generateToken = (payload: any) => jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

const setup = async () => {
  console.log('--- Phase 10 Test Setup ---');
  // Clean up if previous tests left data
  await prisma.submission.deleteMany({
    where: {
      student: { email: { startsWith: 'p10_' } }
    }
  });
  await prisma.labAssignment.deleteMany({
    where: { student: { email: { startsWith: 'p10_' } } }
  });
  await prisma.testCase.deleteMany({
    where: { lab: { title: 'P10 Lab' } }
  });
  await prisma.lab.deleteMany({
    where: { title: 'P10 Lab' }
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'p10_' } }
  });

  const facUser = await prisma.user.create({
    data: { name: 'P10 Faculty', email: 'p10_faculty@example.com', passwordHash: 'dummy', role: 'FACULTY' }
  });
  facultyToken = generateToken({ id: facUser.id, role: facUser.role });

  const stAUser = await prisma.user.create({
    data: { name: 'P10 Student A', email: 'p10_stA@example.com', passwordHash: 'dummy', registerNumber: 'P10_STA', role: 'STUDENT' }
  });
  studentAToken = generateToken({ id: stAUser.id, role: stAUser.role });
  studentAId = stAUser.id;

  const stBUser = await prisma.user.create({
    data: { name: 'P10 Student B', email: 'p10_stB@example.com', passwordHash: 'dummy', registerNumber: 'P10_STB', role: 'STUDENT' }
  });
  studentBToken = generateToken({ id: stBUser.id, role: stBUser.role });
  studentBId = stBUser.id;

  const lab = await prisma.lab.create({
    data: {
      title: 'P10 Lab',
      description: 'Persistence Lab',
      constraints: 'None',
      sampleInput: '1',
      sampleOutput: '1',
      difficulty: 'EASY',
      supportedLanguages: 'C,C++,Java,Python',
      createdById: facUser.id,
      published: true
    }
  });
  devLabId = lab.id;

  await prisma.testCase.createMany({
    data: [
      { labId: devLabId, input: '1', expectedOutput: '1\n', visibility: 'PUBLIC' },
      { labId: devLabId, input: '2', expectedOutput: '2\n', visibility: 'HIDDEN' }
    ]
  });

  await prisma.labAssignment.create({
    data: { labId: devLabId, studentId: stAUser.id }
  });

  console.log('✅ Setup Complete');
};

const runTests = async () => {
  let subId1 = '';
  let subId2 = '';

  try {
    // TEST 1 — Correct submission creates ACCEPTED
    const t1Code = `
#include <iostream>
using namespace std;
int main() {
  int x;
  if(cin >> x) cout << x << endl;
  return 0;
}`;
    const t1 = await axios.post(`${API_URL}/student/labs/${devLabId}/submit`, {
      language: 'C++', sourceCode: t1Code
    }, { headers: { Authorization: `Bearer ${studentAToken}` } });

    if (t1.data.evaluation.status !== 'ACCEPTED') throw new Error('Test 1 Eval not accepted');
    subId1 = t1.data.evaluation.submissionId;
    if (!subId1) throw new Error('No submissionId returned in TEST 1');
    
    // DB Check
    const dbSub1 = await prisma.submission.findUnique({ where: { id: subId1 }, include: { testResults: true } });
    if (!dbSub1 || dbSub1.status !== 'ACCEPTED' || dbSub1.passedTests !== 2 || dbSub1.testResults.length !== 2) {
      throw new Error('Test 1 DB state invalid');
    }
    console.log('✅ PASSED: TEST 1 — Correct submission');

    // TEST 2 — Wrong answer
    const t2Code = `
#include <iostream>
using namespace std;
int main() {
  cout << 999 << endl;
  return 0;
}`;
    const t2 = await axios.post(`${API_URL}/student/labs/${devLabId}/submit`, {
      language: 'C++', sourceCode: t2Code
    }, { headers: { Authorization: `Bearer ${studentAToken}` } });
    if (t2.data.evaluation.status !== 'WRONG_ANSWER') throw new Error('Test 2 Eval not WA');
    subId2 = t2.data.evaluation.submissionId;

    const dbSub2 = await prisma.submission.findUnique({ where: { id: subId2 } });
    if (!dbSub2 || dbSub2.status !== 'WRONG_ANSWER' || dbSub2.passedTests !== 0) throw new Error('Test 2 DB state invalid');
    console.log('✅ PASSED: TEST 2 — Wrong answer persists');

    // TEST 3 — Compilation error
    const t3Code = `int main() { return; }`; // C++ CE
    const t3 = await axios.post(`${API_URL}/student/labs/${devLabId}/submit`, {
      language: 'C++', sourceCode: t3Code
    }, { headers: { Authorization: `Bearer ${studentAToken}` } });
    if (t3.data.evaluation.status !== 'COMPILATION_ERROR') throw new Error('Test 3 not CE');
    const dbSub3 = await prisma.submission.findUnique({ where: { id: t3.data.evaluation.submissionId }, include: { testResults: true } });
    if (!dbSub3 || dbSub3.status !== 'COMPILATION_ERROR' || dbSub3.testResults.length !== 0) throw new Error('Test 3 DB state invalid');
    console.log('✅ PASSED: TEST 3 — Compilation error persists (no test results)');

    // TEST 4 — Submission History
    const h1 = await axios.get(`${API_URL}/student/submissions`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    if (h1.data.submissions.length < 3) throw new Error('History should have 3 items');
    // Ensure newest first
    if (h1.data.submissions[0].id !== dbSub3.id) throw new Error('History order not newest first');
    // Ensure no source code in list
    if (h1.data.submissions[0].sourceCode) throw new Error('History list exposes source code');
    console.log('✅ PASSED: TEST 4 — Submission history');

    // TEST 5 — Submission Detail
    const d1 = await axios.get(`${API_URL}/student/submissions/${subId1}`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    if (d1.data.submission.status !== 'ACCEPTED') throw new Error('Detail mismatch');
    if (!d1.data.submission.sourceCode.includes('cin >> x')) throw new Error('Detail source code missing');
    const tests = d1.data.submission.tests;
    const hiddenTest = tests.find((t: any) => t.visibility === 'HIDDEN');
    if (!hiddenTest) throw new Error('Missing hidden test result');
    if (hiddenTest.input || hiddenTest.expectedOutput || hiddenTest.actualOutput) throw new Error('Hidden test leaked data');
    console.log('✅ PASSED: TEST 5 — Submission detail (Hidden tests secured)');

    // TEST 6 — Cross-student access
    try {
      await axios.get(`${API_URL}/student/submissions/${subId1}`, {
        headers: { Authorization: `Bearer ${studentBToken}` }
      });
      throw new Error('Should have 404ed');
    } catch (e: any) {
      if (e.response?.status !== 404) throw new Error('Did not return 404 for cross-student access');
    }
    
    // Also check student B history
    const hb = await axios.get(`${API_URL}/student/submissions`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    if (hb.data.submissions.length !== 0) throw new Error('Student B should have no history');
    console.log('✅ PASSED: TEST 6 — Cross-student access blocked');

    // TEST 7 — Unassigned lab
    try {
      await axios.post(`${API_URL}/student/labs/${devLabId}/submit`, {
        language: 'Python', sourceCode: 'print(1)'
      }, { headers: { Authorization: `Bearer ${studentBToken}` } });
      throw new Error('Should be forbidden');
    } catch (e: any) {
      if (e.response?.status !== 404) throw new Error('Not 404 for unassigned');
    }
    console.log('✅ PASSED: TEST 7 — Unassigned lab blocked');

    console.log('✅ ALL PHASE 10 PERSISTENCE TESTS PASSED');
  } catch (e: any) {
    console.error('❌ FAILED:', e.response?.data || e.message);
    process.exit(1);
  }
};

setup().then(runTests).catch(console.error);
