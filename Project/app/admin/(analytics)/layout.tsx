import { requirePermission } from '@/lib/auth/guard';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission('analytics.view');
  return <>{children}</>;
}
