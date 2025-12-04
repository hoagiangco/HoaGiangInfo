// Setup Quill với quill-better-table module
let quillSetupDone = false;
let quillSetupPromise: Promise<void> | null = null;

export async function setupQuill() {
  if (quillSetupDone) {
    return;
  }

  // Nếu đang setup, đợi promise hiện tại
  if (quillSetupPromise) {
    return quillSetupPromise;
  }

  quillSetupPromise = (async () => {
    try {
      // Import quill trực tiếp (quill-better-table cần nó như dependency)
      const QuillModule = await import('quill');
      const Quill = QuillModule.default;
      
      if (!Quill) {
        console.warn('Could not import Quill');
        quillSetupDone = true;
        return;
      }

      // Import quill-better-table
      const QuillBetterTableModule = await import('quill-better-table');
      
      // QuillBetterTable thường là default export
      const QuillBetterTable = QuillBetterTableModule.default || QuillBetterTableModule;
      
      if (!QuillBetterTable) {
        console.warn('QuillBetterTable is undefined');
        quillSetupDone = true;
        return;
      }

      // Đăng ký module qua Quill.register - cách đúng cho quill-better-table
      if (Quill.register) {
        try {
          Quill.register({
            'modules/better-table': QuillBetterTable
          }, true);
          
          quillSetupDone = true;
          console.log('Quill better-table module registered successfully');
        } catch (registerError) {
          console.error('Error registering better-table module:', registerError);
          quillSetupDone = true;
        }
      } else {
        console.warn('Quill.register is not available');
        quillSetupDone = true;
      }
    } catch (error) {
      console.error('Could not register quill-better-table:', error);
      quillSetupDone = true;
    }
  })();

  return quillSetupPromise;
}
