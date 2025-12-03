import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create modules
  const modules = [
    {
      name: 'menu',
      displayName: 'Menu',
      description: 'Xem menu nhà hàng',
      icon: '🍽️',
      route: '/menu',
      isPublic: false,
    },
    {
      name: 'floor-plan',
      displayName: 'Sơ Đồ Phòng',
      description: 'Xem sơ đồ phòng khách sạn',
      icon: '🗺️',
      route: '/floor-plan',
      isPublic: false,
    },
    {
      name: 'services',
      displayName: 'Dịch Vụ',
      description: 'Xem các dịch vụ khách sạn',
      icon: '🏊',
      route: '/services',
      isPublic: false,
    },
    {
      name: 'information',
      displayName: 'Thông Tin Cần Biết',
      description: 'WiFi, phone, TV channels, etc.',
      icon: 'ℹ️',
      route: '/information',
      isPublic: false,
    },
    {
      name: 'technical',
      displayName: 'Tài Liệu Kỹ Thuật',
      description: 'Tài liệu kỹ thuật cho nhân viên',
      icon: '📋',
      route: '/technical',
      isPublic: false,
    },
  ];

  for (const module of modules) {
    await prisma.module.upsert({
      where: { name: module.name },
      update: {},
      create: module,
    });
  }

  // Create QR codes
  const guestQR = await prisma.qRCode.upsert({
    where: { token: 'guest-2024' },
    update: {},
    create: {
      name: 'Guest QR Code',
      token: 'guest-2024',
      description: 'QR code cho khách hàng',
      type: 'guest',
      isActive: true,
    },
  });

  const staffQR = await prisma.qRCode.upsert({
    where: { token: 'staff-2024' },
    update: {},
    create: {
      name: 'Staff QR Code',
      token: 'staff-2024',
      description: 'QR code cho nhân viên',
      type: 'staff',
      isActive: true,
    },
  });

  // Assign modules to guest QR
  const guestModules = ['menu', 'floor-plan', 'services', 'information'];
  for (const moduleName of guestModules) {
    const module = await prisma.module.findUnique({ where: { name: moduleName } });
    if (module) {
      await prisma.qRModule.upsert({
        where: {
          qrCodeId_moduleId: {
            qrCodeId: guestQR.id,
            moduleId: module.id,
          },
        },
        update: {},
        create: {
          qrCodeId: guestQR.id,
          moduleId: module.id,
        },
      });
    }
  }

  // Assign all modules to staff QR
  const allModules = await prisma.module.findMany();
  for (const module of allModules) {
    await prisma.qRModule.upsert({
      where: {
        qrCodeId_moduleId: {
          qrCodeId: staffQR.id,
          moduleId: module.id,
        },
      },
      update: {},
      create: {
        qrCodeId: staffQR.id,
        moduleId: module.id,
      },
    });
  }

  // Create sample information
  const informationItems = [
    {
      category: 'wifi',
      title: 'WiFi Password',
      content: 'Password: Resort2024!',
      icon: '📶',
      order: 1,
    },
    {
      category: 'phone',
      title: 'Phone Guide',
      content: 'Lobby: 100\nRoom Service: 101\nReception: 102',
      icon: '📞',
      order: 2,
    },
    {
      category: 'tv',
      title: 'SCTV Channel List',
      content: 'Channel 1: VTV1\nChannel 2: VTV3\nChannel 3: HTV7\nChannel 4: Discovery',
      icon: '📺',
      order: 3,
    },
    {
      category: 'room-info',
      title: 'Room Information',
      content: 'Check-in: 14:00\nCheck-out: 12:00\nHousekeeping: 08:00-18:00',
      icon: '🏨',
      order: 4,
    },
  ];

  // Delete existing information and create new ones
  await prisma.information.deleteMany({});
  for (const info of informationItems) {
    await prisma.information.create({
      data: info,
    });
  }

  // Create sample services
  const services = [
    {
      name: 'Gym & Fitness',
      type: 'gym',
      description: 'Phòng gym hiện đại với đầy đủ thiết bị',
      images: [], // Array of image URLs
      hours: '06:00 - 22:00',
      location: 'Tầng 2',
    },
    {
      name: 'Bar & Lounge',
      type: 'bar',
      description: 'Bar sang trọng với view đẹp',
      images: [],
      hours: '17:00 - 24:00',
      location: 'Tầng 1',
    },
    {
      name: 'Business Center',
      type: 'business-center',
      description: 'Không gian làm việc chuyên nghiệp',
      images: [],
      hours: '24/7',
      location: 'Tầng 1',
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        id: service.type,
      },
      update: {},
      create: service,
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

