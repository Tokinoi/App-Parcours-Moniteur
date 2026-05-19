vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  storeToken: vi.fn(),
  getStoredToken: vi.fn(),
  clearStoredToken: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestCode, verifyCode } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { storeToken } from '@/lib/session';

describe('lib/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requestCode calls apiRequest with email payload', async () => {
    (apiRequest as any).mockResolvedValue({ message: 'ok' });

    const email = 'alice@example.com';
    await requestCode(email);

    expect(apiRequest).toHaveBeenCalled();
    const [path, opts] = (apiRequest as any).mock.calls[0];
    expect(path).toBe('/api/auth/request-code');
    expect(opts).toMatchObject({ method: 'POST' });
  });

  it('verifyCode stores token when returned', async () => {
    (apiRequest as any).mockResolvedValue({ token: 'abc123' });

    const result = await verifyCode('bob@example.com', '0000');

    expect(storeToken).toHaveBeenCalledWith('abc123');
    expect(result.token).toBe('abc123');
  });

  it('verifyCode throws when no token returned', async () => {
    (apiRequest as any).mockResolvedValue({});

    await expect(verifyCode('c@example.com', '1111')).rejects.toThrow();
  });
});
