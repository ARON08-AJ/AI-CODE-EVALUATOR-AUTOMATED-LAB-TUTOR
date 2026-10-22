const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) return console.log('No student');
  console.log('Student ID:', student.id);
  
  const topics = await prisma.topic.findMany({
      where: {
        labs: {
          some: {
            published: true,
            assignments: {
              some: { studentId: student.id }
            }
          }
        }
      },
  });
  console.log('Topics count:', topics.length);
  if (topics.length > 0) {
      const topicId = topics[0].id;
      console.log('Topic ID:', topicId);
      const topic = await prisma.topic.findUnique({ where: { id: topicId } });
      console.log('Unique Topic:', topic);
      try {
        const labs = await prisma.lab.findMany({
          where: { 
            topicId,
            published: true,
            assignments: {
              some: {
                studentId: student.id
              }
            }
          }
        });
        console.log('Labs:', labs.length);
      } catch (err) {
        console.error('Error fetching labs:', err);
      }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
