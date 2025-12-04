import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for room-service menus...');

  // Find all menus with category "room-service"
  const roomServiceMenus = await prisma.menu.findMany({
    where: {
      OR: [
        { category: 'room-service' },
        { name: { contains: 'khách sạn', mode: 'insensitive' } },
        { name: { contains: 'hotel', mode: 'insensitive' } },
        { name: { contains: 'room service', mode: 'insensitive' } },
      ],
    },
  });

  if (roomServiceMenus.length > 0) {
    console.log(`\nFound ${roomServiceMenus.length} menu(s) with room-service category or hotel-related names:`);
    roomServiceMenus.forEach((menu) => {
      console.log(`- ID: ${menu.id}`);
      console.log(`  Name: ${menu.name}`);
      console.log(`  Category: ${menu.category}`);
      console.log(`  Description: ${menu.description || 'N/A'}`);
      console.log('');
    });

    console.log('\nDo you want to delete these menus? (This will also delete all menu items)');
    console.log('Run: npm run cleanup:room-service-menus');
  } else {
    console.log('✅ No room-service menus found');
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






