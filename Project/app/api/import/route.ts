import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toNullableJsonInput } from '@/lib/prisma-json';

function normalizeJsonFields<T extends Record<string, any>>(record: T): T {
  const copy: Record<string, any> = { ...record };
  if ('translations' in copy) {
    copy.translations = toNullableJsonInput(copy.translations);
  }
  return copy as T;
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, mode } = body; // mode: 'merge' | 'replace'

    const results = {
      modules: 0,
      flipbooks: 0,
      qrCodes: 0,
      menus: 0,
      services: 0,
      information: 0,
      documents: 0,
      floorPlans: 0,
      siteSettings: 0,
      errors: [] as string[],
    };

    // Import Modules
    if (data.modules) {
      for (const mod of data.modules) {
        try {
          const cleanMod = normalizeJsonFields(mod);
          await prisma.module.upsert({
            where: { name: mod.name },
            update: mode === 'replace' ? cleanMod : {},
            create: cleanMod,
          });
          results.modules++;
        } catch (err: any) {
          results.errors.push(`Module ${mod.name}: ${err.message}`);
        }
      }
    }

    // Import Flipbooks (before Menus so flipbookId relations exist)
    if (data.flipbooks) {
      for (const fb of data.flipbooks) {
        try {
          const cleanFb = normalizeJsonFields(fb);
          await prisma.flipbook.upsert({
            where: { id: fb.id },
            update: mode === 'replace' ? cleanFb : {},
            create: cleanFb,
          });
          results.flipbooks++;
        } catch (err: any) {
          results.errors.push(`Flipbook ${fb.name}: ${err.message}`);
        }
      }
    }

    // Import QR Codes
    if (data.qrCodes) {
      for (const qr of data.qrCodes) {
        try {
          const { modules: _modules, ...qrData } = qr;
          await prisma.qRCode.upsert({
            where: { token: qr.token },
            update: mode === 'replace' ? qrData : {},
            create: qrData,
          });
          results.qrCodes++;
        } catch (err: any) {
          results.errors.push(`QR Code ${qr.token}: ${err.message}`);
        }
      }
    }

    // Import Menus
    if (data.menus) {
      for (const menu of data.menus) {
        try {
          const { items, ...rawMenuData } = menu;
          const menuData = normalizeJsonFields(rawMenuData);
          const created = await prisma.menu.upsert({
            where: { id: menu.id },
            update: mode === 'replace' ? menuData : {},
            create: menuData,
          });

          if (items) {
            for (const item of items) {
              const cleanItem = normalizeJsonFields({ ...item, menuId: created.id });
              await prisma.menuItem.upsert({
                where: { id: item.id },
                update: mode === 'replace' ? cleanItem : {},
                create: cleanItem,
              });
            }
          }
          results.menus++;
        } catch (err: any) {
          results.errors.push(`Menu ${menu.name}: ${err.message}`);
        }
      }
    }

    // Import Services
    if (data.services) {
      for (const service of data.services) {
        try {
          const cleanService = normalizeJsonFields(service);
          await prisma.service.upsert({
            where: { id: service.id },
            update: mode === 'replace' ? cleanService : {},
            create: cleanService,
          });
          results.services++;
        } catch (err: any) {
          results.errors.push(`Service ${service.name}: ${err.message}`);
        }
      }
    }

    // Import Information
    if (data.information) {
      for (const info of data.information) {
        try {
          const cleanInfo = normalizeJsonFields(info);
          await prisma.information.upsert({
            where: { id: info.id },
            update: mode === 'replace' ? cleanInfo : {},
            create: cleanInfo,
          });
          results.information++;
        } catch (err: any) {
          results.errors.push(`Information ${info.title}: ${err.message}`);
        }
      }
    }

    // Import Technical Documents
    if (data.technicalDocuments) {
      for (const doc of data.technicalDocuments) {
        try {
          await prisma.technicalDocument.upsert({
            where: { id: doc.id },
            update: mode === 'replace' ? doc : {},
            create: doc,
          });
          results.documents++;
        } catch (err: any) {
          results.errors.push(`Document ${doc.title}: ${err.message}`);
        }
      }
    }

    // Import Floor Plans
    if (data.floorPlans) {
      for (const plan of data.floorPlans) {
        try {
          const { rooms, ...rawPlanData } = plan;
          const planData = normalizeJsonFields(rawPlanData);
          const created = await prisma.floorPlan.upsert({
            where: { id: plan.id },
            update: mode === 'replace' ? planData : {},
            create: planData,
          });

          if (rooms) {
            for (const room of rooms) {
              const cleanRoom = normalizeJsonFields({ ...room, floorPlanId: created.id });
              await prisma.room.upsert({
                where: { id: room.id },
                update: mode === 'replace' ? cleanRoom : {},
                create: cleanRoom,
              });
            }
          }
          results.floorPlans++;
        } catch (err: any) {
          results.errors.push(`Floor Plan ${plan.name}: ${err.message}`);
        }
      }
    }

    // Import Site Settings (Footer, ...)
    if (data.siteSettings) {
      for (const setting of data.siteSettings) {
        try {
          if (!setting.key || setting.value === null || setting.value === undefined) continue;
          const val = setting.value as Prisma.InputJsonValue;
          await prisma.siteSetting.upsert({
            where: { key: setting.key },
            update: mode === 'replace' ? { value: val } : {},
            create: { key: setting.key, value: val },
          });
          results.siteSettings++;
        } catch (err: any) {
          results.errors.push(`SiteSetting ${setting.key}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
