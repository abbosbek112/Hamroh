import { describe, expect, it, vi } from 'vitest';

// IMPORTANT:
// logger.ts reads import.meta.env at module init time.
// We keep these tests lightweight: validate that calling methods doesn't throw
// and that error always logs to console.error.

describe('utils/logger', () => {
  it('logger.error always forwards to console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../../utils/logger');

    logger.error(new Error('boom'), { extra: 1 });
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('logger.log does not throw', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('../../utils/logger');

    expect(() => logger.log('hello')).not.toThrow();
    spy.mockRestore();
  });
});

