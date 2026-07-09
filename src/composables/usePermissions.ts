import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function usePermissions() {
  const authStore = useAuthStore();

  /** Flat list of permission strings from backend */
  const permissions = computed<string[]>(() => authStore.user?.permissions ?? []);

  /**
   * Check if user has a specific permission code.
   * Frontend never evaluates business logic — only reacts to strings from backend.
   */
  const hasPerm = (_module: string, code: string): boolean => {
    return authStore.hasPermission(code);
  };

  /** Check if user has any permission from a list */
  const hasAnyPerm = (codes: string[]): boolean => {
    return codes.some(c => authStore.hasPermission(c));
  };

  /** Check if user has all permissions from a list */
  const hasAllPerms = (codes: string[]): boolean => {
    return codes.every(c => authStore.hasPermission(c));
  };

  /** Check if user is staff */
  const isStaff = computed(() => authStore.user?.is_staff || false);

  /** Check if user is superuser */
  const isSuperuser = computed(() => authStore.user?.is_superuser || false);

  /** Check if user is store owner (not staff) */
  const isStoreOwner = computed(() => authStore.user && !authStore.user.is_staff);

  return {
    permissions,
    hasPerm,
    hasAnyPerm,
    hasAllPerms,
    isStaff,
    isSuperuser,
    isStoreOwner,
  };
}
