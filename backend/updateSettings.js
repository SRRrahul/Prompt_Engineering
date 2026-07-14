const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: { questionsPerExam: 1 },
    create: { id: 'singleton', questionsPerExam: 1, timerDurationMinutes: 60, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 }
  });
  console.log('Settings updated!');
  await prisma.$disconnect();
}
run().catch(console.error);
