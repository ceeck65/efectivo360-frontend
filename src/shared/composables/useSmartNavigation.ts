/**
 * @fileoverview Composable de navegación inteligente
 * @module @shared/composables/useSmartNavigation
 * 
 * Lógica de filtrado del menú basada en:
 * - Rol del usuario
 * - Plan de suscripción (módulos activos)
 * - Rubro del comercio
 */

import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { UserRole } from '@modules/users/types';
import type { ContextModule } from '@modules/assistant/types';
import { 
  navigationItems, 
  efiNavigationItem,
  groupConfigs,
  type NavigationItem,
  type MenuGroup,
  type BusinessType,
} from '../config/navigationConfig';
import { useUsersStore } from '@modules/users';
import { useSubscriptionsStore } from '@modules/subscriptions';
import { useTenantsStore } from '@modules/tenants';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useSmartNavigation() {
  // ==========================================================================
  // STORES
  // ==========================================================================
  
  const usersStore = useUsersStore();
  const subscriptionsStore = useSubscriptionsStore();
  const tenantsStore = useTenantsStore();
  
  const { currentUser } = storeToRefs(usersStore);
  const { subscription, currentPlan } = storeToRefs(subscriptionsStore);
  const { currentTenant } = storeToRefs(tenantsStore);
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  const expandedMenus = ref<Set<string>>(new Set());
  const activeItemId = ref<string | null>(null);
  
  // ==========================================================================
  // GETTERS - FILTRADO INTELIGENTE
  // ==========================================================================
  
  /**
   * Rubro del comercio actual
   */
  const businessType = computed((): BusinessType | null => {
    // Determinar rubro basado en el tenant type o metadata
    const tenantType = currentTenant.value?.tenantTypeId;
    if (!tenantType) return null;
    
    // Mapeo de tenant type a business type
    const typeMapping: Record<string, BusinessType> = {
      'retail': 'retail',
      'clothing': 'clothing',
      'restaurant': 'restaurant',
      'hardware': 'hardware',
      'pharmacy': 'pharmacy',
      'supermarket': 'supermarket',
      'electronics': 'electronics',
      'services': 'services',
      'wholesale': 'wholesale',
    };
    
    // Buscar en el tenant type
    const tenantTypeCode = tenantsStore.tenantTypes.find(t => t.id === tenantType)?.code;
    return tenantTypeCode ? (typeMapping[tenantTypeCode] || 'retail') : 'retail';
  });
  
  /**
   * Rol del usuario actual
   */
  const userRole = computed((): UserRole | null => {
    return currentUser.value?.role || null;
  });
  
  /**
   * Módulos activos según el plan de suscripción
   */
  const activeModules = computed((): ContextModule[] => {
    const modules: ContextModule[] = ['dashboard'];  // Siempre disponible
    
    if (!currentPlan.value) return modules;
    
    // Verificar features del plan
    const features = currentPlan.value.features;
    
    if (features.some(f => f.code === 'inventory' && f.isEnabled)) {
      modules.push('inventory');
    }
    if (features.some(f => f.code === 'payments' && f.isEnabled)) {
      modules.push('payments');
    }
    if (features.some(f => f.code === 'sales' && f.isEnabled)) {
      modules.push('sales');
    }
    if (features.some(f => f.code === 'reports' && f.isEnabled)) {
      modules.push('reports');
    }
    if (features.some(f => f.code === 'customers' && f.isEnabled)) {
      modules.push('customers');
    }
    
    return modules;
  });
  
  /**
   * Verificar si un item está bloqueado por el plan
   */
  function isItemLocked(item: NavigationItem): boolean {
    if (!subscription.value?.planId || !currentPlan.value) return false;
    
    const planCode = currentPlan.value.code;
    
    // Verificar si el plan actual está en la lista de planes permitidos
    if (item.requiredPlan && item.requiredPlan.length > 0) {
      if (!item.requiredPlan.includes(planCode)) {
        return true;
      }
    }
    
    // Verificar si el plan está excluido
    if (item.excludedPlan && item.excludedPlan.length > 0) {
      if (item.excludedPlan.includes(planCode)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Verificar si un item debe mostrarse
   */
  function isItemVisible(item: NavigationItem): boolean {
    // 1. Verificar rol
    if (item.allowedRoles && userRole.value) {
      if (!item.allowedRoles.includes(userRole.value)) {
        return false;
      }
    }
    
    if (item.excludedRoles && userRole.value) {
      if (item.excludedRoles.includes(userRole.value)) {
        return false;
      }
    }
    
    // 2. Verificar módulos requeridos
    if (item.requiredModules && item.requiredModules.length > 0) {
      const hasRequiredModule = item.requiredModules.some(
        module => activeModules.value.includes(module)
      );
      if (!hasRequiredModule) {
        return false;
      }
    }
    
    // 3. Verificar rubro del comercio
    if (item.requiredBusinessType && businessType.value) {
      if (!item.requiredBusinessType.includes(businessType.value)) {
        return false;
      }
    }
    
    if (item.excludedBusinessType && businessType.value) {
      if (item.excludedBusinessType.includes(businessType.value)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Items filtrados
   */
  const visibleItems = computed((): NavigationItem[] => {
    return navigationItems.filter(item => isItemVisible(item));
  });
  
  /**
   * Items agrupados por categoría
   */
  const groupedItems = computed((): Record<MenuGroup, NavigationItem[]> => {
    const grouped: Record<string, NavigationItem[]> = {
      core: [],
      operations: [],
      inventory: [],
      config: [],
      saas: [],
    };
    
    visibleItems.value.forEach(item => {
      if (!grouped[item.group]) {
        grouped[item.group] = [];
      }
      grouped[item.group].push(item);
    });
    
    // Ordenar cada grupo
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    
    return grouped;
  });
  
  /**
   * Items para el sidebar (con Efi al final)
   */
  const sidebarItems = computed((): NavigationItem[] => {
    const items = [...visibleItems.value];
    
    // Agregar Efi al final si no está ya
    if (!items.find(i => i.id === 'efi')) {
      items.push(efiNavigationItem);
    }
    
    return items;
  });
  
  /**
   * Grupos disponibles (con items visibles)
   */
  const availableGroups = computed((): MenuGroup[] => {
    return groupConfigs
      .filter(group => groupedItems.value[group.id]?.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(g => g.id);
  });
  
  // ==========================================================================
  // ACTIONS
  // ==========================================================================
  
  /**
   * Expandir/colapsar menú
   */
  function toggleMenu(menuId: string): void {
    if (expandedMenus.value.has(menuId)) {
      expandedMenus.value.delete(menuId);
    } else {
      expandedMenus.value.add(menuId);
    }
  }
  
  /**
   * Verificar si un menú está expandido
   */
  function isExpanded(menuId: string): boolean {
    return expandedMenus.value.has(menuId);
  }
  
  /**
   * Establecer item activo
   */
  function setActiveItem(itemId: string): void {
    activeItemId.value = itemId;
  }
  
  /**
   * Verificar si un item está activo
   */
  function isActive(itemId: string): boolean {
    return activeItemId.value === itemId;
  }
  
  /**
   * Expandir todos los menús
   */
  function expandAll(): void {
    visibleItems.value
      .filter(item => item.children && item.children.length > 0)
      .forEach(item => expandedMenus.value.add(item.id));
  }
  
  /**
   * Colapsar todos los menús
   */
  function collapseAll(): void {
    expandedMenus.value.clear();
  }
  
  /**
   * Obtener hijos visibles de un item
   */
  function getVisibleChildren(item: NavigationItem): NavigationItem[] {
    if (!item.children) return [];
    return item.children.filter(child => isItemVisible(child));
  }
  
  /**
   * Buscar item por path
   */
  function findItemByPath(path: string): NavigationItem | null {
    function search(items: NavigationItem[]): NavigationItem | null {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(navigationItems);
  }
  
  // ==========================================================================
  // RETURN
  // ==========================================================================
  
  return {
    // State
    expandedMenus,
    activeItemId,
    
    // Getters
    userRole,
    businessType,
    activeModules,
    visibleItems,
    groupedItems,
    sidebarItems,
    availableGroups,
    groupConfigs,
    efiItem: efiNavigationItem,
    currentPlan,
    
    // Methods
    isItemVisible,
    isItemLocked,
    toggleMenu,
    isExpanded,
    setActiveItem,
    isActive,
    expandAll,
    collapseAll,
    getVisibleChildren,
    findItemByPath,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para verificación de acceso
 */
export function useNavigationGuard() {
  const { userRole, activeModules, businessType, isItemVisible } = useSmartNavigation();
  
  return {
    canAccess: (item: NavigationItem) => isItemVisible(item),
    hasModule: (module: ContextModule) => activeModules.value.includes(module),
    isRole: (role: UserRole) => userRole.value === role,
    isBusinessType: (type: BusinessType) => businessType.value === type,
  };
}
