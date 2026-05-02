import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

// Full User interface matching React CurrentUserResponse
interface User {
  id?: number | string;
  username?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  tenant?: number | string | null;
  tenant_name?: string | null;
  tenant_legal_name?: string | null;
  tenant_commercial_name?: string | null;
  tenant_tax_id?: string | null;
  tenant_phone?: string | null;
  tenant_phone_numbers?: string[] | null;
  tenant_address?: string | null;
  tenant_rif?: string | null;
  tenant_logo?: string | null;
  tenant_currencies?: string[];
  tenant_active_categories?: string[];
  tenant_settings?: Record<string, unknown> | null;
  tenant_global_settings?: {
    enable_igtf?: boolean;
    enable_withholding?: boolean;
    enable_credits?: boolean;
    allow_decimal_prices?: boolean;
    enable_iva?: boolean;
    enable_weighing_scale?: boolean;
    enable_water_station?: boolean;
    enable_measurement_systems?: boolean;
    enable_liquid_refills?: boolean;
    require_customer_document?: boolean;
    printer_type?: string;
    printer_ip?: string;
    receipt_footer_text?: string;
    pos_ui_config?: Record<string, unknown>;
  };
  tenant_industry_type?: string | null;
  tenant_industry_label?: string | null;
  tenant_is_configured?: boolean;
  tenant_operation_scale?: 'MICRO' | 'MEDIUM' | 'LARGE' | string | null;
  tenant_enabled_features?: string[];
  tenant_feature_flags?: string[];
  has_plan?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  staff_role?: string | null;
  role?: string | null;
  user_type?: string | null;
  is_withholding_agent?: boolean | null;
  auto_generate_retention_vouchers?: boolean | null;
  permissions?: string[];
  permissions_matrix?: Record<string, string[]>;  // Matriz de capacidades: { "vta": ["view", "create"], "inv": ["view"] }
}

// CMS Permissions interface
interface CmsPermissions {
  permissions: Record<string, Record<string, boolean>>;
  permission_codes: string[];
  active_modules: string[];
}

