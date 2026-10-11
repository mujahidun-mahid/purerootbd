// Shared server-side validation for admin image uploads.
// Client-supplied MIME types are NOT trusted: the extension/MIME allowlist
// is enforced together with magic-byte sniffing of the actual file content.
// Notably, SVG is rejected outright — an SVG served inline from the public
// storage bucket can execute <script>, i.e. stored XSS for every visitor.

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function sniffImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function validateImageUpload({ declaredType, bytes, maxBytes }) {
  if (!ALLOWED_TYPES.has(declaredType)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' };
  }
  if (!bytes || bytes.length === 0) {
    return { ok: false, error: 'Empty file.' };
  }
  if (bytes.length > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).` };
  }
  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    return { ok: false, error: 'File content is not a valid JPEG, PNG, or WebP image.' };
  }
  if (sniffed !== declaredType) {
    return { ok: false, error: 'File content does not match its declared image type.' };
  }
  return { ok: true, type: sniffed, ext: EXT_BY_TYPE[sniffed] };
}

// Storage delete paths must stay inside their own folder so a crafted
// `path` value cannot remove files outside the expected prefix.
export function isPathInPrefix(path, prefix) {
  if (typeof path !== 'string' || !path) return false;
  if (path.includes('..') || path.startsWith('/')) return false;
  return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
}
