import { describe, it, expect } from 'vitest';
import { sanitizeCSSIdentifier, sanitizeCSSValue } from '../utils/security';

describe('Security Utilities - CSS Sanitization', () => {
  describe('sanitizeCSSIdentifier', () => {
    it('allows valid alphanumeric identifiers, hyphens, and underscores', () => {
      expect(sanitizeCSSIdentifier('chart-123_abc')).toBe('chart-123_abc');
    });

    it('strips special characters, quotes, and space characters', () => {
      expect(sanitizeCSSIdentifier('chart-123" ; body { color: red; }')).toBe('chart-123bodycolorred');
      expect(sanitizeCSSIdentifier('my:chart.id')).toBe('mychartid');
    });

    it('handles non-string inputs gracefully', () => {
      // @ts-expect-error Testing invalid runtime input
      expect(sanitizeCSSIdentifier(null)).toBe('');
      // @ts-expect-error Testing invalid runtime input
      expect(sanitizeCSSIdentifier(undefined)).toBe('');
    });
  });

  describe('sanitizeCSSValue', () => {
    it('allows standard color strings and hex values', () => {
      expect(sanitizeCSSValue('#ff0000')).toBe('#ff0000');
      expect(sanitizeCSSValue('hsl(200 50% 50%)')).toBe('hsl(200 50% 50%)');
      expect(sanitizeCSSValue('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    });

    it('strips CSS injection breakout delimiters and comment syntax', () => {
      const malicious = 'red; } body { background: black; } /* comment */';
      expect(sanitizeCSSValue(malicious)).toBe('red  body  background: black  ');
    });

    it('strips dangerous function calls like url() and expression()', () => {
      expect(sanitizeCSSValue('url("http://attacker.com/evil.js")')).toBe('"http://attacker.com/evil.js")');
      expect(sanitizeCSSValue('expression(alert(1))')).toBe('alert(1))');
    });

    it('strips HTML tags', () => {
      expect(sanitizeCSSValue('<b>blue</b>')).toBe('blue');
      expect(sanitizeCSSValue('<script>alert("xss")</script>blue')).toBe('alert("xss")blue');
    });

    it('handles non-string inputs gracefully', () => {
      // @ts-expect-error Testing invalid runtime input
      expect(sanitizeCSSValue(12345)).toBe('');
    });
  });
});
