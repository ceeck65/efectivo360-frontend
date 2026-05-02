import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function usePermissions() {
  const authStore = useAuthStore();

  /**
   * Check if user has a specific permission
   * @param module - Permission module (e.g., 'MENUS', 'operations', 'finance')
   * @param code - Permission code (e.g., 'mnu_dashboard', 'CAN_VIEW_SALES')
   * @returns boolean
   */
  const hasPerm = (module: string, code: string): boolean => {
    if (!authStore.user) return false;
    
    // Superusers have all permissions
    if (authStore.user.is_superuser) return true;
    
    // Check if user has the specific permission
    const userPermissions = authStore.userPermissions || [];
    return userPermissions.includes(code);
  };

  /**
   * Check if user has any permission from a list
   * @param permissions - Array of permission codes
   * @returns boolean
   */
  const hasAnyPerm = (permissions: string[]): boolean => {
    if (!authStore.user) return false;
    if (authStore.user.is_superuser) return true;
    
    const userPermissions = authStore.userPermissions || [];
    return permissions.some(perm => userPermissions.includes(perm));
  };

  /**
   * Check if user has all permissions from a list
   * @param permissions - Array of permission codes
   * @returns boolean
   */
  const hasAllPerms = (permissions: string[]): boolean => {
    if (!authStore.user) return false;
    if (authStore.user.is_superuser) return true;
    
    const userPermissions = authStore.userPermissions || [];
    return permissions.every(perm => userPermissions.includes(perm));
  };

  /**
   * Check if user is staff
   * @returns boolean
   */
  const isStaff = computed(() => authStore.user?.is_staff || false);

  /**
   * Check if user is superuser
   * @returns boolean
   */
  const isSuperuser = computed(() => authStore.user?.is_superuser || false);

  /**
   * Check if user is store owner (not staff)
   * @returns boolean
   */
  const isStoreOwner = computed(() => authStore.user && !authStore.user.is_staff);

  return {
    hasPerm,
    hasAnyPerm,
    hasAllPerms,
    isStaff,
    isSuperuser,
    isStoreOwner,
  };
}
