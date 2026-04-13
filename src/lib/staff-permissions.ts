import { useAuthStore } from '@/stores/auth';

/**
 * Staff role hierarchy (from lowest to highest access)
 */
export const STAFF_ROLES = {
  SUPPORT_L1: 'SUPPORT_L1',
  SUPPORT_L2: 'SUPPORT_L2',
  OPERATIONS: 'OPERATIONS',
  DEVELOPER: 'DEVELOPER',
  GOD_MODE: 'GOD_MODE',
} as const;

export type StaffRole = keyof typeof STAFF_ROLES | null;

/**
 * Role hierarchy for permission checking (higher number = more access)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  [STAFF_ROLES.SUPPORT_L1]: 1,
  [STAFF_ROLES.SUPPORT_L2]: 2,
  [STAFF_ROLES.OPERATIONS]: 3,
  [STAFF_ROLES.DEVELOPER]: 4,
  [STAFF_ROLES.GOD_MODE]: 5,
};

/**
 * User type for permission checks
 */
interface UserWithStaffRole {
  is_staff?: boolean;
  staff_role?: StaffRole;
  role?: string;
  user_type?: string;
  permissions?: string[];
}

/**
 * Check if a user has a specific staff role or higher in the hierarchy.
 * @param user - The user object from session
 * @param requiredRole - The minimum required role level
 * @returns boolean indicating if user has sufficient permissions
 * 
 * Examples:
 *   hasPermission(user, 'SUPPORT_L1') - User is SUPPORT_L1 or higher
 *   hasPermission(user, 'OPERATIONS') - User is OPERATIONS, DEVELOPER, or GOD_MODE
 */
export function hasPermission(user: UserWithStaffRole | null, requiredRole: string): boolean {
  if (!user) return false;
  if (!user.is_staff) return false;

  // GOD_MODE has all permissions
  if (user.staff_role === STAFF_ROLES.GOD_MODE) return true;

  // Check role hierarchy
  const userLevel = ROLE_HIERARCHY[user.staff_role || ''] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user has a specific staff role (exact match or hierarchy check)
 * @param user - The user object
 * @param role - The role to check for
 * @param exact - If true, requires exact match; if false, uses hierarchy
 */
export function hasRole(user: UserWithStaffRole | null, role: string, exact = false): boolean {
  if (!user) return false;
  if (!user.is_staff) return false;

  if (exact) {
    return user.staff_role === role;
  }

  return hasPermission(user, role);
}

/**
 * Get a human-readable label for a staff role
 */
export function getStaffRoleLabel(role: StaffRole): string {
  const labels: Record<string, string> = {
    [STAFF_ROLES.SUPPORT_L1]: 'Soporte L1 (Atención)',
    [STAFF_ROLES.SUPPORT_L2]: 'Soporte Técnico',
    [STAFF_ROLES.OPERATIONS]: 'Operaciones/Admin',
    [STAFF_ROLES.DEVELOPER]: 'Developer',
    [STAFF_ROLES.GOD_MODE]: 'Super Admin',
  };
  return labels[role || ''] || 'Usuario';
}

/**
 * Vue composable for checking staff permissions in components.
 * More convenient than using hasPermission directly with useAuthStore.
 * 
 * @param requiredRole - Minimum required role level
 * @returns Object with hasPermission, isLoading, and role info
 */
export function useStaffPermission(requiredRole?: string) {
  const authStore = useAuthStore();
  const user = authStore.user;

  const userForCheck: UserWithStaffRole | null = user ? {
    is_staff: user.is_staff,
    staff_role: (user.staff_role as StaffRole) || null,
    role: user.role || undefined,
    user_type: user.user_type || undefined,
    permissions: user.permissions,
  } : null;

  return {
    hasPermission: requiredRole ? hasPermission(userForCheck, requiredRole) : user?.is_staff || false,
    isLoading: authStore.isLoading,
    staffRole: (user?.staff_role as StaffRole) || null,
    isGodMode: user?.staff_role === STAFF_ROLES.GOD_MODE,
    isStaff: user?.is_staff || false,
  };
}
