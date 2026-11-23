import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_FOOTER_CONFIG, FOOTER_SETTING_KEY } from '../lib/footer-config';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create modules with full VI / EN / ZH translations
  const modules = [
    {
      name: 'menu',
      displayName: 'Thực Đơn',
      description: 'Xem thực đơn nhà hàng & bar',
      translations: {
        en: {
          displayName: 'Dining Menu',
          description: 'Explore our restaurant & bar menus',
        },
        zh: {
          displayName: '餐厅菜单',
          description: '浏览餐厅与酒吧精选菜单',
        },
      },
      icon: '🍽️',
      route: '/menu',
      isPublic: false,
    },
    {
      name: 'floor-plan',
      displayName: 'Sơ Đồ Phòng',
      description: 'Xem sơ đồ phòng và khuôn viên khu nghỉ dưỡng',
      translations: {
        en: {
          displayName: 'Floor Plan',
          description: 'View hotel room layouts and resort map',
        },
        zh: {
          displayName: '楼层平面图',
          description: '查看酒店客房分布与度假村平面图',
        },
      },
      icon: '🗺️',
      route: '/floor-plan',
      isPublic: false,
    },
    {
      name: 'services',
      displayName: 'Dịch Vụ',
      description: 'Xem các dịch vụ và tiện ích khách sạn',
      translations: {
        en: {
          displayName: 'Services',
          description: 'Explore hotel amenities and resort facilities',
        },
        zh: {
          displayName: '设施服务',
          description: '探索酒店康体设施与尊享配套服务',
        },
      },
      icon: '🏊',
      route: '/services',
      isPublic: false,
    },
    {
      name: 'information',
      displayName: 'Thông Tin Cần Biết',
      description: 'Mật khẩu WiFi, điện thoại nội bộ, kênh truyền hình và quy định lưu trú',
      translations: {
        en: {
          displayName: 'Guest Information',
          description: 'Wi-Fi password, phone guide, TV channels, and stay information',
        },
        zh: {
          displayName: '入住指南',
          description: 'Wi-Fi 密码、内线电话指南、电视频道列表及入住须知',
        },
      },
      icon: 'ℹ️',
      route: '/information',
      isPublic: false,
    },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod.name },
      update: {
        translations: mod.translations,
      },
      create: mod,
    });
  }

  // Create QR codes with clean 'guest' token
  const guestQR = await prisma.qRCode.upsert({
    where: { token: 'guest' },
    update: { isActive: true },
    create: {
      name: 'Guest QR Code',
      token: 'guest',
      description: 'QR code chính cho khách hàng',
      type: 'guest',
      isActive: true,
    },
  });

  // Assign modules to guest QR
  const guestModules = ['menu', 'floor-plan', 'services', 'information'];
  for (const moduleName of guestModules) {
    const mod = await prisma.module.findUnique({ where: { name: moduleName } });
    if (mod) {
      await prisma.qRModule.upsert({
        where: {
          qrCodeId_moduleId: {
            qrCodeId: guestQR.id,
            moduleId: mod.id,
          },
        },
        update: {},
        create: {
          qrCodeId: guestQR.id,
          moduleId: mod.id,
        },
      });
    }
  }

  // Create sample information with full VI / EN / ZH translations
  const informationItems = [
    {
      category: 'wifi',
      title: 'Mật khẩu WiFi',
      content: '<p>Mạng WiFi: <strong>HoaBinhResort</strong></p><p>Mật khẩu: <strong>Resort2024!</strong></p>',
      translations: {
        en: {
          title: 'Wi-Fi Password',
          content: '<p>Network: <strong>HoaBinhResort</strong></p><p>Password: <strong>Resort2024!</strong></p>',
        },
        zh: {
          title: 'Wi-Fi 无线网络密码',
          content: '<p>网络名称：<strong>HoaBinhResort</strong></p><p>密码：<strong>Resort2024!</strong></p>',
        },
      },
      icon: '📶',
      order: 1,
    },
    {
      category: 'phone',
      title: 'Hướng dẫn điện thoại nội bộ',
      content: '<p>Lễ tân: <strong>100</strong><br/>Dịch vụ phòng: <strong>101</strong><br/>Chăm sóc khách hàng: <strong>102</strong></p>',
      translations: {
        en: {
          title: 'Telephone Directory',
          content: '<p>Front Desk: <strong>100</strong><br/>Room Service: <strong>101</strong><br/>Guest Relations: <strong>102</strong></p>',
        },
        zh: {
          title: '内线电话指南',
          content: '<p>前台：<strong>100</strong><br/>客房服务：<strong>101</strong><br/>宾客服务中心：<strong>102</strong></p>',
        },
      },
      icon: '📞',
      order: 2,
    },
    {
      category: 'tv',
      title: 'Danh sách kênh truyền hình',
      content: '<p>Kênh 1: VTV1<br/>Kênh 2: VTV3<br/>Kênh 3: HTV7<br/>Kênh 4: Discovery</p>',
      translations: {
        en: {
          title: 'TV Channel List',
          content: '<p>Channel 1: VTV1<br/>Channel 2: VTV3<br/>Channel 3: HTV7<br/>Channel 4: Discovery</p>',
        },
        zh: {
          title: '电视频道列表',
          content: '<p>频道 1：VTV1<br/>频道 2：VTV3<br/>频道 3：HTV7<br/>频道 4：Discovery 探索频道</p>',
        },
      },
      icon: '📺',
      order: 3,
    },
    {
      category: 'room-info',
      title: 'Thông tin lưu trú & phòng nghỉ',
      content: '<p>Nhận phòng: <strong>14:00</strong><br/>Trả phòng: <strong>12:00</strong><br/>Dọn phòng: <strong>08:00 - 18:00</strong></p>',
      translations: {
        en: {
          title: 'Room & Stay Information',
          content: '<p>Check-in: <strong>14:00</strong><br/>Check-out: <strong>12:00</strong><br/>Housekeeping: <strong>08:00 - 18:00</strong></p>',
        },
        zh: {
          title: '客房与入住须知',
          content: '<p>入住时间：<strong>14:00</strong><br/>退房时间：<strong>12:00</strong><br/>客房清洁：<strong>08:00 - 18:00</strong></p>',
        },
      },
      icon: '🏨',
      order: 4,
    },
  ];

  await prisma.information.deleteMany({});
  for (const info of informationItems) {
    await prisma.information.create({
      data: info,
    });
  }

  // Create sample services with full VI / EN / ZH translations
  const services = [
    {
      name: 'Phòng Gym & Fitness',
      type: 'gym',
      description: 'Phòng tập hiện đại được trang bị đầy đủ máy móc cao cấp phục vụ rèn luyện sức khỏe mỗi ngày.',
      translations: {
        en: {
          name: 'Gym & Fitness Center',
          description: 'Modern fitness center fully equipped with premium cardio and strength machines.',
          hours: '06:00 - 22:00 (Daily)',
          location: '2nd Floor',
        },
        zh: {
          name: '健身中心',
          description: '现代化健身中心，配备齐全的高端有氧及力量训练器械。',
          hours: '06:00 - 22:00（每日）',
          location: '2楼',
        },
      },
      images: [],
      hours: '06:00 - 22:00',
      location: 'Tầng 2',
    },
    {
      name: 'Bar & Lounge',
      type: 'bar',
      description: 'Không gian bar sang trọng với tầm nhìn thoáng đãng, phục vụ đa dạng cocktail và rượu vang thượng hạng.',
      translations: {
        en: {
          name: 'Bar & Lounge',
          description: 'Elegant lounge offering scenic views, handcrafted cocktails, and fine wines.',
          hours: '17:00 - 24:00 (Daily)',
          location: '1st Floor',
        },
        zh: {
          name: '酒吧与酒廊',
          description: '雅致宽敞的酒廊空间，精选特调鸡尾酒与优质佳酿，尽享惬意时光。',
          hours: '17:00 - 24:00（每日）',
          location: '1楼',
        },
      },
      images: [],
      hours: '17:00 - 24:00',
      location: 'Tầng 1',
    },
    {
      name: 'Trung Tâm Thương Vụ',
      type: 'business-center',
      description: 'Không gian làm việc chuyên nghiệp, yên tĩnh với đường truyền internet tốc độ cao và đầy đủ thiết bị văn phòng.',
      translations: {
        en: {
          name: 'Business Center',
          description: 'Quiet, professional workspace with high-speed internet and comprehensive office facilities.',
          hours: '24/7',
          location: '1st Floor',
        },
        zh: {
          name: '商务中心',
          description: '静谧专业的办公空间，配备高速网络及完善的商务办公设施。',
          hours: '24小时全天开放',
          location: '1楼',
        },
      },
      images: [],
      hours: '24/7',
      location: 'Tầng 1',
    },
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { type: service.type },
    });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          translations: service.translations,
        },
      });
    } else {
      await prisma.service.create({
        data: service,
      });
    }
  }

  // Seed default footer & concierge settings (preserve existing admin customizations)
  await prisma.siteSetting.upsert({
    where: { key: FOOTER_SETTING_KEY },
    update: {},
    create: {
      key: FOOTER_SETTING_KEY,
      value: DEFAULT_FOOTER_CONFIG as unknown as Prisma.InputJsonValue,
    },
  });

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
