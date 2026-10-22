import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- PHASE 15 FINAL VERIFICATION TESTS ---');

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
    // 1. Server Health
    let healthOk = false;
    try {
      await axios.get(`${API_URL}/non-existent-route`);
    } catch (e: any) {
      healthOk = e.response?.status === 404;
    }
    assert(healthOk, '1. Server health is OK (handles 404 correctly)');

    // 2. Authentication & Security Headers
    let securityHeadersOk = false;
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'bad@example.com',
        password: 'bad'
      });
    } catch (e: any) {
      const headers = e.response?.headers;
      if (headers && headers['x-content-type-options']) {
        securityHeadersOk = true;
      }
    }
    assert(securityHeadersOk, '14. Security headers (Helmet) exist');

    const facultyRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'faculty@example.com',
      password: 'password123'
    });
    const facultyToken = facultyRes.data.token;
    assert(!!facultyToken, '2. Authentication works');
    assert(!facultyRes.data.user.passwordHash, '16. Sensitive fields remain absent from responses');

    const studentRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123'
    });
    const studentToken = studentRes.data.token;

    // 3. RBAC Works
    try {
      await axios.post(`${API_URL}/faculty/labs`, { title: 'hax', description: 'hax', constraints: 'hax', sampleInput: 'hax', sampleOutput: 'hax', difficulty: 'EASY', supportedLanguages: 'Python' }, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert(false, '3. RBAC works (Student accessing Faculty API)');
    } catch (e: any) {
      assert(e.response?.status === 403, '3. RBAC works');
    }

    // 4. Dashboards
    const facDash = await axios.get(`${API_URL}/faculty/dashboard`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    assert(facDash.status === 200, '5. Faculty dashboard works');
    const stuDash = await axios.get(`${API_URL}/student/dashboard`, { headers: { Authorization: `Bearer ${studentToken}` } });
    assert(stuDash.status === 200, '4. Student dashboard works');

    // 17. Database-backed retrieval
    assert(Array.isArray(stuDash.data.dashboard.labs), '17. Database-backed data retrieval works');

    // 15. Rate Limiting Check (global / auth)
    let rateLimited = false;
    for(let i=0; i<15; i++) {
      try {
        await axios.post(`${API_URL}/auth/login`, { email: 'bad@example.com', password: 'bad' });
      } catch(e: any) {
        if (e.response?.status === 429) {
          rateLimited = true;
          break;
        }
      }
    }
    assert(rateLimited, '15. Rate limiting remains configured');

  } catch (err: any) {
    console.error('Test script crashed:', err.message);
  }

  console.log(`\nPhase 15 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
