import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { footerConfigSchema } from '@/lib/footer-config';
import { getFooterConfig, saveFooterConfig } from '@/lib/footer-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getFooterConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching footer config:', error);
    return NextResponse.json(
      { error: 'Không thể tải cấu hình footer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const guard = await apiGuard('content.manage');
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const parsed = footerConfigSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message || 'Dữ liệu cấu hình footer không hợp lệ',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const saved = await saveFooterConfig(parsed.data);

    await audit({
      user: guard.user,
      action: 'footer.update',
      entity: 'SiteSetting',
      entityId: 'footer',
      meta: {
        hasCustomLogo: Boolean(saved.branding.logoUrl),
        welcomePopupEnabled: saved.welcomePopup.enabled,
        conciergeEnabled: saved.concierge.enabled,
        conciergeShowOnAllPages: saved.concierge.showOnAllPages,
        conciergeItemsCount: saved.concierge.items.length,
        brandFooterEnabled: saved.brandFooter.enabled,
      },
    });

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Ignore revalidation errors in non-request contexts
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving footer config:', error);
    return NextResponse.json(
      { error: 'Không thể lưu cấu hình footer' },
      { status: 500 }
    );
  }
}
