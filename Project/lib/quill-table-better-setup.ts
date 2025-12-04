// Setup quill-table-better module
let isRegistered = false;

export async function setupQuillTableBetter() {
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

    // Import quill-table-better
    const QuillTableBetterModule = await import('quill-table-better');
    const QuillTableBetter = QuillTableBetterModule.default || QuillTableBetterModule;
    
    if (!QuillTableBetter) {
      console.warn('quill-table-better module not found');
      return false;
    }

    // Đăng ký module
    Quill.register({
      'modules/table-better': QuillTableBetter
    }, true);

    isRegistered = true;
    console.log('quill-table-better registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register quill-table-better:', error);
    return false;
  }
}