const USER_STORAGE_KEY = 'efectivo360_user';
const CMS_PERMISSIONS_KEY = 'efectivo360_cms_permissions';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const cmsPermissions = ref<CmsPermissions | null>(null);
  const isLoading = ref(false);

  // Load user from localStorage on init
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  // Load CMS permissions from localStorage on init
  const storedCmsPermissions = localStorage.getItem(CMS_PERMISSIONS_KEY);
  if (storedCmsPermissions) {
    try {
      cmsPermissions.value = JSON.parse(storedCmsPermissions);
    } catch {
      localStorage.removeItem(CMS_PERMISSIONS_KEY);
    }
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isStaff = computed(() => user.value?.is_staff || false);
  const tenantName = computed(() => {
    return user.value?.tenant_commercial_name || user.value?.tenant_name || '';
  });

  const tenantUlid = computed(() => {
    return user.value?.tenant as string || '';
  });

  // Check if user has any associated tenant (configured or not)
  const hasTenant = computed(() => {
    return !!user.value?.tenant;
  });

  // Check if user has configured tenant
  const hasConfiguredTenant = computed(() => {
    return user.value?.tenant_is_configured || false;
  });

  // User is in global mode (authenticated but no configured tenant)
  const isGlobalMode = computed(() => {
    return user.value && !hasConfiguredTenant.value;
  });

  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false;
    if (user.value.is_superuser) return true;
    return user.value.permissions?.includes(permission) || false;
  };

  const hasPerm = (module: string, action: string): boolean => {
    /**
     * Verifica si el usuario tiene un permiso específico usando la matriz de capacidades.
     * Ejemplo: hasPerm('vta', 'create') retorna true si el usuario puede crear ventas.
     */
    if (!user.value) return false;
    if (user.value.is_superuser) return true;
    
    const matrix = user.value.permissions_matrix;
    if (!matrix) return false;
    
    const moduleActions = matrix[module];
    if (!moduleActions) return false;
    
    return moduleActions.includes(action);
  };

  const hasCmsPermissionCode = (code: string): boolean => {
    if (!cmsPermissions.value) return false;
    if (user.value?.role === 'FOUNDER' || user.value?.role === 'OWNER' || user.value?.user_type === 'ADMIN') return true;
    return cmsPermissions.value.permission_codes?.includes(code) || false;
  };

  // Actions
  const { fetchApi } = useApi();

  const setTokens = (access: string, refresh: string): void => {
    token.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };

  const clearAuth = (): void => {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    cmsPermissions.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(CMS_PERMISSIONS_KEY);
  };

  const saveUserToStorage = (userData: User): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const saveCmsPermissionsToStorage = (permissions: CmsPermissions): void => {
    localStorage.setItem(CMS_PERMISSIONS_KEY, JSON.stringify(permissions));
  };

  // Fetch user from /me/ endpoint (same as React)
  const fetchUser = async (): Promise<User | null> => {
    if (!token.value) return null;
    
    try {
      const data = await fetchApi<User>('/api/me/');
      user.value = data;
      if (data) {
        saveUserToStorage(data);
      }
      return data;
    } catch (err) {
      clearAuth();
      return null;
    }
  };

  // Fetch CMS permissions (same as React cms-permission-provider)
  const fetchCmsPermissions = async (): Promise<CmsPermissions | null> => {
    if (!token.value) return null;
    
    try {
      const data = await fetchApi<Record<string, unknown>>('/api/cms/permissions/');
      if (!data || typeof data !== 'object') {
        cmsPermissions.value = { permissions: {}, permission_codes: [], active_modules: [] };
        return cmsPermissions.value;
      }
      
      const codes = Array.isArray(data.permission_codes) ? data.permission_codes as string[] : [];
      const modMap = { ...data };
      delete modMap.permission_codes;
      const modules = Object.keys(modMap).filter((k) => k !== 'permission_codes');
      
      const permissions: CmsPermissions = {
        permissions: modMap as Record<string, Record<string, boolean>>,
        permission_codes: codes,
        active_modules: modules,
      };
      
      cmsPermissions.value = permissions;
      saveCmsPermissionsToStorage(permissions);
      return permissions;
    } catch (err) {
      cmsPermissions.value = { permissions: {}, permission_codes: [], active_modules: [] };
      return cmsPermissions.value;
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<void> => {
    const { success: notifySuccess, error: notifyError } = useNotify();
    isLoading.value = true;
    try {
      // First get tokens
      const tokenData = await fetchApi<{ access: string; refresh: string }>('/api/token/', {
        method: 'POST',
        data: { username: emailOrUsername.trim(), password },
      });
      
      setTokens(tokenData.access, tokenData.refresh);
      
      // Then fetch full user data from /me/ (same as React)
      await fetchUser();
      
      // Fetch CMS permissions (same as React)
      await fetchCmsPermissions();
      
      notifySuccess('¡Bienvenido! Sesión iniciada correctamente.');
    } catch (err) {
      notifyError('Error al iniciar sesión. Verifica tus credenciales.');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    isLoading.value = true;
    try {
      const data = await fetchApi<{ access: string; refresh: string; user: User }>('/api/auth/register/', {
        method: 'POST',
        data: { username, email, password },
      });
      
      setTokens(data.access, data.refresh);
      user.value = data.user;
      if (data.user) {
        saveUserToStorage(data.user);
      }
      await fetchCmsPermissions();
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    const { success: notifySuccess } = useNotify();
    try {
      if (refreshToken.value) {
        await fetchApi('/api/v1/auth/logout/', {
          method: 'POST',
          data: JSON.stringify({ refresh: refreshToken.value }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      notifySuccess('Sesión cerrada correctamente.');
    }
  };

  const initialize = async (): Promise<void> => {
    if (token.value) {
      await fetchUser();
      await fetchCmsPermissions();
    }
  };

  const refreshSession = async (): Promise<void> => {
    await fetchUser();
    await fetchCmsPermissions();
  };

  const switchTenant = async (tenantId: string): Promise<void> => {
    const { success: notifySuccess, error: notifyError } = useNotify();

    try {
      // Call backend endpoint to switch tenant context
      await fetchApi('/api/v1/auth/switch-tenant/', {
        method: 'POST',
        data: { tenant_id: tenantId },
      });

      // Refresh user data to get new tenant context
      await fetchUser();

      // Invalidate navigation cache for the new tenant
      const { useNavigationStore } = await import('@/stores/navigation');
      const navigationStore = useNavigationStore();
      await navigationStore.invalidateForTenantChange(tenantId);

      notifySuccess('Tienda cambiada exitosamente');
    } catch (err) {
      notifyError('Error al cambiar de tienda');
      throw err;
    };
  };

  // Refresh user permissions without full user refresh
  const refreshUserPermissions = async () => {
    try {
      const data = await fetchApi<{ permissions: string[] }>('/api/v1/auth/user-permissions/');
      userPermissions.value = data.permissions || [];
      console.log('Auth: User permissions refreshed');
    } catch (error) {
      console.error('Auth: Failed to refresh user permissions:', error);
    }
  };

  return {
    user,
    token,
    refreshToken,
    cmsPermissions,
    isLoading,
    isAuthenticated,
    isStaff,
    tenantName,
    hasPerm,
    tenantUlid,
    hasTenant,
    hasConfiguredTenant,
    isGlobalMode,
    setTokens,
    clearAuth,
    login,
    register,
    logout,
    initialize,
    fetchUser,
    fetchCmsPermissions,
    refreshSession,
    hasPermission,
    hasCmsPermissionCode,
    saveUserToStorage,
    saveCmsPermissionsToStorage,
    switchTenant,
    refreshUserPermissions,
  };
});
