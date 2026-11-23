import rawSanitizeHtml from 'sanitize-html';

/**
 * Normalizes plain text (with `\n` line breaks and no HTML block tags) into `<p>` + `<br />`,
 * then sanitizes rich-text HTML safely for rendering via dangerouslySetInnerHTML.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  const trimmed = html.trim();
  const hasHtmlStructure = /<(p|div|br|table|ul|ol|li|h[1-6]|blockquote|figure)\b/i.test(
    trimmed
  );
  const prepared = hasHtmlStructure
    ? html
    : `<p>${trimmed.replace(/\r\n/g, '\n').replace(/\n/g, '<br />')}</p>`;

  return rawSanitizeHtml(prepared, {
    allowedTags: [
      ...rawSanitizeHtml.defaults.allowedTags,
      'h1',
      'h2',
      'img',
      'figure',
      'figcaption',
      'u',
      's',
      'span',
      'del',
      'ins',
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

/**
 * Strip HTML tags to generate clean plain-text previews & detect content characteristics.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return rawSanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasHtmlTable(html: string): boolean {
  return /<table\b/i.test(html || '');
}

export function countHtmlTableRows(html: string): number {
  if (!html) return 0;
  const matches = html.match(/<tr\b/gi);
  return matches ? matches.length : 0;
}

/**
 * Heuristic deciding if an Information item should render as a compact "Quick Access" card
 * directly on the list page, vs a summary card that opens the full-width detail page.
 */
export function isQuickInfoContent(options: {
  html: string;
  hasAttachment: boolean;
}): boolean {
  if (options.hasAttachment) return false;
  if (hasHtmlTable(options.html)) return false;

  const plain = stripHtmlToText(options.html);
  const lineBreaks = (options.html.match(/<br\s*\/?>|<\/p>|<\/li>|\n/gi) || []).length;
  return plain.length <= 260 && lineBreaks <= 6;
}

export const sanitizeHtml = sanitizeRichText;
