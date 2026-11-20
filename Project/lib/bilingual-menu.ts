export interface BilingualMenuMeta {
  __bilingual: true;
  descriptionVi?: string | null;
  nameEn?: string | null;
  descriptionEn?: string | null;
  fileUrlEn?: string | null;
  flipbookEnId?: string | null;
}

export interface ParsedMenuBilingual {
  descriptionVi: string;
  nameEn: string;
  descriptionEn: string;
  fileUrlEn: string;
  flipbookEnId: string;
  hasEnglishVersion: boolean;
}

export function parseMenuBilingual(rawDescription: string | null | undefined): ParsedMenuBilingual {
  if (!rawDescription) {
    return {
      descriptionVi: '',
      nameEn: '',
      descriptionEn: '',
      fileUrlEn: '',
      flipbookEnId: '',
      hasEnglishVersion: false,
    };
  }

  const trimmed = rawDescription.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"__bilingual":true')) {
    try {
      const parsed = JSON.parse(trimmed) as BilingualMenuMeta;
      const fileUrlEn = parsed.fileUrlEn || '';
      const flipbookEnId = parsed.flipbookEnId || '';
      const nameEn = parsed.nameEn || '';
      const descriptionEn = parsed.descriptionEn || '';
      return {
        descriptionVi: parsed.descriptionVi || '',
        nameEn,
        descriptionEn,
        fileUrlEn,
        flipbookEnId,
        hasEnglishVersion: Boolean(fileUrlEn || flipbookEnId || nameEn || descriptionEn),
      };
    } catch {
      // Fallback to plain string
    }
  }

  return {
    descriptionVi: rawDescription,
    nameEn: '',
    descriptionEn: '',
    fileUrlEn: '',
    flipbookEnId: '',
    hasEnglishVersion: false,
  };
}

export function serializeMenuBilingual(input: {
  descriptionVi?: string | null;
  nameEn?: string | null;
  descriptionEn?: string | null;
  fileUrlEn?: string | null;
  flipbookEnId?: string | null;
}): string | null {
  const descriptionVi = input.descriptionVi?.trim() || '';
  const nameEn = input.nameEn?.trim() || '';
  const descriptionEn = input.descriptionEn?.trim() || '';
  const fileUrlEn = input.fileUrlEn?.trim() || '';
  const flipbookEnId = input.flipbookEnId?.trim() || '';

  const hasEnglish = Boolean(nameEn || descriptionEn || fileUrlEn || flipbookEnId);

  if (!hasEnglish) {
    return descriptionVi || null;
  }

  const payload: BilingualMenuMeta = {
    __bilingual: true,
    descriptionVi: descriptionVi || null,
    nameEn: nameEn || null,
    descriptionEn: descriptionEn || null,
    fileUrlEn: fileUrlEn || null,
    flipbookEnId: flipbookEnId || null,
  };

  return JSON.stringify(payload);
}
