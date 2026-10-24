import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const devPasswordHash = await argon2.hash('password123', { type: argon2.argon2id });

  // 1. Create Admin
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${admin.name} (${admin.email})`);

  // 2. Create Faculty
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      name: 'Dr. Jane Smith',
      email: 'faculty@example.com',
      registerNumber: 'FAC001',
      passwordHash: devPasswordHash,
      role: 'FACULTY',
      department: 'Computer Science',
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'faculty2@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      name: 'Dr. Robert Wilson',
      email: 'faculty2@example.com',
      registerNumber: 'FAC002',
      passwordHash: devPasswordHash,
      role: 'FACULTY',
      department: 'Computer Science',
    },
  });

  // 3. Create Students (5 students with passwords set to their last 7 chars)
  const passStudent1 = await argon2.hash('23CS001');
  const passStudent2 = await argon2.hash('23CS002');
  const passStudent3 = await argon2.hash('23CS003');
  const passStudent4 = await argon2.hash('23CS004');
  const passStudent5 = await argon2.hash('23CS005');

  const student1 = await prisma.user.upsert({
    where: { registerNumber: '8115U23CS001' },
    update: { passwordHash: passStudent1 },
    create: {
      name: 'Alice Johnson',
      email: '8115u23cs001@student.example.com',
      registerNumber: '8115U23CS001',
      passwordHash: passStudent1,
      role: 'STUDENT',
      department: 'Computer Science',
      year: 2,
      section: 'A',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { registerNumber: '8115U23CS002' },
    update: { passwordHash: passStudent2 },
    create: {
      name: 'Bob Williams',
      email: '8115u23cs002@student.example.com',
      registerNumber: '8115U23CS002',
      passwordHash: passStudent2,
      role: 'STUDENT',
      department: 'Computer Science',
      year: 2,
      section: 'A',
    },
  });

  const student3 = await prisma.user.upsert({
    where: { registerNumber: '8115U23CS003' },
    update: { passwordHash: passStudent3 },
    create: {
      name: 'Aron Jonath AN',
      email: '8115u23cs003@student.example.com',
      registerNumber: '8115U23CS003',
      passwordHash: passStudent3,
      role: 'STUDENT',
      department: 'Computer Science',
      year: 2,
      section: 'A',
    },
  });

  const student4 = await prisma.user.upsert({
    where: { registerNumber: '8115U23CS004' },
    update: { passwordHash: passStudent4 },
    create: {
      name: 'Charlie Davis',
      email: '8115u23cs004@student.example.com',
      registerNumber: '8115U23CS004',
      passwordHash: passStudent4,
      role: 'STUDENT',
      department: 'Computer Science',
      year: 2,
      section: 'A',
    },
  });

  const student5 = await prisma.user.upsert({
    where: { registerNumber: '8115U23CS005' },
    update: { passwordHash: passStudent5 },
    create: {
      name: 'David Miller',
      email: '8115u23cs005@student.example.com',
      registerNumber: '8115U23CS005',
      passwordHash: passStudent5,
      role: 'STUDENT',
      department: 'Computer Science',
      year: 2,
      section: 'A',
    },
  });

  console.log('1 Admin, 2 Faculty, and 5 Students created/updated.');

  // 2. Create Lab
  const lab = await prisma.lab.upsert({
    // Using a dummy title as a unique constraint is difficult since title isn't @unique
    // So we just findFirst to see if it exists, or clear it out.
    // Better yet, use a fixed UUID for upsert if possible, or just a unique title in our mock logic.
    where: { id: 'dev-lab-1' },
    update: {},
    create: {
      id: 'dev-lab-1',
      title: 'Introduction to Arrays',
      description: 'Write a program to find the maximum element in an array.',
      constraints: '1 <= N <= 1000\n-10^9 <= A[i] <= 10^9',
      sampleInput: '5\n10 20 5 30 15',
      sampleOutput: '30',
      difficulty: 'EASY',
      supportedLanguages: 'C,C++,Java,Python',
      published: true,
      createdById: faculty.id,
    },
  });

  console.log('Lab created/updated.');

  // 3. Create Test Cases
  const testCase1 = await prisma.testCase.upsert({
    where: { id: 'dev-test-1' },
    update: {},
    create: {
      id: 'dev-test-1',
      labId: lab.id,
      input: '5\n10 20 5 30 15',
      expectedOutput: '30',
      visibility: 'PUBLIC',
    },
  });

  const testCase2 = await prisma.testCase.upsert({
    where: { id: 'dev-test-2' },
    update: {},
    create: {
      id: 'dev-test-2',
      labId: lab.id,
      input: '3\n-10 -5 -20',
      expectedOutput: '-5',
      visibility: 'HIDDEN',
    },
  });

  console.log('Test Cases created/updated.');

  // 4. Create Lab Assignments
  await prisma.labAssignment.upsert({
    where: { studentId_labId: { studentId: student1.id, labId: lab.id } },
    update: {},
    create: {
      studentId: student1.id,
      labId: lab.id,
    },
  });

  await prisma.labAssignment.upsert({
    where: { studentId_labId: { studentId: student2.id, labId: lab.id } },
    update: {},
    create: {
      studentId: student2.id,
      labId: lab.id,
    },
  });

  console.log('Lab Assignments created/updated.');

  // 5. Create Submission
  const submission = await prisma.submission.upsert({
    where: { id: 'dev-sub-1' },
    update: {},
    create: {
      id: 'dev-sub-1',
      studentId: student1.id,
      labId: lab.id,
      language: 'Python',
      sourceCode: 'def main():\n    n = int(input())\n    arr = list(map(int, input().split()))\n    print(max(arr))\n\nif __name__ == "__main__":\n    main()',
      status: 'ACCEPTED',
      executionTime: 45.2,
      memoryUsage: 12.5,
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
    },
  });

  console.log('Submission created/updated.');

  // 6. Create Submission Test Results
  await prisma.submissionTestResult.upsert({
    where: { submissionId_testCaseId: { submissionId: submission.id, testCaseId: testCase1.id } },
    update: {},
    create: {
      submissionId: submission.id,
      testCaseId: testCase1.id,
      passed: true,
      executionTime: 22.1,
      status: 'PASSED',
    },
  });

  await prisma.submissionTestResult.upsert({
    where: { submissionId_testCaseId: { submissionId: submission.id, testCaseId: testCase2.id } },
    update: {},
    create: {
      submissionId: submission.id,
      testCaseId: testCase2.id,
      passed: true,
      executionTime: 23.1,
      status: 'PASSED',
    },
  });

  console.log('Submission Test Results created/updated.');

  // 7. Create AI Feedback (example for a WRONG_ANSWER scenario, although this submission was ACCEPTED for demo)
  await prisma.aIFeedback.upsert({
    where: { id: 'dev-ai-1' },
    update: {},
    create: {
      id: 'dev-ai-1',
      submissionId: submission.id,
      errorType: 'WRONG_ANSWER',
      explanation: 'Your approach works for many normal cases, but there may be an issue with the initial value used for comparison.',
      hint: 'Consider what happens if every input value is negative.',
      conceptsToReview: JSON.stringify(['Boundary conditions', 'Variable initialization']),
      nextSteps: JSON.stringify(['Test your program with negative values.', 'Check whether your initial maximum value is valid for every possible input.']),
    },
  });

  console.log('AI Feedback created/updated.');
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
