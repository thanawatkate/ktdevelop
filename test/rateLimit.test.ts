import { describe, it, expect } from 'vitest';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../src/lib/rateLimit';

describe('Rate Limiter', () => {
  it('allows requests under the limit', () => {
    const ip = '10.0.0.' + Math.floor(Math.random() * 10000);
    const config = { maxRequests: 5, windowMs: 60000 };
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip, config)).toBe(true);
    }
  });

  it('blocks requests that exceed the limit', () => {
    const ip = '10.0.1.' + Math.floor(Math.random() * 10000);
    const config = { maxRequests: 3, windowMs: 60000 };
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(ip, config)).toBe(true);
    }
    expect(checkRateLimit(ip, config)).toBe(false);
  });

  it('extracts client IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    expect(getClientIp(req)).toBe('203.0.113.195');
  });

  it('extracts client IP from x-real-ip when forwarded header is absent', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.1' },
    });
    expect(getClientIp(req)).toBe('198.51.100.1');
  });
});

