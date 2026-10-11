import sanitizeHtml from 'sanitize-html';

// Shared allowlist for admin-authored CMS HTML rendered via
// dangerouslySetInnerHTML on public pages. Blocks <script>, event
// handlers, javascript:/data: URLs and other active content while
// keeping the formatting tags the page builder supports.
const OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'span', 'div',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    div: ['class'],
    span: ['class'],
    p: ['class'],
    h1: ['class'],
    h2: ['class'],
    h3: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  // Force safe link behavior even if the admin forgot rel/target.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer nofollow' },
    }),
  },
  enforceHtmlBoundary: true,
};

export function sanitizeCmsHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // Hard cap: CMS blocks are text content, never megabytes of markup.
  const capped = html.length > 200_000 ? html.slice(0, 200_000) : html;
  return sanitizeHtml(capped, OPTIONS);
}
