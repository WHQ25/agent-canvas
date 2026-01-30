import { describe, it, expect } from 'vitest';
import { generateId } from '../ws-client';

describe('generateId', () => {
  it('should return a string with reasonable length', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    // substring(2, 15) produces 11-13 characters depending on random value
    expect(id.length).toBeGreaterThanOrEqual(10);
    expect(id.length).toBeLessThanOrEqual(13);
  });

  it('should return unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
