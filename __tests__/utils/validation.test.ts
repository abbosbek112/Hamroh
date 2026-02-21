import { describe, expect, it } from 'vitest';
import { checkSpamAndProfanity, sanitizeInput, validateEmail, validateMessage } from '../../utils/validation';

describe('utils/validation', () => {
  it('validateMessage rejects empty and accepts normal text', () => {
    expect(validateMessage('')).toEqual({ valid: false, error: "Xabar bo'sh bo'lishi mumkin emas" });
    expect(validateMessage('   ')).toEqual({ valid: false, error: "Xabar bo'sh bo'lishi mumkin emas" });
    expect(validateMessage('salom')).toEqual({ valid: true });
  });

  it('validateEmail detects invalid and valid emails', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('test@example.com').valid).toBe(true);
  });

  it('sanitizeInput removes script tags and encodes brackets', () => {
    const raw = `<script>alert("x")</script><b onclick="evil()">hi</b>`;
    const sanitized = sanitizeInput(raw);
    expect(sanitized).not.toMatch(/script/i);
    expect(sanitized).not.toMatch(/on\w+\s*=/i);
    expect(sanitized).toContain('&lt;');
    expect(sanitized).toContain('&gt;');
  });

  it('checkSpamAndProfanity flags profanity', () => {
    const res = checkSpamAndProfanity('you are an idiot');
    expect(res.isSpam).toBe(true);
    expect(res.reason).toBeTruthy();
  });
});

