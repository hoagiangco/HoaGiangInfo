import { getFooterConfig } from '@/lib/footer-server';
import FooterSettingsForm from '@/components/FooterSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminFooterPage() {
  const initialConfig = await getFooterConfig();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          THƯƠNG HIỆU, LOGO & HỖ TRỢ KHÁCH HÀNG
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Quản Lý Logo, Thương Hiệu & Footer
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Tải lên logo riêng của resort, chỉnh tên hiển thị đầu trang, khối &quot;Cần Hỗ Trợ Trực Tiếp?&quot; và chân trang thương hiệu đa ngôn ngữ (VN / EN / ZH)
        </p>
      </div>

      <FooterSettingsForm initialConfig={initialConfig} />
    </div>
  );
}
