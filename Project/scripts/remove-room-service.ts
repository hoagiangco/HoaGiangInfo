import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing room-service module...');

  // Find room-service module
  const roomServiceModule = await prisma.module.findUnique({
    where: { name: 'room-service' },
  });

  if (roomServiceModule) {
    // First, remove all QRModule associations
    await prisma.qRModule.deleteMany({
      where: { moduleId: roomServiceModule.id },
    });

    // Then delete the module
    await prisma.module.delete({
      where: { id: roomServiceModule.id },
    });

    console.log('✅ room-service module removed successfully');
  } else {
    console.log('ℹ️  room-service module not found in database');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






