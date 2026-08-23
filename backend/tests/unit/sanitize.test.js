import { describe, it, expect } from 'vitest';
import { sanitizeValue } from '../../src/middleware/sanitize.js';

describe('sanitizeValue', () => {
  it('strips script tags but keeps inner text', () => {
    const out = sanitizeValue('<script>alert(1)</script>Hello');
    expect(out).not.toContain('<script>');
    expect(out).toContain('Hello');
  });

  it('removes event-handler attributes', () => {
    const out = sanitizeValue('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('alert');
  });

  it('leaves plain strings untouched', () => {
    expect(sanitizeValue('plain text 123')).toBe('plain text 123');
  });

  it('sanitizes nested object values', () => {
    const out = sanitizeValue({ a: '<script>x</script>ok', b: { c: '<script>y</script>deep' } });
    expect(out.a).not.toContain('<script>');
    expect(out.a).toContain('ok');
    expect(out.b.c).not.toContain('<script>');
    expect(out.b.c).toContain('deep');
  });

  it('escapes unknown tags (svg) so they cannot execute', () => {
    const out = sanitizeValue(['clean', '<svg onload=alert(1)>bad']);
    expect(out[0]).toBe('clean');
    expect(out[1]).toContain('&lt;svg'); // escaped, not a live tag
    expect(out[1]).not.toMatch(/<svg/);
  });

  it('documents that benign formatting tags like <b> are allowed by default config', () => {
    expect(sanitizeValue('<b>bold</b>')).toBe('<b>bold</b>');
  });

  it('passes through non-string primitives and nullish values', () => {
    expect(sanitizeValue(42)).toBe(42);
    expect(sanitizeValue(true)).toBe(true);
    expect(sanitizeValue(null)).toBeNull();
    expect(sanitizeValue(undefined)).toBeUndefined();
  });
});
