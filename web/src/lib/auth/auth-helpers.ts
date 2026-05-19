/**
 * Authorization Helper Functions
 *
 * Utilities for role-based access control (RBAC) throughout the application.
 * Use these functions to check user permissions in both server and client components.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';

import { getRoleLevel, UserRole } from '@/types/roles';

import { auth } from './auth';

/**
 * Check if a user has a specific role
 *
 * @param user - The user object from session (must have role field)
 * @param role - The role to check for
 * @returns true if user has the exact role specified
 */
export function hasRole(
  user: { role: UserRole } | null | undefined,
  role: UserRole,
): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 *
 * @param user - The user object from session
 * @param roles - Array of roles to check
 * @returns true if user has at least one of the specified roles
 */
export function hasAnyRole(
  user: { role: UserRole } | null | undefined,
  roles: UserRole[],
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user's role meets or exceeds the minimum required role level
 * Uses role hierarchy to determine if user has sufficient privileges
 *
 * @param user - The user object from session
 * @param minimumRole - The minimum role level required
 * @returns true if user's role level is >= minimum role level
 */
export function hasMinimumRole(
  user: { role: UserRole } | null | undefined,
  minimumRole: UserRole,
): boolean {
  if (!user) return false;
  return getRoleLevel(user.role) >= getRoleLevel(minimumRole);
}

/**
 * Server-side middleware function to require authentication
 * Throws error if not authenticated (use requireAuth from auth-server.ts for
 * redirect-based protection in Server Components and layouts)
 *
 * @returns Session if authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized - authentication required');
  }
  return session;
}

/**
 * Server-side function to require a specific role
 * Throws error if user doesn't have the required role
 *
 * @param role - The role required to access the resource
 * @returns Session if user has required role
 */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await requireAuth();
  if (!hasRole(session.user, role)) {
    console.error(
      `Authorization failed: requires ${role} role, user ${session.user.id} has ${session.user.role}`,
    );
    throw new Error('Forbidden - insufficient permissions');
  }
  return session;
}

/**
 * Server-side function to require minimum role level
 * Throws error if user doesn't meet minimum role requirement
 *
 * @param minimumRole - The minimum role level required
 * @returns Session if user meets minimum role requirement
 */
export async function requireMinimumRole(
  minimumRole: UserRole,
): Promise<Session> {
  const session = await requireAuth();
  if (!hasMinimumRole(session.user, minimumRole)) {
    console.error(
      `Authorization failed: requires minimum ${minimumRole} role (level ${getRoleLevel(minimumRole)}), user ${session.user.id} has ${session.user.role} (level ${getRoleLevel(session.user.role)})`,
    );
    throw new Error('Forbidden - insufficient permissions');
  }
  return session;
}

/**
 * Server-side function to require any of the specified roles
 *
 * @param roles - Array of acceptable roles
 * @returns Session if user has one of the specified roles
 */
export async function requireAnyRole(roles: UserRole[]): Promise<Session> {
  const session = await requireAuth();
  if (!hasAnyRole(session.user, roles)) {
    console.error(
      `Authorization failed: requires one of ${roles.join(', ')}, user ${session.user.id} has ${session.user.role}`,
    );
    throw new Error('Forbidden - insufficient permissions');
  }
  return session;
}

/**
 * API route wrapper to protect endpoints with role-based access control
 *
 * @param handler - The API route handler function
 * @param options - Protection options (role, minimumRole, or roles array)
 * @returns Wrapped handler with authorization checks
 */
export function withRoleProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { role?: UserRole; minimumRole?: UserRole; roles?: UserRole[] },
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await auth();

      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - authentication required' },
          { status: 401 },
        );
      }

      if (options.role && !hasRole(session.user, options.role)) {
        console.error(
          `API authorization failed: requires ${options.role} role, user ${session.user.id} has ${session.user.role}`,
        );
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions' },
          { status: 403 },
        );
      }

      if (
        options.minimumRole &&
        !hasMinimumRole(session.user, options.minimumRole)
      ) {
        console.error(
          `API authorization failed: requires minimum ${options.minimumRole} role, user ${session.user.id} has ${session.user.role}`,
        );
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions' },
          { status: 403 },
        );
      }

      if (options.roles && !hasAnyRole(session.user, options.roles)) {
        console.error(
          `API authorization failed: requires one of ${options.roles.join(', ')}, user ${session.user.id} has ${session.user.role}`,
        );
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions' },
          { status: 403 },
        );
      }

      return await handler(request);
    } catch (error) {
      console.error('Authorization error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  };
}

/**
 * Check if user is authorized to perform an action on a resource.
 * Implements resource-based access control for the task management application.
 *
 * @param user - The user object from session
 * @param resource - The resource being accessed (e.g., 'task', 'user-profile')
 * @param action - The action being performed (e.g., 'read', 'write', 'delete')
 * @returns true if user is authorized
 */
export function isAuthorized(
  user: { role: UserRole; id?: string } | null | undefined,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin',
): boolean {
  if (!user) return false;

  switch (resource) {
    case 'user-profile':
      if (action === 'read') return true; // All authenticated users can read profiles
      if (action === 'write') return true; // All authenticated users can update own profile
      if (action === 'delete') return hasRole(user, UserRole.ADMIN);
      if (action === 'admin') return hasRole(user, UserRole.ADMIN);
      break;

    case 'task':
      if (action === 'read') return true; // All authenticated users can read tasks
      if (action === 'write') return true; // All authenticated users can update tasks
      if (action === 'delete') return hasRole(user, UserRole.ADMIN);
      if (action === 'admin') return hasRole(user, UserRole.ADMIN);
      break;

    case 'system-settings':
      return hasRole(user, UserRole.ADMIN);

    default:
      return hasRole(user, UserRole.ADMIN);
  }

  return false;
}
