export type Language = 'vi' | 'en' | 'zh';

export const DEFAULT_LANGUAGE: Language = 'vi';
export const LANGUAGE_COOKIE_NAME = 'hg_lang';

export const languages: Language[] = ['vi', 'en', 'zh'];

export const languageNames: Record<Language, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
};

export const languageShortLabels: Record<Language, string> = {
  vi: 'VN',
  en: 'EN',
  zh: '中文',
};

export const languageAdminLabels: Record<Language, string> = {
  vi: 'Tiếng Việt (VN)',
  en: 'English (EN)',
  zh: '中文 (ZH)',
};

/**
 * Normalize any language code (including informal aliases like 'vn', 'zn', 'cn',
 * or locale codes like 'vi-VN', 'en-US', 'zh-CN') to one of the 3 supported languages.
 */
export function normalizeLanguage(raw?: string | null): Language {
  if (!raw) return DEFAULT_LANGUAGE;
  const cleaned = raw.trim().toLowerCase();
  const base = cleaned.split(/[-_]/)[0];

  if (base === 'vi' || base === 'vn') return 'vi';
  if (base === 'en') return 'en';
  if (base === 'zh' || base === 'zn' || base === 'cn') return 'zh';

  return DEFAULT_LANGUAGE;
}

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Brand & Site Metadata
    site_title: 'Hòa Bình Rạch Giá Resort - Hoa Giang',
    resort_name: 'Hòa Bình Rạch Giá Resort',
    resort_subtitle: 'Hòa Bình Rạch Giá Resort',
    resort_short_subtitle: 'Rạch Giá Resort',
    four_star_resort: 'RESORT 4 SAO',
    footer_welcome: '★★★★ HÂN HẠNH ĐƯỢC ĐÓN TIẾP & PHỤC VỤ QUÝ KHÁCH',
    footer_copyright: '© {year} Hòa Bình Rạch Giá Resort • Hòa Giang Hospitality. Bảo lưu mọi quyền.',

    // Language Switcher
    language_label: 'Ngôn ngữ',
    select_language: 'Chọn ngôn ngữ',

    // Navigation & Common Actions
    home: 'Trang chủ',
    back_home: 'Về trang chủ',
    back_to_home: 'Về trang chủ',
    toggle_menu: 'Mở/đóng menu điều hướng',
    menu: 'Thực Đơn',
    room_service: 'Dịch Vụ Phòng',
    floor_plan: 'Sơ Đồ',
    services: 'Dịch Vụ',
    information: 'Thông Tin',
    feedback: 'Góp Ý',
    technical: 'Tài Liệu',
    explore_now: 'Khám phá ngay',
    all: 'Tất cả',
    close: 'Đóng',
    download: 'Tải xuống',
    view: 'Xem',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    save: 'Lưu',
    saving: 'Đang lưu...',
    cancel: 'Hủy',
    create: 'Tạo mới',
    update: 'Cập nhật',
    upload: 'Tải lên',
    loading: 'Đang tải...',
    loading_document: 'Đang tải tài liệu...',
    loading_pdf: 'Đang tải PDF...',
    try_again: 'Thử lại',
    error_title: 'Có lỗi xảy ra',
    not_found_title: 'Trang không tìm thấy',
    not_found_desc: 'Mã QR không hợp lệ hoặc trang không tồn tại.',

    // Home Page (/[token])
    welcome: 'Chào mừng đến Resort',
    select_service: 'Chọn dịch vụ bạn muốn xem',
    hero_badge: 'RESORT 4 SAO',
    hero_title: 'Chào Mừng Quý Khách Đến Với Hòa Bình Rạch Giá Resort',
    hero_subtitle:
      'Tận hưởng không gian nghỉ dưỡng tuyệt mỹ, khám phá ẩm thực tinh tế và các tiện ích đặc quyền chuẩn 4 sao quốc tế',
    hero_compact_subtitle:
      'Ẩm thực, tiện ích, Wi-Fi & hướng dẫn lưu trú chuẩn 4 sao ngay trong tầm tay',
    quick_wifi_label: 'Wi-Fi Resort',
    quick_wifi_network: 'Mạng',
    quick_wifi_password: 'Mật khẩu',
    quick_reception: 'Lễ tân 24/7',
    quick_dial_ext: 'Phím {ext}',
    quick_call_now: 'Gọi ngay',
    module_count_menu: '{count} thực đơn',
    module_count_services: '{count} dịch vụ',
    module_count_information: '{count} mục',
    module_count_floor_plan: '{count} sơ đồ',
    menu_search_placeholder: 'Tìm nhanh món ăn, đồ uống...',
    menu_search_empty: 'Không tìm thấy món phù hợp với "{query}"',
    swipe_hint: 'Vuốt trái/phải đổi trang · Chạm 2 lần phóng to',
    table_scroll_hint: 'Vuốt ngang để xem đầy đủ bảng',
    floor_plan_gesture_hint: 'Chạm 2 lần phóng to · Kéo để di chuyển · Chạm phòng xem chi tiết',
    tap_to_enlarge: 'Chạm để xem ảnh lớn',
    no_modules: 'Mã QR này chưa được gán dịch vụ nào',
    feedback_card_title: 'Góp Ý & Đánh Giá',
    feedback_card_desc:
      'Ý kiến của Quý khách là kim chỉ nam giúp chúng tôi nâng tầm chất lượng dịch vụ mỗi ngày',
    concierge_title: 'Cần Hỗ Trợ Trực Tiếp?',
    concierge_subtitle: 'Đội ngũ Quản gia & Lễ tân luôn sẵn sàng hỗ trợ Quý khách 24/7',
    concierge_dial_prefix: 'Bấm phím',
    concierge_dial_ext: '100',
    concierge_dial_suffix: '(Lễ tân)',
    concierge_room_service: 'Dịch vụ phòng:',
    concierge_room_service_hours: '24/24',
    concierge_security: 'An ninh & Y tế hỗ trợ ngay',

    // Module Card Tags & Fallback Descriptions
    module_tag_menu: 'ẨM THỰC & NHÀ HÀNG',
    module_desc_menu:
      'Thực đơn món ăn & đồ uống thượng hạng chế biến từ nguyên liệu tươi ngon nhất',
    module_tag_floor_plan: 'SƠ ĐỒ & BIỆT THỰ',
    module_desc_floor_plan:
      'Sơ đồ chi tiết toàn khu nghỉ dưỡng, vị trí phòng nghỉ, biệt thự và tiện ích',
    module_tag_services: 'THƯ GIÃN & TIỆN ÍCH',
    module_desc_services:
      'Trải nghiệm spa trị liệu, hồ bơi thư giãn, gym và các dịch vụ chăm sóc cao cấp',
    module_tag_information: 'THÔNG TIN LƯU TRÚ',
    module_desc_information:
      'Mật khẩu Wi-Fi tốc độ cao, số máy lễ tân, danh mục kênh truyền hình và tiện ích phòng',
    module_tag_feedback: 'TRẢI NGHIỆM KHÁCH HÀNG',
    module_desc_feedback:
      'Chia sẻ đánh giá và cảm nhận của Quý khách để chúng tôi phục vụ ngày một hoàn hảo hơn',
    module_tag_default: 'DỊCH VỤ RESORT',
    module_desc_default: 'Dịch vụ tiện ích cao cấp dành riêng cho Quý khách',

    // Menu List & Detail Pages
    menu_badge: 'Ẩm Thực & Nhà Hàng',
    menu_eyebrow: 'Tinh Hoa Ẩm Thực Nghỉ Dưỡng',
    menu_page_title: 'Thực Đơn Nhà Hàng & Bar',
    menu_page_subtitle:
      'Thưởng thức phong vị ẩm thực thượng hạng, kết hợp tinh tế giữa nguyên liệu địa phương tươi sống và nghệ thuật chế biến chuẩn 4 sao quốc tế.',
    menu_items_count: '{count} món',
    menu_view_detail: 'Xem thực đơn chi tiết',
    menu_default_desc:
      'Khám phá danh sách các món ăn chọn lọc và thức uống đặc sắc của nhà hàng.',
    menu_empty_title: 'Thực Đơn Đang Cập Nhật',
    menu_empty_desc:
      'Hệ thống đang chuẩn bị danh mục món mới cho ngày hôm nay. Quý khách vui lòng liên hệ nhân viên phục vụ để được giới thiệu trực tiếp.',
    menu_back: 'Thực đơn',
    menu_view_list: 'Danh sách',
    menu_view_pdf: 'Bản PDF',
    menu_view_image: 'Ảnh Menu',
    menu_view_gallery: 'Thư viện ảnh ({count})',
    menu_all_items: 'Tất cả ({count})',
    menu_category_other: 'Khác',
    menu_empty_category: 'Chưa có món ăn nào trong danh mục này',
    menu_available_now: 'Sẵn sàng phục vụ',
    menu_culinary_badge: 'Ẩm thực chuẩn 4 sao',
    menu_currency: 'đ',
    no_items: 'Không có món nào',
    no_menu: 'Chưa có menu nào',

    // Flipbook & PDF Viewers
    flipbook: 'Flipbook',
    image: 'Hình ảnh',
    images: 'Ảnh',
    page: 'Trang',
    page_label: 'Trang {label}',
    page_of: 'Trang {current} / {total}',
    previous_page: 'Trang trước',
    next_page: 'Trang sau',
    before: 'Trước',
    after: 'Sau',
    zoom_in: 'Phóng to',
    zoom_out: 'Thu nhỏ',
    reset_zoom: 'Nhấn để đặt lại kích thước chuẩn (100%)',
    reset_view: 'Đặt lại góc nhìn',
    rotate: 'Xoay',
    fullscreen: 'Toàn màn hình',
    exit_fullscreen: 'Thoát toàn màn hình',
    single_page: '1 trang',
    double_page: '2 trang',
    single_page_tooltip: 'Chế độ xem 1 trang',
    double_page_tooltip: 'Chế độ xem 2 trang đôi',
    fit_readable: 'Đầy đặn',
    fit_viewport: 'Vừa khung',
    fit_readable_tooltip: 'Chuyển sang chế độ đầy đặn dễ đọc',
    fit_viewport_tooltip: 'Thu gọn vừa 1 màn hình',
    thumbnails_tooltip: 'Danh sách trang',
    converting_pdf_flipbook: 'Đang chuyển đổi tài liệu PDF sang các trang Flipbook...',
    pdf_page_number: 'Trang PDF #{page}',
    open_pdf_new_tab: 'Mở PDF trong tab mới',
    open_new_tab: 'Mở tab mới',
    pdf_display_error_title: 'Không thể hiển thị trực tiếp file PDF',
    pdf_load_error: 'Không thể tải tài liệu PDF.',
    try_default_viewer: 'Thử trình xem mặc định',
    no_pages: 'Không có trang nào',
    view_lang_doc: 'Xem bản {lang}',

    // Services List & Detail Pages
    services_badge: 'Tiện Ích Resort',
    services_eyebrow: 'Tiện Ích & Dịch Vụ Đẳng Cấp',
    services_page_title: 'Dịch Vụ & Trải Nghiệm Nghỉ Dưỡng',
    services_page_subtitle:
      'Tận hưởng chuỗi tiện ích tiêu chuẩn 4 sao được chuẩn bị chu đáo để mang lại sự thư thái, tái tạo năng lượng cho Quý khách.',
    services_default_desc:
      'Dịch vụ cao cấp phục vụ riêng cho khách lưu trú tại Hòa Bình Rạch Giá Resort.',
    services_view_detail: 'Chi tiết dịch vụ',
    services_empty_title: 'Dịch Vụ Đang Cập Nhật',
    services_empty_desc:
      'Danh mục dịch vụ đang được làm mới. Quý khách vui lòng liên hệ Bộ phận Lễ tân hoặc Bàn Concierge 24/7 để được hỗ trợ.',
    services_back_list: 'Danh sách dịch vụ',
    service_detail_badge: 'Dịch Vụ 4 Sao',
    service_standard_4star: 'Dịch Vụ Tiêu Chuẩn 4 Sao',
    hours: 'Giờ mở cửa',
    service_hours_label: 'Giờ hoạt động:',
    location: 'Vị trí',
    service_location_label: 'Vị trí:',
    service_gallery_title: 'Không Gian & Hình Ảnh Thực Tế',
    service_booking_title: 'Đặt Chỗ & Trải Nghiệm Dịch Vụ',
    service_booking_desc:
      'Để đảm bảo không gian và thời gian phục vụ hoàn hảo nhất, Quý khách vui lòng liên hệ trước với bộ phận Lễ tân hoặc Bàn Concierge.',
    service_booking_cta: 'Bấm phím 0 từ phòng nghỉ',
    service_type_gym: 'Phòng Gym & Fitness',
    service_type_bar: 'Bar & Lounge',
    'service_type_business-center': 'Trung Tâm Thương Vụ',
    service_type_spa: 'Spa & Trị Liệu',
    service_type_pool: 'Hồ Bơi',
    service_type_restaurant: 'Nhà Hàng',
    service_type_concierge: 'Hỗ Trợ Khách Hàng',
    service_type_other: 'Tiện Ích Khác',

    // Information Page
    info_badge: 'Thông Tin Lưu Trú',
    info_eyebrow: 'Cẩm Nang Lưu Trú Tiện Ích',
    info_page_title: 'Thông Tin Cần Biết',
    info_page_subtitle:
      'Tất cả thông tin thiết yếu về mạng không dây, quy định lưu trú, số máy nội bộ và các lưu ý hữu ích dành cho kỳ nghỉ của Quý khách.',
    info_support_247: 'Hỗ trợ 24/7',
    info_guest_care: 'Chăm sóc Khách hàng Hòa Bình Rạch Giá',
    info_empty_title: 'Thông Tin Đang Cập Nhật',
    info_empty_desc:
      'Hệ thống thông tin đang được cập nhật. Nếu Quý khách cần hỗ trợ ngay, vui lòng liên hệ quầy Lễ tân hoặc quay số 0.',
    wifi_password: 'Mật khẩu WiFi',
    phone_guide: 'Hướng dẫn điện thoại',
    tv_channels: 'Danh sách kênh SCTV',
    room_info: 'Thông tin phòng',
    info_cat_wifi: 'WiFi & Internet',
    info_cat_phone: 'Điện Thoại Nội Bộ',
    info_cat_tv: 'Kênh Truyền Hình',
    'info_cat_room-info': 'Thông Tin Phòng',
    info_cat_safety: 'An Ninh & An Toàn',
    info_cat_guide: 'Cẩm Nang & Hướng Dẫn',
    info_cat_general: 'Thông Tin Chung',
    info_quick_section: 'Tra Cứu Nhanh',
    info_quick_subtitle: 'Thông tin thiết yếu xem ngay trong tích tắc',
    info_guides_section: 'Cẩm Nang & Hướng Dẫn Lưu Trú',
    info_guides_subtitle: 'Nhấn vào từng mục để xem toàn màn hình hoặc tra cứu nhanh',
    info_view_detail: 'Xem chi tiết',
    info_back: 'Thông tin',
    info_copy: 'Sao chép',
    info_copied: 'Đã sao chép',
    info_type_table: 'Bảng tra cứu',
    info_type_pdf: 'Bản PDF',
    info_type_image: 'Hình ảnh',
    info_type_guide: 'Cẩm nang',
    info_view_content: 'Nội dung',
    info_table_preview: 'Danh mục bảng chi tiết ({rows} dòng) — nhấn để mở rộng & tìm kiếm nhanh.',
    info_doc_preview: 'Tài liệu chi tiết — nhấn để mở trình xem toàn màn hình.',
    info_search_placeholder: 'Tìm nhanh trong bảng (ví dụ: VTV, SCTV, Kiên Giang, số kênh...)',
    info_search_matches: 'Tìm thấy {count} dòng phù hợp',
    info_search_no_results: 'Không tìm thấy kết quả phù hợp với từ khóa "{query}"',
    info_clear_search: 'Xóa lọc',

    // Floor Plan List & Interactive Detail
    floor_plan_badge: 'Bản Đồ & Sơ Đồ Resort',
    floor_plan_eyebrow: 'Sơ Đồ Không Gian Nghỉ Dưỡng',
    floor_plan_page_title: 'Sơ Đồ Phòng & Khu Nghỉ Dưỡng',
    floor_plan_page_subtitle:
      'Xem chi tiết mặt bằng các tầng, biệt thự nghỉ dưỡng và vị trí phòng để dễ dàng định vị không gian và lối đi trong khuôn viên resort.',
    floor_plan_rooms_count: '{count} phòng',
    floor_plan_default_desc: 'Sơ đồ mặt bằng chi tiết các phòng và lối thoát hiểm.',
    floor_plan_view_interactive: 'Xem sơ đồ tương tác',
    floor_plan_empty_title: 'Sơ Đồ Đang Cập Nhật',
    floor_plan_empty_desc:
      'Sơ đồ mặt bằng đang được số hóa hoàn thiện. Quý khách vui lòng liên hệ nhân viên lễ tân để nhận bản đồ chỉ dẫn giấy.',
    floor_plan_back: 'Sơ đồ',
    floor_plan_room_label: 'Phòng {number}',
    floor_plan_room_default_desc:
      'Không gian nghỉ dưỡng tiện nghi, tiêu chuẩn 4 sao quốc tế.',
    floor_plan_rotate_tooltip: 'Xoay sơ đồ',
    no_floor_plan: 'Chưa có sơ đồ phòng',
    room_type_standard: 'Standard',
    room_type_deluxe: 'Deluxe',
    room_type_suite: 'Suite',
    room_type_villa: 'Biệt thự (Villa)',
  },

  en: {
    // Brand & Site Metadata
    site_title: 'Hoa Binh Rach Gia Resort - Hoa Giang',
    resort_name: 'Hoa Binh Rach Gia Resort',
    resort_subtitle: 'Hoa Binh Rach Gia Resort',
    resort_short_subtitle: 'Rach Gia Resort',
    four_star_resort: '4-STAR RESORT',
    footer_welcome: '★★★★ IT IS OUR PLEASURE TO WELCOME & SERVE YOU',
    footer_copyright: '© {year} Hoa Binh Rach Gia Resort • Hoa Giang Hospitality. All rights reserved.',

    // Language Switcher
    language_label: 'Language',
    select_language: 'Select language',

    // Navigation & Common Actions
    home: 'Home',
    back_home: 'Back to Home',
    back_to_home: 'Back to Home',
    toggle_menu: 'Toggle navigation menu',
    menu: 'Dining Menu',
    room_service: 'Room Service',
    floor_plan: 'Floor Plan',
    services: 'Services',
    information: 'Information',
    feedback: 'Feedback',
    technical: 'Documents',
    explore_now: 'Explore Now',
    all: 'All',
    close: 'Close',
    download: 'Download',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
    upload: 'Upload',
    loading: 'Loading...',
    loading_document: 'Loading document...',
    loading_pdf: 'Loading PDF...',
    try_again: 'Try Again',
    error_title: 'Something went wrong',
    not_found_title: 'Page Not Found',
    not_found_desc: 'The QR code is invalid or the page does not exist.',

    // Home Page (/[token])
    welcome: 'Welcome to Resort',
    select_service: 'Select the service you want to view',
    hero_badge: '4-STAR RESORT',
    hero_title: 'Welcome to Hoa Binh Rach Gia Resort',
    hero_subtitle:
      'Indulge in a refined coastal retreat, exquisite culinary experiences, and exclusive 4-star international hospitality',
    hero_compact_subtitle:
      'Dining, amenities, Wi-Fi & 4-star guest services right at your fingertips',
    quick_wifi_label: 'Resort Wi-Fi',
    quick_wifi_network: 'Network',
    quick_wifi_password: 'Password',
    quick_reception: 'Front Desk 24/7',
    quick_dial_ext: 'Dial {ext}',
    quick_call_now: 'Call now',
    module_count_menu: '{count} menus',
    module_count_services: '{count} services',
    module_count_information: '{count} guides',
    module_count_floor_plan: '{count} maps',
    menu_search_placeholder: 'Search dishes or drinks...',
    menu_search_empty: 'No items matched "{query}"',
    swipe_hint: 'Swipe to turn pages · Double-tap to zoom',
    table_scroll_hint: 'Swipe horizontally to view full table',
    floor_plan_gesture_hint: 'Double-tap to zoom · Drag to pan · Tap a room for details',
    tap_to_enlarge: 'Tap to enlarge photo',
    no_modules: 'This QR code has no services assigned yet',
    feedback_card_title: 'Guest Feedback',
    feedback_card_desc:
      'Your valuable feedback guides us to elevate our service excellence every single day',
    concierge_title: 'Need Personal Assistance?',
    concierge_subtitle: 'Our Butler & Front Desk team is always ready to assist you 24/7',
    concierge_dial_prefix: 'Dial',
    concierge_dial_ext: '100',
    concierge_dial_suffix: '(Front Desk)',
    concierge_room_service: 'Room Service:',
    concierge_room_service_hours: '24/7',
    concierge_security: '24/7 Security & Medical Support',

    // Module Card Tags & Fallback Descriptions
    module_tag_menu: 'CUISINE & DINING',
    module_desc_menu:
      'Curated restaurant menus and signature beverages crafted from the freshest local ingredients',
    module_tag_floor_plan: 'RESORT MAP & VILLAS',
    module_desc_floor_plan:
      'Detailed floor plans of the resort, guest rooms, villas, facilities, and pathways',
    module_tag_services: 'WELLNESS & AMENITIES',
    module_desc_services:
      'Rejuvenating spa treatments, swimming pool, fitness center, and bespoke resort services',
    module_tag_information: 'GUEST INFORMATION',
    module_desc_information:
      'High-speed Wi-Fi details, internal directory, TV channels, and essential stay policies',
    module_tag_feedback: 'GUEST EXPERIENCE',
    module_desc_feedback:
      'Share your impressions and suggestions so we can make every stay truly memorable',
    module_tag_default: 'RESORT SERVICE',
    module_desc_default: 'Exclusive resort facilities tailored for your comfort',

    // Menu List & Detail Pages
    menu_badge: 'Culinary & Dining',
    menu_eyebrow: 'Fine Resort Gastronomy',
    menu_page_title: 'Restaurant & Bar Menus',
    menu_page_subtitle:
      'Savor exceptional flavors uniting fresh coastal ingredients with 4-star international culinary artistry.',
    menu_items_count: '{count} items',
    menu_view_detail: 'View Full Menu',
    menu_default_desc:
      'Explore our curated selection of signature dishes and crafted beverages.',
    menu_empty_title: 'Menu Coming Soon',
    menu_empty_desc:
      'Our culinary team is preparing today’s menu. Please contact our dining staff for personal recommendations.',
    menu_back: 'Menus',
    menu_view_list: 'List View',
    menu_view_pdf: 'PDF View',
    menu_view_image: 'Menu Image',
    menu_view_gallery: 'Photo Gallery ({count})',
    menu_all_items: 'All ({count})',
    menu_category_other: 'Other',
    menu_empty_category: 'No dishes available in this category yet',
    menu_available_now: 'Available Now',
    menu_culinary_badge: '4-Star Culinary',
    menu_currency: 'VND',
    no_items: 'No items available',
    no_menu: 'No menu available',

    // Flipbook & PDF Viewers
    flipbook: 'Flipbook',
    image: 'Image',
    images: 'Images',
    page: 'Page',
    page_label: 'Page {label}',
    page_of: 'Page {current} / {total}',
    previous_page: 'Previous Page',
    next_page: 'Next Page',
    before: 'Previous',
    after: 'Next',
    zoom_in: 'Zoom In',
    zoom_out: 'Zoom Out',
    reset_zoom: 'Click to reset zoom (100%)',
    reset_view: 'Reset View',
    rotate: 'Rotate',
    fullscreen: 'Fullscreen',
    exit_fullscreen: 'Exit Fullscreen',
    single_page: '1 Page',
    double_page: '2 Pages',
    single_page_tooltip: 'Single-page view',
    double_page_tooltip: 'Two-page spread view',
    fit_readable: 'Comfort',
    fit_viewport: 'Fit Screen',
    fit_readable_tooltip: 'Switch to comfortable reading size',
    fit_viewport_tooltip: 'Fit cleanly within screen',
    thumbnails_tooltip: 'Page thumbnails',
    converting_pdf_flipbook: 'Preparing flipbook pages from PDF document...',
    pdf_page_number: 'PDF Page #{page}',
    open_pdf_new_tab: 'Open PDF in new tab',
    open_new_tab: 'Open in new tab',
    pdf_display_error_title: 'Unable to preview PDF directly',
    pdf_load_error: 'Unable to load PDF document.',
    try_default_viewer: 'Try default viewer',
    no_pages: 'No pages available',
    view_lang_doc: 'View {lang} version',

    // Services List & Detail Pages
    services_badge: 'Resort Amenities',
    services_eyebrow: 'Signature Facilities & Services',
    services_page_title: 'Resort Services & Experiences',
    services_page_subtitle:
      'Discover thoughtfully curated 4-star amenities designed for relaxation, wellness, and effortless convenience.',
    services_default_desc:
      'Exclusive hospitality services dedicated to in-house guests at Hoa Binh Rach Gia Resort.',
    services_view_detail: 'View Service Details',
    services_empty_title: 'Services Updating',
    services_empty_desc:
      'Our service directory is currently being refreshed. Please contact the Front Desk or 24/7 Concierge for assistance.',
    services_back_list: 'All Services',
    service_detail_badge: '4-Star Service',
    service_standard_4star: '4-Star International Standard',
    hours: 'Opening Hours',
    service_hours_label: 'Opening Hours:',
    location: 'Location',
    service_location_label: 'Location:',
    service_gallery_title: 'Spaces & Gallery',
    service_booking_title: 'Reservations & Assistance',
    service_booking_desc:
      'To ensure seamless availability and personalized preparation, please contact our Front Desk or Concierge in advance.',
    service_booking_cta: 'Dial 0 from your room',
    service_type_gym: 'Gym & Fitness',
    service_type_bar: 'Bar & Lounge',
    'service_type_business-center': 'Business Center',
    service_type_spa: 'Spa & Wellness',
    service_type_pool: 'Swimming Pool',
    service_type_restaurant: 'Restaurant',
    service_type_concierge: 'Concierge',
    service_type_other: 'Amenity',

    // Information Page
    info_badge: 'Guest Information',
    info_eyebrow: 'Essential Stay Directory',
    info_page_title: 'Useful Information',
    info_page_subtitle:
      'Everything you need to know about Wi-Fi access, stay guidelines, internal extensions, and helpful tips during your stay.',
    info_support_247: '24/7 Assistance',
    info_guest_care: 'Hoa Binh Rach Gia Guest Care',
    info_empty_title: 'Information Updating',
    info_empty_desc:
      'Guest information is currently being updated. If you need immediate assistance, please contact the Front Desk or dial 0.',
    wifi_password: 'Wi-Fi Password',
    phone_guide: 'Telephone Guide',
    tv_channels: 'TV Channel Guide',
    room_info: 'Room Information',
    info_cat_wifi: 'Wi-Fi & Internet',
    info_cat_phone: 'Internal Phone',
    info_cat_tv: 'TV Channels',
    'info_cat_room-info': 'Room Info',
    info_cat_safety: 'Safety & Security',
    info_cat_guide: 'Guides & Policies',
    info_cat_general: 'General Info',
    info_quick_section: 'Quick Essentials',
    info_quick_subtitle: 'Instant access to key stay details at a glance',
    info_guides_section: 'Guest Guides & Directory',
    info_guides_subtitle: 'Tap any card to open the full-width view with quick search',
    info_view_detail: 'View Details',
    info_back: 'Information',
    info_copy: 'Copy',
    info_copied: 'Copied',
    info_type_table: 'Directory Table',
    info_type_pdf: 'PDF Document',
    info_type_image: 'Image',
    info_type_guide: 'Guide',
    info_view_content: 'Content',
    info_table_preview: 'Full reference table ({rows} rows) — tap to expand and search instantly.',
    info_doc_preview: 'Detailed document — tap to open in the full-screen viewer.',
    info_search_placeholder: 'Search table quickly (e.g., VTV, SCTV, channel number...)',
    info_search_matches: 'Found {count} matching rows',
    info_search_no_results: 'No matching entries found for "{query}"',
    info_clear_search: 'Clear',

    // Floor Plan List & Interactive Detail
    floor_plan_badge: 'Resort Map & Layout',
    floor_plan_eyebrow: 'Resort Architecture & Layout',
    floor_plan_page_title: 'Floor Plans & Resort Map',
    floor_plan_page_subtitle:
      'Browse detailed floor layouts, villas, and room locations to navigate effortlessly throughout the resort.',
    floor_plan_rooms_count: '{count} rooms',
    floor_plan_default_desc: 'Detailed floor layout showing rooms and emergency exits.',
    floor_plan_view_interactive: 'View Interactive Map',
    floor_plan_empty_title: 'Floor Plans Updating',
    floor_plan_empty_desc:
      'Our digital floor plans are being finalized. Please contact the Front Desk for a printed resort map.',
    floor_plan_back: 'Floor Plans',
    floor_plan_room_label: 'Room {number}',
    floor_plan_room_default_desc:
      'Refined accommodation with 4-star international standards.',
    floor_plan_rotate_tooltip: 'Rotate map',
    no_floor_plan: 'No floor plan image available',
    room_type_standard: 'Standard',
    room_type_deluxe: 'Deluxe',
    room_type_suite: 'Suite',
    room_type_villa: 'Villa',
  },

  zh: {
    // Brand & Site Metadata
    site_title: '和平迪石度假村 - Hoa Giang',
    resort_name: '和平迪石度假村',
    resort_subtitle: '和平迪石度假村 · Hoa Binh Rach Gia',
    resort_short_subtitle: '和平迪石度假村',
    four_star_resort: '四星级度假村',
    footer_welcome: '★★★★ 诚挚欢迎您的光临，竭诚为您服务',
    footer_copyright: '© {year} 和平迪石度假村 • Hoa Giang Hospitality. 保留所有权利。',

    // Language Switcher
    language_label: '语言',
    select_language: '选择语言',

    // Navigation & Common Actions
    home: '首页',
    back_home: '返回首页',
    back_to_home: '返回首页',
    toggle_menu: '切换导航菜单',
    menu: '餐厅菜单',
    room_service: '客房服务',
    floor_plan: '楼层平面图',
    services: '设施服务',
    information: '入住指南',
    feedback: '宾客反馈',
    technical: '文档',
    explore_now: '立即探索',
    all: '全部',
    close: '关闭',
    download: '下载',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    saving: '保存中...',
    cancel: '取消',
    create: '创建',
    update: '更新',
    upload: '上传',
    loading: '加载中...',
    loading_document: '正在加载文档...',
    loading_pdf: '正在加载 PDF...',
    try_again: '重试',
    error_title: '发生错误',
    not_found_title: '未找到页面',
    not_found_desc: '二维码无效或所访问的页面不存在。',

    // Home Page (/[token])
    welcome: '欢迎莅临度假村',
    select_service: '请选择您要查看的服务',
    hero_badge: '四星级度假村',
    hero_title: '欢迎莅临和平迪石度假村',
    hero_subtitle:
      '尽享优雅惬意的度假空间，品鉴精致美食与国际四星级尊享服务体验',
    hero_compact_subtitle:
      '一键畅享餐饮菜单、康体设施、高速 Wi-Fi 与四星级贴心服务',
    quick_wifi_label: '高速 Wi-Fi',
    quick_wifi_network: '网络',
    quick_wifi_password: '密码',
    quick_reception: '24小时前台',
    quick_dial_ext: '分机 {ext}',
    quick_call_now: '立即拨打',
    module_count_menu: '{count} 份菜单',
    module_count_services: '{count} 项服务',
    module_count_information: '{count} 项指南',
    module_count_floor_plan: '{count} 张地图',
    menu_search_placeholder: '快速搜索菜品或饮品...',
    menu_search_empty: '未找到与“{query}”相关的菜品',
    swipe_hint: '左右滑动翻页 · 双击缩放',
    table_scroll_hint: '左右滑动查看完整表格',
    floor_plan_gesture_hint: '双击放大 · 拖动平移 · 点击房间查看详情',
    tap_to_enlarge: '点击查看大图',
    no_modules: '此二维码暂未配置可用服务',
    feedback_card_title: '宾客意见与评价',
    feedback_card_desc:
      '您的宝贵意见是我们不断提升服务品质的重要指引',
    concierge_title: '需要即时协助？',
    concierge_subtitle: '我们的管家与前台团队 24 小时全天候为您服务',
    concierge_dial_prefix: '拨打分机',
    concierge_dial_ext: '100',
    concierge_dial_suffix: '（前台）',
    concierge_room_service: '客房服务：',
    concierge_room_service_hours: '24小时',
    concierge_security: '全天候安保与医疗支持',

    // Module Card Tags & Fallback Descriptions
    module_tag_menu: '餐饮美食',
    module_desc_menu:
      '精选新鲜本地食材与星级主厨匠心烹制的各式佳肴及特色饮品',
    module_tag_floor_plan: '度假村地图与楼层',
    module_desc_floor_plan:
      '查看度假村全区平面图、各楼层客房、别墅分布及公共设施位置',
    module_tag_services: '康体与尊享服务',
    module_desc_services:
      '畅享水疗护理、休闲泳池、健身中心及多项高品质度假配套设施',
    module_tag_information: '入住须知',
    module_desc_information:
      '高速 Wi-Fi 密码、内线电话指南、电视频道列表及客房使用说明',
    module_tag_feedback: '宾客体验',
    module_desc_feedback:
      '欢迎分享您的入住体验与建议，助我们为您提供更加完美的服务',
    module_tag_default: '度假村服务',
    module_desc_default: '专为入住宾客打造的尊享度假设施与服务',

    // Menu List & Detail Pages
    menu_badge: '精致餐饮',
    menu_eyebrow: '星级美食飨宴',
    menu_page_title: '餐厅与酒吧菜单',
    menu_page_subtitle:
      '甄选当地鲜活食材，融合国际四星级烹饪艺术，为您呈现难忘的味蕾之旅。',
    menu_items_count: '{count} 道菜品',
    menu_view_detail: '查看详细菜单',
    menu_default_desc: '探索餐厅精选特色菜肴与调制饮品。',
    menu_empty_title: '菜单更新中',
    menu_empty_desc:
      '厨房团队正在准备今日精选菜单。如需了解当日推荐，请随时联系餐厅服务人员。',
    menu_back: '菜单列表',
    menu_view_list: '菜品列表',
    menu_view_pdf: 'PDF 菜单',
    menu_view_image: '菜单图片',
    menu_view_gallery: '美食图集 ({count})',
    menu_all_items: '全部 ({count})',
    menu_category_other: '其他',
    menu_empty_category: '该分类暂无菜品',
    menu_available_now: '现正供应',
    menu_culinary_badge: '四星级美馔',
    menu_currency: '越南盾',
    no_items: '暂无项目',
    no_menu: '暂无可用菜单',

    // Flipbook & PDF Viewers
    flipbook: '翻页菜单',
    image: '图片',
    images: '图片',
    page: '页',
    page_label: '第 {label} 页',
    page_of: '第 {current} / {total} 页',
    previous_page: '上一页',
    next_page: '下一页',
    before: '上一页',
    after: '下一页',
    zoom_in: '放大',
    zoom_out: '缩小',
    reset_zoom: '点击恢复默认缩放 (100%)',
    reset_view: '重置视图',
    rotate: '旋转',
    fullscreen: '全屏',
    exit_fullscreen: '退出全屏',
    single_page: '单页',
    double_page: '双页',
    single_page_tooltip: '单页浏览模式',
    double_page_tooltip: '双页对开模式',
    fit_readable: '舒适阅读',
    fit_viewport: '适应屏幕',
    fit_readable_tooltip: '切换至舒适阅读尺寸',
    fit_viewport_tooltip: '缩放至完整适应屏幕',
    thumbnails_tooltip: '页面缩略图',
    converting_pdf_flipbook: '正在将 PDF 菜单转换为高清翻页视图...',
    pdf_page_number: 'PDF 第 {page} 页',
    open_pdf_new_tab: '在新标签页打开 PDF',
    open_new_tab: '新标签页打开',
    pdf_display_error_title: '无法直接预览 PDF 文件',
    pdf_load_error: '无法加载 PDF 文档。',
    try_default_viewer: '尝试默认浏览器视图',
    no_pages: '暂无页面',
    view_lang_doc: '查看{lang}版本',

    // Services List & Detail Pages
    services_badge: '度假设施',
    services_eyebrow: '尊享康体与配套服务',
    services_page_title: '度假村服务与体验',
    services_page_subtitle:
      '体验精心筹备的四星级休闲与康体设施，助您放松身心、焕发活力。',
    services_default_desc: '专为和平迪石度假村入住宾客提供的星级配套服务。',
    services_view_detail: '查看服务详情',
    services_empty_title: '服务信息更新中',
    services_empty_desc:
      '服务列表正在更新中。如需即时帮助，请联系前台或 24 小时礼宾部。',
    services_back_list: '返回服务列表',
    service_detail_badge: '四星级服务',
    service_standard_4star: '国际四星级服务标准',
    hours: '营业时间',
    service_hours_label: '营业时间：',
    location: '位置',
    service_location_label: '所在位置：',
    service_gallery_title: '环境与实景展示',
    service_booking_title: '预约与咨询服务',
    service_booking_desc:
      '为确保为您提供最周到的空间与时段安排，建议提前联系前台或礼宾部进行预约。',
    service_booking_cta: '客房内请拨打 0',
    service_type_gym: '健身中心',
    service_type_bar: '酒吧与酒廊',
    'service_type_business-center': '商务中心',
    service_type_spa: '水疗与养生',
    service_type_pool: '泳池',
    service_type_restaurant: '餐厅',
    service_type_concierge: '礼宾服务',
    service_type_other: '配套设施',

    // Information Page
    info_badge: '宾客须知',
    info_eyebrow: '实用入住手册',
    info_page_title: '入住须知与指南',
    info_page_subtitle:
      '涵盖高速无线网络、入住规定、内线电话号码及度假期间的各项贴心提示。',
    info_support_247: '24/7 全天候支持',
    info_guest_care: '和平迪石宾客服务中心',
    info_empty_title: '信息更新中',
    info_empty_desc:
      '宾客指南正在完善中。如需即时协助，请联系前台或拨打分机 0。',
    wifi_password: 'Wi-Fi 密码',
    phone_guide: '电话使用指南',
    tv_channels: '电视频道列表',
    room_info: '客房信息',
    info_cat_wifi: '无线网络 Wi-Fi',
    info_cat_phone: '内线电话',
    info_cat_tv: '电视频道',
    'info_cat_room-info': '客房信息',
    info_cat_safety: '安全须知',
    info_cat_guide: '入住手册',
    info_cat_general: '常规信息',
    info_quick_section: '快速查阅',
    info_quick_subtitle: '入住常用核心信息，一目了然',
    info_guides_section: '入住指南与实用手册',
    info_guides_subtitle: '点击卡片打开全屏视图，支持快速搜索与翻页浏览',
    info_view_detail: '查看详情',
    info_back: '入住指南',
    info_copy: '复制',
    info_copied: '已复制',
    info_type_table: '查询列表',
    info_type_pdf: 'PDF 文档',
    info_type_image: '图片',
    info_type_guide: '详细指南',
    info_view_content: '正文内容',
    info_table_preview: '完整查询表格（共 {rows} 行）—— 点击展开并快速搜索。',
    info_doc_preview: '详细电子文档 —— 点击打开全屏阅读器。',
    info_search_placeholder: '快速搜索表格内容（例如：VTV、SCTV、频道号...）',
    info_search_matches: '找到 {count} 条匹配记录',
    info_search_no_results: '未找到与“{query}”匹配的内容',
    info_clear_search: '清除',

    // Floor Plan List & Interactive Detail
    floor_plan_badge: '度假村地图',
    floor_plan_eyebrow: '空间布局与导览',
    floor_plan_page_title: '客房分布与楼层平面图',
    floor_plan_page_subtitle:
      '详细查看各楼层平面布局、度假别墅及客房方位，方便您在度假村内轻松出行。',
    floor_plan_rooms_count: '{count} 间客房',
    floor_plan_default_desc: '包含客房分布与安全通道的详细楼层平面图。',
    floor_plan_view_interactive: '查看交互式平面图',
    floor_plan_empty_title: '平面图更新中',
    floor_plan_empty_desc:
      '电子楼层平面图正在数字化整理中。如需纸质导览图，请向前台索取。',
    floor_plan_back: '平面图列表',
    floor_plan_room_label: '{number} 号房',
    floor_plan_room_default_desc: '舒适雅致的度假客房，秉承国际四星级品质标准。',
    floor_plan_rotate_tooltip: '旋转平面图',
    no_floor_plan: '暂无平面图',
    room_type_standard: '标准房',
    room_type_deluxe: '豪华房',
    room_type_suite: '套房',
    room_type_villa: '别墅',
  },
};

export function getTranslation(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const safeLang = normalizeLanguage(lang);
  let translation =
    translations[safeLang]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      translation = translation.replace(
        new RegExp(`\\{${paramKey}\\}`, 'g'),
        String(paramValue)
      );
    });
  }

  return translation;
}

/**
 * Translate a known category / enum-like key (e.g. 'wifi', 'gym', 'deluxe')
 * using `<prefix><normalizedKey>`, falling back to the original raw label if custom.
 */
export function translateCategory(
  lang: Language,
  prefix: string,
  rawKey: string | null | undefined
): string {
  if (!rawKey) return '';
  const key = `${prefix}${rawKey.trim().toLowerCase()}`;
  const safeLang = normalizeLanguage(lang);
  const direct = translations[safeLang]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key];
  return direct ?? rawKey;
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const base = candidate.toLowerCase().split(/[-_]/)[0];
    if (base === 'vi' || base === 'en' || base === 'zh') {
      return base;
    }
  }

  return DEFAULT_LANGUAGE;
}
