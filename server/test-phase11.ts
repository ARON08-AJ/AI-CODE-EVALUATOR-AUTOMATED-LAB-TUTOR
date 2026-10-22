import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();
const generateToken = (payload: any) => jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

let facultyToken = '';
let studentAToken = '';
let studentBToken = '';
let studentAId = '';
let devLabId = '';
let facUser: any;

const setup = async () => {
  console.log('--- Phase 11 Test Setup ---');
  // Clean up
  await prisma.submission.deleteMany({ where: { student: { email: { startsWith: 'p11_' } } } });
  await prisma.labAssignment.deleteMany({ where: { student: { email: { startsWith: 'p11_' } } } });
  await prisma.testCase.deleteMany({ where: { lab: { title: 'P11 Lab' } } });
  await prisma.lab.deleteMany({ where: { title: 'P11 Lab' } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'p11_' } } });

  facUser = await prisma.user.create({
    data: { name: 'P11 Faculty', email: 'p11_faculty@example.com', passwordHash: 'dummy', role: 'FACULTY', department: 'CS' }
  });
  facultyToken = generateToken({ id: facUser.id, role: facUser.role });

  const stAUser = await prisma.user.create({
    data: { name: 'P11 Student A', email: 'p11_stA@example.com', passwordHash: 'dummy', registerNumber: 'P11_STA', role: 'STUDENT', department: 'IT' }
  });
  studentAToken = generateToken({ id: stAUser.id, role: stAUser.role });
  studentAId = stAUser.id;

  const stBUser = await prisma.user.create({
    data: { name: 'P11 Student B', email: 'p11_stB@example.com', passwordHash: 'dummy', registerNumber: 'P11_STB', role: 'STUDENT' }
  });
  studentBToken = generateToken({ id: stBUser.id, role: stBUser.role });

  // Create Lab
  const lab = await prisma.lab.create({
    data: {
      title: 'P11 Lab',
      description: 'Dashboard Lab',
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

  await prisma.testCase.create({
    data: { labId: devLabId, input: '1', expectedOutput: '1\n', visibility: 'HIDDEN' }
  });

  // Assign Student A & Student B
  await prisma.labAssignment.create({ data: { labId: devLabId, studentId: studentAId } });
  await prisma.labAssignment.create({ data: { labId: devLabId, studentId: stBUser.id } });

  console.log('✅ Setup Complete');
};

const runTests = async () => {
  try {
    // 1. Initial Empty Dashboard Checks
    const emptyStudentDash = await axios.get(`${API_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    if (emptyStudentDash.data.dashboard.stats.assignedLabs !== 1) throw new Error('Student missing assigned lab');
    if (emptyStudentDash.data.dashboard.stats.completedLabs !== 0) throw new Error('Should not have completed labs');
    if (emptyStudentDash.data.dashboard.labs[0].progress !== 'NOT_STARTED') throw new Error('Progress should be NOT_STARTED');
    console.log('✅ PASSED: Initial Empty Student Dashboard');

    const emptyFacultyDash = await axios.get(`${API_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    if (emptyFacultyDash.data.dashboard.stats.labs !== 1) throw new Error('Faculty missing lab');
    if (emptyFacultyDash.data.dashboard.stats.assignments !== 2) throw new Error('Faculty missing assignments (should be 2)');
    if (emptyFacultyDash.data.dashboard.labs[0]._count.assignments !== 2) throw new Error('Lab overview count wrong');
    console.log('✅ PASSED: Initial Empty Faculty Dashboard');

    // 2. Submit some code for Student A (Accepted)
    await prisma.submission.create({
      data: {
        studentId: studentAId, labId: devLabId, language: 'Python', sourceCode: 'print(1)',
        status: 'ACCEPTED', totalTests: 1, passedTests: 1, failedTests: 0, executionTime: 10
      }
    });

    // Submit some code for Student A (Failed)
    const failedSub = await prisma.submission.create({
      data: {
        studentId: studentAId, labId: devLabId, language: 'Python', sourceCode: 'print(2)',
        status: 'WRONG_ANSWER', totalTests: 1, passedTests: 0, failedTests: 1, executionTime: 12
      }
    });

    // 3. Verify Student Dashboard Stats Update
    const stDash = await axios.get(`${API_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const d = stDash.data.dashboard;
    if (d.stats.totalSubmissions !== 2) throw new Error('Should have 2 submissions');
    if (d.stats.acceptedSubmissions !== 1) throw new Error('Should have 1 accepted');
    if (d.stats.acceptanceRate !== 50) throw new Error('Acceptance rate should be 50');
    if (d.labs[0].progress !== 'COMPLETED') throw new Error('Lab should be marked COMPLETED');
    if (d.recentSubmissions.length !== 2) throw new Error('Recent submissions count wrong');
    if (d.recentSubmissions[0].id !== failedSub.id) throw new Error('Recent submissions ordering wrong (newest first)');
    if (d.recentSubmissions[0].sourceCode !== undefined) throw new Error('Source code exposed in dashboard feed!');
    console.log('✅ PASSED: Data-populated Student Dashboard');

    // 4. Verify Faculty Dashboard Stats Update
    const facDash = await axios.get(`${API_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const fd = facDash.data.dashboard;
    if (fd.stats.submissions !== 2) throw new Error('Faculty should see 2 total submissions');
    if (fd.stats.acceptedSubmissions !== 1) throw new Error('Faculty should see 1 accepted submission');
    if (fd.labs[0]._count.submissions !== 2) throw new Error('Faculty lab table missing submission count');
    if (fd.recentSubmissions.length !== 2) throw new Error('Faculty recent submissions count wrong');
    if (fd.recentSubmissions[0].sourceCode !== undefined) throw new Error('Source code exposed to faculty in dashboard feed!');
    if (!fd.recentSubmissions[0].student.name) throw new Error('Student name missing in faculty feed');
    console.log('✅ PASSED: Data-populated Faculty Dashboard');

    // 5. Cross-Student Privacy
    const stBDash = await axios.get(`${API_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    if (stBDash.data.dashboard.recentSubmissions.length !== 0) throw new Error('Student B sees Student A submissions');
    if (stBDash.data.dashboard.stats.totalSubmissions !== 0) throw new Error('Student B stats inflated by A');
    console.log('✅ PASSED: Cross-student privacy');

    // 6. RBAC Tests
    try {
      await axios.get(`${API_URL}/faculty/dashboard`, { headers: { Authorization: `Bearer ${studentAToken}` } });
      throw new Error('Student accessed faculty dash');
    } catch (e: any) {
      if (e.response?.status !== 403) throw new Error('Not 403 for student accessing faculty');
    }

    try {
      await axios.get(`${API_URL}/student/dashboard`, { headers: { Authorization: `Bearer ${facultyToken}` } });
      throw new Error('Faculty accessed student dash');
    } catch (e: any) {
      if (e.response?.status !== 403) throw new Error('Not 403 for faculty accessing student');
    }
    console.log('✅ PASSED: Dashboard Role-Based Access Control (RBAC)');

    console.log('✅ ALL PHASE 11 TESTS PASSED');
  } catch (e: any) {
    console.error('❌ FAILED:', e.response?.data || e.message);
    process.exit(1);
  }
};

setup().then(runTests).catch(console.error);
