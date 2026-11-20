import { requirePermission } from '@/lib/auth/guard';

export default async function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CMS (menu, services, QR codes, floor plans, import/export...)
  await requirePermission('content.manage');
  return <>{children}</>;
}
