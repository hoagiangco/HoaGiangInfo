// Setup quill-better-table module
// File này được import trước để đảm bảo module được đăng ký trước khi Quill được sử dụng

let isRegistered = false;

export async function setupQuillBetterTable() {
  if (isRegistered) {
    return true;
  }

  try {
    // Import Quill
    const QuillModule = await import('quill');
    const Quill = QuillModule.default;
    
    if (!Quill) {
      console.warn('Quill not available');
      return false;
    }

    // Import quill-better-table
    const BetterTableModule = await import('quill-better-table');
    const BetterTable = BetterTableModule.default || BetterTableModule;
    
    if (!BetterTable) {
      console.warn('quill-better-table module not found');
      return false;
    }

    // Đăng ký module
    Quill.register({
      'modules/better-table': BetterTable
    }, true);

    // Đăng ký keyboard bindings nếu có
    try {
      if (BetterTable.keyboardBindings && Quill.import) {
        const Keyboard = Quill.import('modules/keyboard');
        if (Keyboard && BetterTable.keyboardBindings) {
          Object.assign(Keyboard.bindings, BetterTable.keyboardBindings);
        }
      }
    } catch (kbError) {
      console.warn('Could not register keyboard bindings:', kbError);
    }

    isRegistered = true;
    console.log('quill-better-table registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register quill-better-table:', error);
    return false;
  }
}

// Tự động đăng ký khi file được import (chỉ chạy trên client)
if (typeof window !== 'undefined') {
  setupQuillBetterTable();
}

