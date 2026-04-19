import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useApi } from '@/composables/useApi';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  permission_key: string | null;
  order: number;
  shortcut: string | null;
  group_id: string | null;
  group_label: string | null;
  group_icon: string | null;
  requires_staff: boolean;
  children: MenuItem[];
}

export interface MenuGroup {
  id: string;
  name: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  modules: MenuItem[];
}

export interface NavigationResponse {
  groups: MenuGroup[];
  ungrouped: MenuItem[];
  user_info: {
    is_staff: boolean;
    role: string | null;
    user_type: string | null;
    permissions_count: number;
  };
}

const NAVIGATION_STORAGE_KEY = 'efectivo360_navigation';
const NAVIGATION_TENANT_KEY = 'efectivo360_navigation_tenant';

export const useNavigationStore = defineStore('navigation', () => {
  // State
  const menu = ref<MenuItem[]>([]);
  const groups = ref<MenuGroup[]>([]);
  const ungrouped = ref<MenuItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Don't load from localStorage on init - force API fetch
  // This ensures we always get fresh data from the database

  // Getters
  const flatMenu = computed(() => {
    const flatten = (items: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          result.push(...flatten(item.children));
        }
      });
      return result;
    };
    return flatten(menu.value);
  });

  const menuByGroup = computed(() => {
    const result: Record<string, { label: string; icon: string; items: MenuItem[] }> = {};

    // Add grouped modules
    groups.value.forEach(group => {
      result[group.id] = {
        label: group.label,
        icon: group.icon,
        items: group.modules,
      };
    });

    // Add ungrouped as 'other'
    if (ungrouped.value.length > 0) {
      result['other'] = {
        label: 'Otros',
        icon: 'MoreHorizontal',
        items: ungrouped.value,
      };
    }

    return result;
  });

  // Actions
  const fetchNavigation = async () => {
    isLoading.value = true;
    error.value = null;

    console.log('NavigationStore: Fetching navigation from API...');

    try {
      const api = useApi();
      const response = await api.fetchApi<NavigationResponse>('/api/v1/navigation/menu/');

      console.log('NavigationStore: API response received', response);

      // Store grouped structure
      groups.value = response.groups || [];
      ungrouped.value = response.ungrouped || [];

      // Convert to flat menu for backward compatibility
      const flatMenuItems: MenuItem[] = [];

      // Add grouped modules with group info
      groups.value.forEach(group => {
        group.modules.forEach(module => {
          flatMenuItems.push({
            ...module,
            group_id: group.id,
            group_label: group.label,
            group_icon: group.icon,
          });
        });
      });

      // Add ungrouped modules
      ungrouped.value.forEach(module => {
        flatMenuItems.push({
          ...module,
          group_id: null,
          group_label: null,
          group_icon: null,
        });
      });

      menu.value = flatMenuItems;

      // Cache in localStorage for future use (only if successful)
      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(menu.value));

      console.log('NavigationStore: Menu loaded successfully', menu.value.length, 'items');

      return response;
    } catch (e: any) {
      console.error('NavigationStore: Failed to fetch navigation', e);
      error.value = e.message || 'Failed to fetch navigation';

      // Try to load from cache as fallback
      const cached = localStorage.getItem(NAVIGATION_STORAGE_KEY);
      if (cached) {
        try {
          menu.value = JSON.parse(cached);
          console.log('NavigationStore: Loaded from cache as fallback', menu.value.length, 'items');
        } catch (parseError) {
          console.error('NavigationStore: Failed to parse cache', parseError);
        }
      }

      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const clearCache = () => {
    localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    localStorage.removeItem(NAVIGATION_TENANT_KEY);
    menu.value = [];
    groups.value = [];
    ungrouped.value = [];
  };

  const refreshNavigation = async () => {
    clearCache();
    return fetchNavigation();
  };

  const invalidateForTenantChange = async (tenantId: string) => {
    // Check if tenant changed
    const lastTenant = localStorage.getItem(NAVIGATION_TENANT_KEY);
    if (lastTenant === tenantId) {
      return; // Same tenant, no need to refresh
    }

    // Clear cache and fetch new navigation for new tenant
    clearCache();
    localStorage.setItem(NAVIGATION_TENANT_KEY, tenantId);
    return fetchNavigation();
  };

  return {
    menu,
    groups,
    ungrouped,
    isLoading,
    error,
    flatMenu,
    menuByGroup,
    fetchNavigation,
    clearCache,
    refreshNavigation,
    invalidateForTenantChange,
  };
});
