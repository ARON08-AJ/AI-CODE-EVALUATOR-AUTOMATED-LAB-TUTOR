import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API = 'http://localhost:3000/api';
const prisma = new PrismaClient();

async function runTest() {
  console.log('--- FINAL END-TO-END TEST ---');
  
  try {
    // 1. Faculty Login
    const fRes = await axios.post(`${API}/auth/login`, {
      email: 'faculty@example.com',
      password: 'password123'
    });
    const fToken = fRes.data.token;
    console.log('✅ Faculty Login Successful');

    // 2. Create Lab
    const timestamp = Date.now();
    const labTitle = `FINAL UI DB TEST ${timestamp}`;
    const labRes = await axios.post(`${API}/faculty/labs`, {
      title: labTitle,
      description: 'Test lab for DB persistence.',
      constraints: 'N/A',
      sampleInput: '1\n2',
      sampleOutput: '3',
      difficulty: 'EASY',
      supportedLanguages: 'C, C++, Python, Java'
    }, { headers: { Authorization: `Bearer ${fToken}` } });
    
    const labId = labRes.data.lab.id;
    console.log(`✅ Lab Created: ${labTitle} (ID: ${labId})`);

    // 3. Add Tests
    await axios.post(`${API}/faculty/labs/${labId}/test-cases`, {
      input: '1\n2',
      expectedOutput: '3',
      visibility: 'PUBLIC'
    }, { headers: { Authorization: `Bearer ${fToken}` } });
    
    await axios.post(`${API}/faculty/labs/${labId}/test-cases`, {
      input: '5\n5',
      expectedOutput: '10',
      visibility: 'HIDDEN'
    }, { headers: { Authorization: `Bearer ${fToken}` } });
    console.log('✅ Test Cases Added');

    // 4. Publish
    await axios.patch(`${API}/faculty/labs/${labId}/publish`, {
      isPublished: true
    }, { headers: { Authorization: `Bearer ${fToken}` } });
    console.log('✅ Lab Published');

    // 5. Get Alice's ID and Assign
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    await axios.post(`${API}/faculty/labs/${labId}/assign`, {
      studentIds: [alice!.id]
    }, { headers: { Authorization: `Bearer ${fToken}` } });
    console.log('✅ Lab Assigned to Alice');

    // 6. Student Login
    const sRes = await axios.post(`${API}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123'
    });
    const sToken = sRes.data.token;
    console.log('✅ Student Login Successful');

    // 7. Student Checks Dashboard
    const dashRes = await axios.get(`${API}/student/dashboard`, {
      headers: { Authorization: `Bearer ${sToken}` }
    });
    const foundLab = dashRes.data.dashboard.labs.find((l: any) => l.id === labId);
    if (!foundLab) {
      console.log(JSON.stringify(dashRes.data, null, 2));
      throw new Error('Lab not found in Student Dashboard');
    }
    console.log('✅ Student sees assigned lab on Dashboard');

    // 8. Student Submits Failing Code
    const badCode = `
# Python
import sys
for line in sys.stdin:
    print("Wrong")
`;
    const submitRes = await axios.post(`${API}/student/labs/${labId}/submit`, {
      language: 'Python',
      sourceCode: badCode
    }, { headers: { Authorization: `Bearer ${sToken}` } });
    
    console.log(`✅ Student Submission evaluated as: ${submitRes.data.evaluation.status}`);
    const submissionId = submitRes.data.evaluation.submissionId;

    // 9. Student Requests AI Hint
    const hintRes = await axios.post(`${API}/student/submissions/${submissionId}/hint`, {}, {
      headers: { Authorization: `Bearer ${sToken}` }
    });
    
    console.log('✅ AI Hint Generated Successfully:');
    console.log(JSON.stringify(hintRes.data, null, 2));

    // 10. Request AI Hint Again (Verify Persistence)
    const hintRes2 = await axios.post(`${API}/student/submissions/${submissionId}/hint`, {}, {
      headers: { Authorization: `Bearer ${sToken}` }
    });
    
    if (hintRes.data.feedback.id !== hintRes2.data.feedback.id) {
      throw new Error('AI Feedback was not persisted/reused correctly!');
    }
    console.log('✅ AI Feedback correctly persisted and reused on subsequent requests.');

    // 11. Faculty verifies activity
    const fDashRes = await axios.get(`${API}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${fToken}` }
    });
    const recentActivity = fDashRes.data.dashboard.recentSubmissions;
    const hasActivity = recentActivity.some((a: any) => a.id === submissionId);
    if (!hasActivity) throw new Error('Activity not found in Faculty Dashboard');
    console.log('✅ Faculty Dashboard shows the recent submission activity');

    console.log('\n🎉 ALL E2E UI AND CONNECTIVITY TESTS PASSED 🎉');

  } catch (err: any) {
    console.error('❌ E2E TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
