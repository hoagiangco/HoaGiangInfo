import { Prisma, PrismaClient } from '@prisma/client';
import { resolveMenuTranslations } from '../lib/translations';

const prisma = new PrismaClient();

const DEFAULT_MODULE_TRANSLATIONS: Record<
  string,
  { en: { displayName: string; description: string }; zh: { displayName: string; description: string } }
> = {
  menu: {
    en: {
      displayName: 'Dining Menu',
      description: 'Curated restaurant menus and signature beverages crafted from the freshest local ingredients',
    },
    zh: {
      displayName: '餐厅菜单',
      description: '精选新鲜本地食材与星级主厨匠心烹制的各式佳肴及特色饮品',
    },
  },
  'floor-plan': {
    en: {
      displayName: 'Floor Plan',
      description: 'Detailed floor plans of the resort, guest rooms, villas, facilities, and pathways',
    },
    zh: {
      displayName: '楼层平面图',
      description: '查看度假村全区平面图、各楼层客房、别墅分布及公共设施位置',
    },
  },
  services: {
    en: {
      displayName: 'Services',
      description: 'Rejuvenating spa treatments, swimming pool, fitness center, and bespoke resort services',
    },
    zh: {
      displayName: '设施服务',
      description: '畅享水疗护理、休闲泳池、健身中心及多项高品质度假配套设施',
    },
  },
  information: {
    en: {
      displayName: 'Guest Information',
      description: 'High-speed Wi-Fi details, internal directory, TV channels, and essential stay policies',
    },
    zh: {
      displayName: '入住指南',
      description: '高速 Wi-Fi 密码、内线电话指南、电视频道列表及客房使用说明',
    },
  },
};

async function main() {
  console.log('Backfilling multi-language translations (VN / EN / ZH)...');

  // 1. Migrate legacy bilingual JSON in Menu.description -> Menu.translations
  const menus = await prisma.menu.findMany();
  let migratedMenus = 0;

  for (const menu of menus) {
    if (menu.description && menu.description.includes('"__bilingual":true')) {
      const resolved = resolveMenuTranslations(menu.description, menu.translations);
      await prisma.menu.update({
        where: { id: menu.id },
        data: {
          description: resolved.descriptionVi || null,
          translations:
            Object.keys(resolved.translations).length > 0
              ? (resolved.translations as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
      });
      migratedMenus++;
    }
  }
  console.log(`Migrated ${migratedMenus} legacy bilingual menu(s) to translations column.`);

  // 2. Backfill standard Module translations if missing
  const modules = await prisma.module.findMany();
  let updatedModules = 0;

  for (const mod of modules) {
    const defaults = DEFAULT_MODULE_TRANSLATIONS[mod.name];
    if (!defaults) continue;

    if (!mod.translations) {
      await prisma.module.update({
        where: { id: mod.id },
        data: {
          translations: defaults as Prisma.InputJsonValue,
        },
      });
      updatedModules++;
    }
  }
  console.log(`Backfilled default EN/ZH translations on ${updatedModules} module(s).`);

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
