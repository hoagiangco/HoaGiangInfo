import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyQRToken } from '@/lib/qr-auth';
import { getFooterConfig } from '@/lib/footer-server';
import { formatPhoneHref } from '@/lib/footer-config';
import {
  getLocalizedValue,
  type InformationTranslationFields,
} from '@/lib/translations';
import GuestHomeView, {
  type HomeWifiQuickInfo,
  type HomeReceptionQuickInfo,
} from '@/components/GuestHomeView';
import type { HomeModuleItem } from '@/components/ModuleCard';

const MODULE_PRIORITY = ['menu', 'services', 'information', 'floor-plan'];

function htmlToLines(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractWifiField(
  html: string,
  kind: 'ssid' | 'password'
): string {
  const lines = htmlToLines(html)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (kind === 'password') {
    for (const line of lines) {
      const m = line.match(
        /(?:password|mật khẩu|pass|pw|密码)\s*[:：]\s*([^\s,;\n]+)/i
      );
      if (m?.[1]) return m[1].trim();
    }
    return '';
  }

  for (const line of lines) {
    const m = line.match(
      /(?:mạng\s*wi-?fi|tên\s*wi-?fi|wi-?fi\s*network|network|ssid|网络名称|无线网络|网络)\s*[:：]\s*([^\n,;]+)/i
    );
    if (m?.[1]) {
      return m[1]
        .replace(/(?:password|mật khẩu|pass|pw|密码)\s*[:：].*$/i, '')
        .trim();
    }
  }
  return '';
}

function isGenericWifiTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return (
    !normalized ||
    /^(?:mật khẩu\s*)?wi-?fi(?:\s*(?:password|resort|miễn phí|free|& internet|无线网络密码|密码))?$/i.test(
      normalized
    )
  );
}

export default async function TokenHome({
  params,
}: {
  params: { token: string };
}) {
  const qrInfo = await verifyQRToken(params.token);
  if (!qrInfo) {
    notFound();
  }

  const [
    rawModules,
    menuCount,
    servicesCount,
    infoCount,
    floorPlanCount,
    wifiInfo,
    footerConfig,
  ] = await Promise.all([
    prisma.module.findMany({
      where: { name: { in: qrInfo.modules } },
    }),
    qrInfo.modules.includes('menu')
      ? prisma.menu.count({ where: { isActive: true } })
      : Promise.resolve(0),
    qrInfo.modules.includes('services')
      ? prisma.service.count({ where: { isActive: true } })
      : Promise.resolve(0),
    qrInfo.modules.includes('information')
      ? prisma.information.count({ where: { isActive: true } })
      : Promise.resolve(0),
    qrInfo.modules.includes('floor-plan')
      ? prisma.floorPlan.count({ where: { isActive: true } })
      : Promise.resolve(0),
    qrInfo.modules.includes('information')
      ? prisma.information.findFirst({
          where: {
            isActive: true,
            OR: [
              { category: 'wifi' },
              { title: { contains: 'wifi', mode: 'insensitive' } },
              { title: { contains: 'wi-fi', mode: 'insensitive' } },
            ],
          },
          orderBy: { order: 'asc' },
        })
      : Promise.resolve(null),
    getFooterConfig(),
  ]);

  const modules: HomeModuleItem[] = rawModules
    .map((m) => ({
      id: m.id,
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      translations: m.translations,
      icon: m.icon,
      route: m.route,
    }))
    .sort((a, b) => {
      const ia = MODULE_PRIORITY.indexOf(a.name);
      const ib = MODULE_PRIORITY.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  let wifi: HomeWifiQuickInfo | null = null;
  if (wifiInfo) {
    const htmlVi = getLocalizedValue<InformationTranslationFields>(
      'vi',
      wifiInfo.content,
      wifiInfo.translations,
      'content'
    );
    const htmlEn = getLocalizedValue<InformationTranslationFields>(
      'en',
      wifiInfo.content,
      wifiInfo.translations,
      'content'
    );
    const htmlZh = getLocalizedValue<InformationTranslationFields>(
      'zh',
      wifiInfo.content,
      wifiInfo.translations,
      'content'
    );

    const titleVi = getLocalizedValue<InformationTranslationFields>(
      'vi',
      wifiInfo.title,
      wifiInfo.translations,
      'title'
    );
    const titleEn = getLocalizedValue<InformationTranslationFields>(
      'en',
      wifiInfo.title,
      wifiInfo.translations,
      'title'
    );
    const titleZh = getLocalizedValue<InformationTranslationFields>(
      'zh',
      wifiInfo.title,
      wifiInfo.translations,
      'title'
    );

    const passVi = extractWifiField(htmlVi, 'password');
    const passEn = extractWifiField(htmlEn, 'password') || passVi;
    const passZh = extractWifiField(htmlZh, 'password') || passEn || passVi;

    const fallbackSsidVi = !isGenericWifiTitle(titleVi) ? titleVi.trim() : '';
    const fallbackSsidEn = !isGenericWifiTitle(titleEn) ? titleEn.trim() : fallbackSsidVi;
    const fallbackSsidZh = !isGenericWifiTitle(titleZh) ? titleZh.trim() : fallbackSsidEn;

    const ssidVi = extractWifiField(htmlVi, 'ssid') || fallbackSsidVi;
    const ssidEn = extractWifiField(htmlEn, 'ssid') || fallbackSsidEn || ssidVi;
    const ssidZh = extractWifiField(htmlZh, 'ssid') || fallbackSsidZh || ssidEn || ssidVi;

    wifi = {
      infoId: wifiInfo.id,
      ssid: { vi: ssidVi, en: ssidEn, zh: ssidZh },
      password: { vi: passVi, en: passEn, zh: passZh },
    };
  }

  const hotline = (footerConfig.brandFooter.hotline ?? '').trim();
  const phoneHref = hotline ? formatPhoneHref(hotline) : null;
  const frontDeskBadge = footerConfig.concierge.items.find(
    (item) => item.isActive && item.icon === 'phone' && item.highlight?.vi?.trim()
  );
  const dialExt = frontDeskBadge?.highlight?.vi?.trim() || '100';

  const reception: HomeReceptionQuickInfo = {
    hotlineDisplay: hotline || null,
    phoneHref: phoneHref || null,
    dialExt: footerConfig.concierge.enabled ? dialExt : null,
  };

  return (
    <GuestHomeView
      token={params.token}
      modules={modules}
      counts={{
        menu: menuCount,
        services: servicesCount,
        information: infoCount,
        'floor-plan': floorPlanCount,
      }}
      wifi={wifi}
      reception={reception}
      hasInfoModule={qrInfo.modules.includes('information')}
      branding={footerConfig.branding}
      welcomePopup={footerConfig.welcomePopup}
    />
  );
}
