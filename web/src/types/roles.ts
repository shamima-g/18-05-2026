/**
 * User Role Definitions
 *
 * Task Management Tool for Small Teams.
 * Two roles: admin (full access) and member (standard team member access).
 */

/**
 * User role enum — exactly admin and member.
 * Replaces the 4-value template enum per the FRS.
 */
export enum UserRole {
  /**
   * Full system access — can manage users, tasks, and all resources
   */
  ADMIN = 'admin',

  /**
   * Standard team member access — can view and update assigned tasks
   */
  MEMBER = 'member',
}

/**
 * Role hierarchy defines the privilege level of each role.
 * Higher numbers indicate greater privilege.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MEMBER]: 10,
};

/**
 * Human-readable role descriptions for UI display
 */
export const roleDescriptions: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Full system access',
  [UserRole.MEMBER]: 'Standard team member access',
};

/**
 * Default role assigned to new users if not specified.
 */
export const DEFAULT_ROLE = UserRole.MEMBER;

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get all available roles as an array
 */
export function getAllRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}
