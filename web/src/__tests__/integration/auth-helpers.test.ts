/**
 * Integration Test: Auth Helpers & Role-Based Access Control
 *
 * These tests verify OUR authorization logic, not NextAuth internals.
 *
 * Why these tests are valid:
 * - `withRoleProtection` is our custom API wrapper - we test its HTTP responses
 * - `hasRole`, `hasMinimumRole`, etc. are our business logic functions
 * - We mock NextAuth (the external dependency) to test our integration layer
 *
 * We're testing: "Does our auth system return correct HTTP status codes?"
 * We're NOT testing: "Does NextAuth work correctly?"
 */

import { vi } from 'vitest';
import type { Session } from 'next-auth';

// Type for the mocked auth function (session getter overload)
type MockAuthFn = ReturnType<typeof vi.fn<() => Promise<Session | null>>>;

// Mock next-auth and related modules before importing auth-helpers
vi.mock('next-auth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  __esModule: true,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import {
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  isAuthorized,
  withRoleProtection,
} from '@/lib/auth/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import {
  UserRole,
  getRoleLevel,
  isValidRole,
  DEFAULT_ROLE,
} from '@/types/roles';

describe('Role Utilities', () => {
  it('should have correct hierarchy levels (ADMIN > MEMBER)', () => {
    expect(getRoleLevel(UserRole.ADMIN)).toBe(100);
    expect(getRoleLevel(UserRole.MEMBER)).toBe(10);
  });

  it('should validate role strings correctly', () => {
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('member')).toBe(true);
    expect(isValidRole('invalid')).toBe(false);
  });

  it('should default new users to MEMBER', () => {
    expect(DEFAULT_ROLE).toBe(UserRole.MEMBER);
  });
});

describe('Auth Helper Functions', () => {
  it('hasRole - should match exact role only', () => {
    const adminUser = { role: UserRole.ADMIN };
    expect(hasRole(adminUser, UserRole.ADMIN)).toBe(true);
    expect(hasRole(adminUser, UserRole.MEMBER)).toBe(false);
  });

  it('hasAnyRole - should match if user has any of the specified roles', () => {
    const memberUser = { role: UserRole.MEMBER };
    expect(hasAnyRole(memberUser, [UserRole.ADMIN, UserRole.MEMBER])).toBe(
      true,
    );
    expect(hasAnyRole(memberUser, [UserRole.ADMIN])).toBe(false);
  });

  it('hasMinimumRole - should allow higher roles to access lower-level resources', () => {
    const adminUser = { role: UserRole.ADMIN };
    const memberUser = { role: UserRole.MEMBER };

    // Admin can access everything
    expect(hasMinimumRole(adminUser, UserRole.MEMBER)).toBe(true);
    expect(hasMinimumRole(adminUser, UserRole.ADMIN)).toBe(true);

    // Member cannot access admin-level resources
    expect(hasMinimumRole(memberUser, UserRole.ADMIN)).toBe(false);
    expect(hasMinimumRole(memberUser, UserRole.MEMBER)).toBe(true);
  });

  it('should return false for null or undefined user', () => {
    expect(hasRole(null, UserRole.ADMIN)).toBe(false);
    expect(hasAnyRole(undefined, [UserRole.ADMIN])).toBe(false);
    expect(hasMinimumRole(null, UserRole.MEMBER)).toBe(false);
  });
});

describe('Resource-Based Access Control', () => {
  it('isAuthorized - should enforce resource-specific permissions', () => {
    const adminUser = { role: UserRole.ADMIN };
    const memberUser = { role: UserRole.MEMBER };

    // System settings - admin only
    expect(isAuthorized(adminUser, 'system-settings', 'read')).toBe(true);
    expect(isAuthorized(memberUser, 'system-settings', 'read')).toBe(false);

    // Tasks - members can read and write, only admin can delete
    expect(isAuthorized(memberUser, 'task', 'read')).toBe(true);
    expect(isAuthorized(memberUser, 'task', 'write')).toBe(true);
    expect(isAuthorized(memberUser, 'task', 'delete')).toBe(false);
    expect(isAuthorized(adminUser, 'task', 'delete')).toBe(true);
  });

  it('isAuthorized - should require admin for unknown resources', () => {
    const adminUser = { role: UserRole.ADMIN };
    const memberUser = { role: UserRole.MEMBER };

    expect(isAuthorized(adminUser, 'unknown-resource', 'read')).toBe(true);
    expect(isAuthorized(memberUser, 'unknown-resource', 'read')).toBe(false);
  });
});

describe('withRoleProtection - API Route Wrapper', () => {
  // Cast auth to our mock type for the session getter overload
  const mockAuth = auth as unknown as MockAuthFn;
  const mockRequest = new NextRequest('http://localhost/api/test');

  // Helper to create a mock handler that returns success
  const createMockHandler = () =>
    vi.fn().mockResolvedValue(NextResponse.json({ success: true }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      role: UserRole.ADMIN,
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized - authentication required');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should return 403 when user lacks required role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.MEMBER },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      role: UserRole.ADMIN,
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden - insufficient permissions');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler when user has required role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.ADMIN },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      role: UserRole.ADMIN,
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(handler).toHaveBeenCalledWith(mockRequest);
  });

  it('should support minimumRole option for hierarchy-based checks', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.ADMIN },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      minimumRole: UserRole.MEMBER,
    });

    const response = await protectedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('should return 403 when user does not meet minimum role requirement', async () => {
    // A user with MEMBER role cannot access ADMIN-level endpoints
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.MEMBER },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      minimumRole: UserRole.ADMIN,
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden - insufficient permissions');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should support roles array option for multiple allowed roles', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.MEMBER },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      roles: [UserRole.ADMIN, UserRole.MEMBER],
    });

    const response = await protectedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('should return 403 when user role is not in allowed roles array', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.MEMBER },
      expires: new Date().toISOString(),
    });

    const handler = createMockHandler();
    const protectedHandler = withRoleProtection(handler, {
      roles: [UserRole.ADMIN],
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden - insufficient permissions');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should return 500 when handler throws an error', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: UserRole.ADMIN },
      expires: new Date().toISOString(),
    });

    const handler = vi.fn().mockRejectedValue(new Error('Database error'));
    const protectedHandler = withRoleProtection(handler, {
      role: UserRole.ADMIN,
    });

    const response = await protectedHandler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
