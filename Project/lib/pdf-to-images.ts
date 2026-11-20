export interface PdfConversionProgress {
  currentPage: number;
  totalPages: number;
  fileName: string;
}

/**
 * Converts a PDF File or PDF URL into an array of high-resolution JPEG File objects
 * in the browser using pdfjs-dist and HTML5 Canvas.
 */
export async function convertPdfToImageFiles(
  source: File | string,
  options: {
    scale?: number;
    quality?: number;
    onProgress?: (progress: PdfConversionProgress) => void;
  } = {}
): Promise<File[]> {
  const { scale = 2.0, quality = 0.88, onProgress } = options;

  // Dynamically import pdfjs-dist on the client and point to exact matching worker version
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.${pdfjsLib.version}.min.mjs`;

  let data: ArrayBuffer;
  let baseName = 'flipbook-page';

  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Không thể tải file PDF (${res.status})`);
    }
    data = await res.arrayBuffer();
    const parts = source.split('/');
    const lastPart = parts[parts.length - 1] || 'document.pdf';
    baseName = lastPart.replace(/\.pdf$/i, '');
  } else {
    data = await source.arrayBuffer();
    baseName = source.name.replace(/\.pdf$/i, '');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
  });

  const pdfDocument = await loadingTask.promise;
  const totalPages = pdfDocument.numPages;
  const imageFiles: File[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({
        currentPage: pageNum,
        totalPages,
        fileName: typeof source === 'string' ? baseName : source.name,
      });
    }

    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Không thể khởi tạo Canvas 2D context để chuyển đổi PDF');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Fill white background for transparent PDFs
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Không thể xuất ảnh cho trang ${pageNum}`));
        },
        'image/jpeg',
        quality
      );
    });

    const pageFileName = `${baseName}-page-${String(pageNum).padStart(2, '0')}.jpg`;
    const imageFile = new File([blob], pageFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    imageFiles.push(imageFile);
  }

  return imageFiles;
}

/**
 * Process a list of selected files (mix of images and PDFs), automatically
 * splitting any PDF into individual page image files.
 */
export async function expandFilesWithPdfConversion(
  files: File[],
  onProgress?: (progress: PdfConversionProgress) => void
): Promise<File[]> {
  const result: File[] = [];

  for (const file of files) {
    const isPDF =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPDF) {
      const pageFiles = await convertPdfToImageFiles(file, { onProgress });
      result.push(...pageFiles);
    } else if (file.type.startsWith('image/')) {
      result.push(file);
    }
  }

  return result;
}
