import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/database.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../../config/database.js';
import { healthService } from '../health.service.js';

describe('healthService.checkDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns disconnected status on database failure', async () => {
    const dbError = new Error('connection lost');
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(dbError);

    const result = await healthService.checkDatabase();

    expect(result).toEqual({ db: 'disconnected' });
  });
});
