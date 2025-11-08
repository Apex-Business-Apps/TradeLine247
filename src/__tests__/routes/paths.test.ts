import { describe, expect, it } from 'vitest';
import { paths } from '@/routes/paths';
import { appRoutePaths } from '@/App';

describe('route path coverage', () => {
  it('registers every declared path with the router', () => {
    const missing = Object.values(paths).filter((value) => !appRoutePaths.has(value));
    expect(missing).toStrictEqual([]);
  });
});
