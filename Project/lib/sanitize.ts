import rawSanitizeHtml from 'sanitize-html';

/** Sanitises rich-text (CKEditor/Markdown-as-HTML) before it is stored or rendered. */
export function sanitizeRichText(html: string): string {
  return rawSanitizeHtml(html, {
    allowedTags: [
      ...rawSanitizeHtml.defaults.allowedTags,
      'h1', 'h2', 'img', 'figure', 'figcaption', 'u', 's', 'span', 'del', 'ins',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: rawSanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

export const sanitizeHtml = sanitizeRichText;
