/**
 * Story Metadata:
 * - Route: /auth/signin
 * - Target File: app/auth/signin/page.tsx
 * - Page Action: modify_existing
 *
 * Tests for Epic 1, Story 1: Auth Reconciliation and Role System.
 *
 * Coverage:
 * - AC-5, AC-6, AC-7: Login screen renders POPIA notice, privacy link, and
 *   excludes the "Sign up" link (Unit-testable via RTL)
 * - AC-8: Role enum contains exactly 'admin' | 'member' (Vitest unit)
 *
 * Runtime-only scenarios (AC-1, AC-2, AC-3, AC-4) are covered in the
 * Playwright spec (epic-1-story-1-auth-reconciliation.spec.ts).
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Augment the vitest Assertion type so toHaveNoViolations is typed correctly.
// The matcher is registered at runtime in vitest.setup.ts via expect.extend();
// this declaration extends the TypeScript type without a suppression directive.
declare module 'vitest' {
  interface Assertion<T> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown;
  }
}

// next/navigation and auth-client must be mocked before importing the page
// component because it is a Client Component that calls their hooks/functions.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/lib/auth/auth-client', () => ({
  signIn: vi.fn(),
}));

// Import the real sign-in page — this import WILL FAIL until implemented (TDD red).
import SignInPage from '@/app/auth/signin/page';

// Import role utilities. The DEFAULT_ROLE and getAllRoles assertions WILL FAIL
// until the enum is narrowed to admin|member only (TDD red).
import { isValidRole, getAllRoles, DEFAULT_ROLE } from '@/types/roles';

// ---------------------------------------------------------------------------
// Login screen — UI assertions (AC-5, AC-6, AC-7)
// ---------------------------------------------------------------------------

describe('SignInPage — login form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-7
  it('renders an email field, a password field, and a Sign In button', () => {
    render(<SignInPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  // AC-7
  it('does not render a "Sign up" or "Create account" link', () => {
    render(<SignInPage />);

    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
  });

  // AC-5
  it('renders the exact POPIA purpose statement (BA-1)', () => {
    render(<SignInPage />);

    expect(
      screen.getByText(
        'We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA).',
      ),
    ).toBeInTheDocument();
  });

  // AC-6
  it('renders a privacy policy link with accessible text referencing the privacy policy (BA-2)', () => {
    render(<SignInPage />);

    // Assert link exists by accessible text; do NOT assert href (BA-2 chose "#" placeholder).
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
  });

  // AC-5, AC-6
  it('has no accessibility violations on page load', async () => {
    const { container } = render(<SignInPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// Role enum — type and runtime guards (AC-8)
// ---------------------------------------------------------------------------

describe('UserRole enum — admin and member only (AC-8)', () => {
  // AC-8
  it('getAllRoles() returns exactly ["admin", "member"] — no template roles present', () => {
    const roles = getAllRoles();
    expect(roles).toHaveLength(2);
    expect(roles).toContain('admin');
    expect(roles).toContain('member');
    // Explicitly verify template roles are absent
    expect(roles).not.toContain('power_user');
    expect(roles).not.toContain('standard_user');
    expect(roles).not.toContain('read_only');
  });

  // AC-8
  it('isValidRole returns true for "admin" and "member"', () => {
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('member')).toBe(true);
  });

  // AC-8
  it('isValidRole returns false for removed template role values', () => {
    expect(isValidRole('power_user')).toBe(false);
    expect(isValidRole('standard_user')).toBe(false);
    expect(isValidRole('read_only')).toBe(false);
  });

  // AC-8
  it('isValidRole returns false for an arbitrary unknown string', () => {
    expect(isValidRole('superadmin')).toBe(false);
  });

  // AC-8 — DEFAULT_ROLE must be 'member' after enum narrowing
  it('DEFAULT_ROLE is "member"', () => {
    expect(DEFAULT_ROLE).toBe('member');
  });
});
