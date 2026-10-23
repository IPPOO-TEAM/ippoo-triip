import { describe, it, expect } from 'vitest';
import { sanitizeCSSIdentifier, sanitizeCSSValue } from '../utils/security';

describe('Security utilities - CSS Sanitization', () => {
  describe('sanitizeCSSIdentifier', () => {
    it('allows valid alphanumeric identifiers, dashes, and underscores', () => {
      expect(sanitizeCSSIdentifier('chart-123_abc')).toBe('chart-123_abc');
    });

    it('strips spaces, quotes, brackets, and special characters', () => {
      expect(sanitizeCSSIdentifier('chart-123" ; body { background: red; }')).toBe('chart-123bodybackgroundred');
      expect(sanitizeCSSIdentifier('chart<script>alert(1)</script>')).toBe('chartscriptalert1script');
    });

    it('handles non-string inputs safely', () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe('');
      expect(sanitizeCSSIdentifier(undefined as any)).toBe('');
    });
  });

  describe('sanitizeCSSValue', () => {
    it('allows valid CSS colors and values', () => {
      expect(sanitizeCSSValue('#ff0000')).toBe('#ff0000');
      expect(sanitizeCSSValue('hsl(200, 50%, 50%)')).toBe('hsl(200, 50%, 50%)');
      expect(sanitizeCSSValue('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    });

    it('strips dangerous HTML tags, delimiters, and CSS breakout payloads', () => {
      expect(sanitizeCSSValue('red; } body { background: blue; }')).toBe('red  body  background: blue ');
      expect(sanitizeCSSValue('red</style><script>alert(1)</script>')).toBe('redalert(1)');
    });

    it('strips url() and expression() function calls', () => {
      expect(sanitizeCSSValue('url("https://malicious.com/steal")')).toBe('"https://malicious.com/steal")');
      expect(sanitizeCSSValue('expression(alert(1))')).toBe('alert(1))');
    });

    it('handles non-string inputs safely', () => {
      expect(sanitizeCSSValue(123 as any)).toBe('');
      expect(sanitizeCSSValue(null as any)).toBe('');
    });
  });
});
