import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- Cleaning up test artifacts ---');
  // Find all labs created by test scripts (they usually have 'Test Lab' or similar names, or were created today)
  // Let's only delete labs starting with "Test " or "TEMP" or "FINAL UI"
  
  const testLabs = await prisma.lab.findMany({
    where: {
      OR: [
        { title: { startsWith: 'Test ' } },
        { title: { startsWith: 'TEMP ' } },
        { title: { startsWith: 'FINAL UI ' } },
        { title: { startsWith: 'Hidden ' } },
        { title: { startsWith: 'No Tests ' } },
        { title: { startsWith: 'Updated ' } }
      ]
    }
  });

  const labIds = testLabs.map(l => l.id);
  console.log(`Found ${labIds.length} test labs to delete.`);

  if (labIds.length > 0) {
    // Delete AIFeedback related to these labs (through submissions)
    const submissions = await prisma.submission.findMany({
      where: { labId: { in: labIds } }
    });
    const subIds = submissions.map(s => s.id);
    
    await prisma.aIFeedback.deleteMany({
      where: { submissionId: { in: subIds } }
    });
    
    // Delete TestResults
    await prisma.testResult.deleteMany({
      where: { submissionId: { in: subIds } }
    });

    // Delete Submissions
    await prisma.submission.deleteMany({
      where: { labId: { in: labIds } }
    });

    // Delete Assignments
    await prisma.assignment.deleteMany({
      where: { labId: { in: labIds } }
    });

    // Delete TestCases
    await prisma.testCase.deleteMany({
      where: { labId: { in: labIds } }
    });

    // Delete Labs
    await prisma.lab.deleteMany({
      where: { id: { in: labIds } }
    });
  }

  // Find test students (emails starting with test or fake)
  const testUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: 'alice@example.com' } },
        { email: { not: 'faculty@example.com' } }
      ]
    }
  });

  if (testUsers.length > 0) {
    console.log(`Found ${testUsers.length} test users to delete.`);
    const userIds = testUsers.map(u => u.id);
    await prisma.aIFeedback.deleteMany({
      where: { submission: { studentId: { in: userIds } } }
    });
    await prisma.testResult.deleteMany({
      where: { submission: { studentId: { in: userIds } } }
    });
    await prisma.submission.deleteMany({
      where: { studentId: { in: userIds } }
    });
    await prisma.assignment.deleteMany({
      where: { studentId: { in: userIds } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
  }

  console.log('Cleanup complete.');
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
