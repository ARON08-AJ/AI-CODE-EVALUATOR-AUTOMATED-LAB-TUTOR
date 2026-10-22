import axios from 'axios';
import { config } from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt.util';

config({ path: path.join(__dirname, '.env') });
const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Phase 8 Test Script ---');

  // 1. Setup Student & Faculty
  const uniqueSuffix = Date.now().toString();
  const facultyEmail = `faculty8_${uniqueSuffix}@example.com`;
  const studentEmail = `student8_${uniqueSuffix}@example.com`;
  const studentPassword = 'password123';

  const facultyUser = await prisma.user.create({
    data: {
      name: 'Faculty 8',
      email: facultyEmail,
      passwordHash: 'dummy',
      role: 'FACULTY'
    }
  });
  const facultyToken = generateToken({ id: facultyUser.id, role: facultyUser.role });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Student 8',
      email: studentEmail,
      passwordHash: 'dummy',
      registerNumber: 'S8' + uniqueSuffix,
      role: 'STUDENT'
    }
  });
  const studentToken = generateToken({ id: studentUser.id, role: studentUser.role });
  const studentId = studentUser.id;

  // 2. Create and publish a lab
  const lab = await prisma.lab.create({
    data: {
      title: 'Phase 8 Test Lab',
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

  await prisma.labAssignment.create({
    data: {
      labId,
      studentId
    }
  });

  console.log('✅ Setup Complete');

  const runCode = async (language: string, sourceCode: string, input: string = '') => {
    try {
      const res = await axios.post(`${API_URL}/student/labs/${labId}/run`, {
        language,
        sourceCode,
        input
      }, { headers: { Authorization: `Bearer ${studentToken}` } });
      return { status: res.status, data: res.data };
    } catch (err: any) {
      return { status: err.response?.status, data: err.response?.data };
    }
  };

  // TEST 1 — C
  const test1 = await runCode('C', `
    #include <stdio.h>
    int main() {
        printf("Hello C\\n");
        return 0;
    }
  `);
  if (test1.data?.result?.status === 'SUCCESS' && test1.data.result.stdout.includes('Hello C')) {
    console.log('✅ PASSED: TEST 1 — C');
  } else {
    console.error('❌ FAILED: TEST 1 — C', test1.data);
  }

  // TEST 2 — C++
  const test2 = await runCode('C++', `
    #include <iostream>
    using namespace std;
    int main() {
        cout << "Hello C++" << endl;
        return 0;
    }
  `);
  if (test2.data?.result?.status === 'SUCCESS' && test2.data.result.stdout.includes('Hello C++')) {
    console.log('✅ PASSED: TEST 2 — C++');
  } else {
    console.error('❌ FAILED: TEST 2 — C++', test2.data);
  }

  // TEST 3 — Java
  const test3 = await runCode('Java', `
    public class Main {
        public static void main(String[] args) {
            System.out.println("Hello Java");
        }
    }
  `);
  if (test3.data?.result?.status === 'SUCCESS' && test3.data.result.stdout.includes('Hello Java')) {
    console.log('✅ PASSED: TEST 3 — Java');
  } else {
    console.error('❌ FAILED: TEST 3 — Java', test3.data);
  }

  // TEST 4 — Python
  const test4 = await runCode('Python', `print("Hello Python")`);
  if (test4.data?.result?.status === 'SUCCESS' && test4.data.result.stdout.includes('Hello Python')) {
    console.log('✅ PASSED: TEST 4 — Python');
  } else {
    console.error('❌ FAILED: TEST 4 — Python', test4.data);
  }

  // TEST 5 — stdin
  const test5 = await runCode('C++', `
    #include <iostream>
    using namespace std;
    int main() {
        int n;
        cin >> n;
        cout << n * 2 << endl;
        return 0;
    }
  `, "21");
  if (test5.data?.result?.status === 'SUCCESS' && test5.data.result.stdout.includes('42')) {
    console.log('✅ PASSED: TEST 5 — stdin');
  } else {
    console.error('❌ FAILED: TEST 5 — stdin', test5.data);
  }

  // TEST 6 — compilation error
  const test6 = await runCode('C++', `
    #include <iostream>
    int main() {
        this is invalid;
    }
  `);
  if (test6.data?.result?.status === 'COMPILATION_ERROR') {
    console.log('✅ PASSED: TEST 6 — compilation error');
  } else {
    console.error('❌ FAILED: TEST 6 — compilation error', test6.data);
  }

  // TEST 7 — runtime error
  const test7 = await runCode('Python', `
x = 1 / 0
print(x)
  `);
  if (test7.data?.result?.status === 'RUNTIME_ERROR') {
    console.log('✅ PASSED: TEST 7 — runtime error');
  } else {
    console.error('❌ FAILED: TEST 7 — runtime error', test7.data);
  }

  // TEST 8 — infinite loop
  const test8 = await runCode('Python', `
while True:
    pass
  `);
  if (test8.data?.result?.status === 'TIME_LIMIT_EXCEEDED') {
    console.log('✅ PASSED: TEST 8 — infinite loop');
  } else {
    console.error('❌ FAILED: TEST 8 — infinite loop', test8.data);
  }

  // TEST 9 — excessive output
  const test9 = await runCode('Python', `
while True:
    print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
  `);
  if (test9.data?.result?.status === 'OUTPUT_LIMIT_EXCEEDED') {
    console.log('✅ PASSED: TEST 9 — excessive output');
  } else {
    console.error('❌ FAILED: TEST 9 — excessive output', test9.data);
  }

  // TEST 10 — unauthorized student
  try {
    const res = await axios.post(`${API_URL}/student/labs/${labId}/run`, {
        language: 'Python',
        sourceCode: 'print(1)'
      }, { headers: { Authorization: `Bearer ${facultyToken}` } });
      console.error('❌ FAILED: TEST 10 — unauthorized student (faculty token worked)');
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log('✅ PASSED: TEST 10 — unauthorized student');
    } else {
      console.error('❌ FAILED: TEST 10 — unauthorized student (wrong error)', err.response?.status);
    }
  }

  // TEST 11 — unassigned lab
  await prisma.labAssignment.deleteMany({
    where: { labId, studentId }
  });

  const test11 = await runCode('Python', `print("hello")`);
  if (test11.status === 404) {
    console.log('✅ PASSED: TEST 11 — unassigned lab');
  } else {
    console.error('❌ FAILED: TEST 11 — unassigned lab', test11.status);
  }

  // TEST 12 — unpublished lab
  await prisma.labAssignment.create({
    data: {
      labId,
      studentId
    }
  });

  await prisma.lab.update({
    where: { id: labId },
    data: { published: false }
  });

  const test12 = await runCode('Python', `print("hello")`);
  if (test12.status === 404) {
    console.log('✅ PASSED: TEST 12 — unpublished lab');
  } else {
    console.error('❌ FAILED: TEST 12 — unpublished lab', test12.status);
  }

  console.log('✅ ALL PHASE 8 INTEGRATION TESTS EXECUTED');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
