import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockVerifyEmail, mockCaptureException, mockParseApiError } = vi.hoisted(() => ({
  mockVerifyEmail: vi.fn(),
  mockCaptureException: vi.fn(),
  mockParseApiError: vi.fn(() => ({ code: 'CONFLICT', message: 'Conflict' })),
}));

vi.mock('@/api/auth.api', () => ({
  useVerifyEmailMutation: () => [mockVerifyEmail],
}));
vi.mock('@/config/sentry', () => ({
  Sentry: { captureException: mockCaptureException },
}));
vi.mock('@/hooks/useApiError', () => ({
  parseApiError: () => mockParseApiError(),
}));

import VerifyEmailPage from './VerifyEmailPage';

describe('VerifyEmailPage telemetry (FE-008)', () => {
  beforeEach(() => {
    mockVerifyEmail.mockReset();
    mockCaptureException.mockReset();
    mockParseApiError.mockReset();
  });

  it('does not report to Sentry when email is already verified', async () => {
    mockParseApiError.mockReturnValue({ code: 'CONFLICT', message: 'Conflict' });
    mockVerifyEmail.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('verify failed')),
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=test-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  it('reports unexpected verification errors to Sentry', async () => {
    mockParseApiError.mockReturnValue({ code: 'INTERNAL_ERROR', message: 'Server error' });
    mockVerifyEmail.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('server error')),
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=test-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            operation: 'verifyEmail',
            route: '/verify-email',
            hasToken: true,
            outcomeBranch: 'error',
          }),
        }),
      );
    });
  });
});
