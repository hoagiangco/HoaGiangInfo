import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, mode } = body; // mode: 'merge' | 'replace'

    const results = {
      qrCodes: 0,
      menus: 0,
      services: 0,
      information: 0,
      documents: 0,
      floorPlans: 0,
      errors: [] as string[],
    };

    // Import QR Codes
    if (data.qrCodes) {
      for (const qr of data.qrCodes) {
        try {
          await prisma.qRCode.upsert({
            where: { token: qr.token },
            update: mode === 'replace' ? qr : undefined,
            create: qr,
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
          const { items, ...menuData } = menu;
          const created = await prisma.menu.upsert({
            where: { id: menu.id },
            update: mode === 'replace' ? menuData : undefined,
            create: menuData,
          });

          if (items) {
            for (const item of items) {
              await prisma.menuItem.upsert({
                where: { id: item.id },
                update: mode === 'replace' ? { ...item, menuId: created.id } : undefined,
                create: { ...item, menuId: created.id },
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
          await prisma.service.upsert({
            where: { id: service.id },
            update: mode === 'replace' ? service : undefined,
            create: service,
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
          await prisma.information.upsert({
            where: { id: info.id },
            update: mode === 'replace' ? info : undefined,
            create: info,
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
            update: mode === 'replace' ? doc : undefined,
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
          const { rooms, ...planData } = plan;
          const created = await prisma.floorPlan.upsert({
            where: { id: plan.id },
            update: mode === 'replace' ? planData : undefined,
            create: planData,
          });

          if (rooms) {
            for (const room of rooms) {
              await prisma.room.upsert({
                where: { id: room.id },
                update: mode === 'replace' ? { ...room, floorPlanId: created.id } : undefined,
                create: { ...room, floorPlanId: created.id },
              });
            }
          }
          results.floorPlans++;
        } catch (err: any) {
          results.errors.push(`Floor Plan ${plan.name}: ${err.message}`);
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










