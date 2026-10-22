const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get student credentials
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) {
    console.log('No student found');
    return;
  }
  
  // Find a topic ID
  const topics = await prisma.topic.findMany({
      where: {
        labs: { some: { published: true, assignments: { some: { studentId: student.id } } } }
      },
  });
  const topicId = topics[0].id;
  
  // Login to get token
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: student.email,
      password: 'password123' // assuming default test password
    });
    
    const token = loginRes.data.token;
    
    console.log('Token acquired. Testing getLabsByTopic...');
    
    try {
      const labsRes = await axios.get(`http://localhost:3000/api/student/topics/${topicId}/labs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response Status:', labsRes.status);
      console.log('Response Data:', JSON.stringify(labsRes.data, null, 2));
    } catch (err) {
      console.log('API Error Status:', err.response?.status);
      console.log('API Error Data:', JSON.stringify(err.response?.data, null, 2));
    }
  } catch (err) {
    console.log('Login failed', err.response?.data || err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
