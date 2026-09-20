import { describe, expect, it } from 'vitest';
import { AppError, ERROR_CODES } from './errors.js';

describe('AppError', () => {
  it('mapeia códigos para status HTTP', () => {
    expect(new AppError('UNAUTHENTICATED', 'x').status).toBe(ERROR_CODES.UNAUTHENTICATED);
    expect(new AppError('FORBIDDEN', 'x').status).toBe(ERROR_CODES.FORBIDDEN);
    expect(new AppError('NOT_FOUND', 'x').status).toBe(ERROR_CODES.NOT_FOUND);
    expect(new AppError('INSUFFICIENT_STOCK', 'x').status).toBe(ERROR_CODES.INSUFFICIENT_STOCK);
    expect(new AppError('RATE_LIMITED', 'x').status).toBe(ERROR_CODES.RATE_LIMITED);
  });
});
