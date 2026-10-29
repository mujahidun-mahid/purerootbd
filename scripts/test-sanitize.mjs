import assert from 'node:assert/strict';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const sourcePath = path.join(repoRoot, 'lib', 'sanitize.js');
const generatedPath = path.join(repoRoot, 'lib', '.sanitize-regression.tmp.mjs');

// The app uses ESM source files without "type": "module" because Next.js
// compiles them. Copy the exact source to an .mjs path so Node can import it.
writeFileSync(generatedPath, readFileSync(sourcePath, 'utf8'), 'utf8');

let sanitizeCmsHtml;
try {
  ({ sanitizeCmsHtml } = await import(pathToFileURL(generatedPath).href));
} finally {
  try { unlinkSync(generatedPath); } catch {}
}

const cases = [];
function test(name, fn) {
  cases.push({ name, fn });
}

test('returns an empty string for missing or non-string input', () => {
  assert.equal(sanitizeCmsHtml(undefined), '');
  assert.equal(sanitizeCmsHtml(null), '');
  assert.equal(sanitizeCmsHtml(''), '');
  assert.equal(sanitizeCmsHtml(42), '');
  assert.equal(sanitizeCmsHtml({ html: '<p>x</p>' }), '');
});

test('preserves supported CMS formatting and table markup', () => {
  const input = '<h2 class="title">Heading</h2><p class="lead">Hello <strong>world</strong></p><ul><li>One</li></ul><table><tbody><tr><th colspan="2">H</th></tr><tr><td>Cell</td></tr></tbody></table>';
  const output = sanitizeCmsHtml(input);
  assert.match(output, /<h2 class="title">Heading<\/h2>/);
  assert.match(output, /<p class="lead">Hello <strong>world<\/strong><\/p>/);
  assert.match(output, /<ul><li>One<\/li><\/ul>/);
  assert.match(output, /<th colspan="2">H<\/th>/);
  assert.match(output, /<td>Cell<\/td>/);
});

test('strips script elements and their contents', () => {
  const output = sanitizeCmsHtml('<p>Safe</p><script>alert("xss")</script><p>After</p>');
  assert.equal(output, '<p>Safe</p><p>After</p>');
  assert.doesNotMatch(output, /script|alert/i);
});

test('strips event-handler attributes from permitted tags', () => {
  const output = sanitizeCmsHtml('<p onclick="alert(1)" class="ok">Text</p><img src="https://example.com/a.png" onerror="alert(2)" alt="A">');
  assert.doesNotMatch(output, /onclick|onerror|alert\(/i);
  assert.match(output, /class="ok"/);
  assert.match(output, /src="https:\/\/example.com\/a.png"/);
  assert.match(output, /alt="A"/);
});

test('drops javascript: links and forces safe rel attributes', () => {
  const output = sanitizeCmsHtml('<a href="javascript:alert(1)" target="_blank">Bad</a><a href="https://example.com" target="_blank">Good</a>');
  assert.doesNotMatch(output, /href="javascript:/i);
  assert.match(output, /<a target="_blank" rel="noopener noreferrer nofollow">Bad<\/a>/);
  assert.match(output, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer nofollow">Good<\/a>/);
});

test('allows http/https images but rejects data: image sources', () => {
  const output = sanitizeCmsHtml('<img src="data:image/svg+xml,<svg/onload=alert(1)>" alt="bad"><img src="https://example.com/ok.jpg" alt="ok">');
  assert.doesNotMatch(output, /data:/i);
  assert.match(output, /<img alt="bad" \/>/);
  assert.match(output, /<img src="https:\/\/example.com\/ok.jpg" alt="ok" \/>/);
});

test('allows mailto and tel links but removes unsupported schemes', () => {
  const output = sanitizeCmsHtml('<a href="mailto:test@example.com">Mail</a><a href="tel:+123">Call</a><a href="ftp://example.com">FTP</a>');
  assert.match(output, /href="mailto:test@example.com"/);
  assert.match(output, /href="tel:\+123"/);
  assert.doesNotMatch(output, /ftp:/i);
});

test('caps oversized input before sanitizing', () => {
  const output = sanitizeCmsHtml('x'.repeat(200_005));
  assert.equal(output.length, 200_000);
});

test('does not recurse without bound on nested discarded iframe fallbacks', () => {
  let input = 'fallback-safe';
  for (let i = 0; i < 2000; i += 1) input = `<iframe>${input}</iframe>`;
  let output;
  assert.doesNotThrow(() => { output = sanitizeCmsHtml(input); });
  assert.match(output, /fallback-safe/);
  assert.doesNotMatch(output, /<iframe/i);
});

let passed = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    passed += 1;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}
console.log(`TOTAL=${cases.length} PASSED=${passed} FAILED=${cases.length - passed}`);
