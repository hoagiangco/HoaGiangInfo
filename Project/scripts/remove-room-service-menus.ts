import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing room-service menus...');

  // Find all menus with hotel-related names
  // Note: Menu model doesn't have category field, only MenuItem has category
  const roomServiceMenus = await prisma.menu.findMany({
    where: {
      OR: [
        { name: { contains: 'khách sạn', mode: 'insensitive' } },
        { name: { contains: 'hotel', mode: 'insensitive' } },
        { name: { contains: 'room service', mode: 'insensitive' } },
        { name: { contains: 'room-service', mode: 'insensitive' } },
      ],
    },
    include: {
      items: true,
    },
  });

  if (roomServiceMenus.length === 0) {
    console.log('ℹ️  No room-service menus found');
    return;
  }

  console.log(`Found ${roomServiceMenus.length} menu(s) to delete:`);
  roomServiceMenus.forEach((menu) => {
    console.log(`- ${menu.name} - ${menu.items.length} items`);
  });

  // Delete all room-service menus (items will be cascade deleted)
  for (const menu of roomServiceMenus) {
    await prisma.menu.delete({
      where: { id: menu.id },
    });
    console.log(`✅ Deleted menu: ${menu.name}`);
  }

  console.log(`\n✅ Successfully removed ${roomServiceMenus.length} menu(s)`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






