/**
 * @fileoverview Configuración de navegación inteligente para Efectivo 360
 * @module @shared/config/navigationConfig
 * 
 * Define la estructura del menú con filtros por:
 * - Rol del usuario (userRole)
 * - Módulos activos del plan (requiredModules)
 * - Rubro del comercio (requiredBusinessType)
 * 
 * Los items se filtran dinámicamente según el contexto actual.
 */

import type { UserRole } from '@modules/users/types';
import type { ContextModule } from '@modules/assistant/types';

/**
 * Rubros/Tipos de comercio soportados
 */
export type BusinessType = 
  | 'retail'        // Retail general
  | 'restaurant'    // Restaurantes
  | 'hardware'      // Ferretería
  | 'clothing'      // Ropa/Zapatos (requiere tallas)
  | 'supermarket'     // Supermercados
  | 'pharmacy'      // Farmacias
  | 'electronics'   // Electrónicos
  | 'services'      // Servicios
  | 'wholesale';    // Mayoristas

/**
 * Categoría de agrupación del menú
 */
export type MenuGroup = 'core' | 'operations' | 'catalogo' | 'administracion' | 'saas';

/**
 * Definición de un item del menú
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;           // Nombre del icono Lucide
  group: MenuGroup;
  
  // Filtros de visibilidad
  allowedRoles?: UserRole[];           // null = todos los roles
  excludedRoles?: UserRole[];          // Roles que NO ven este item
  requiredModules?: ContextModule[];   // Módulos requeridos del plan
  requiredBusinessType?: BusinessType[]; // Rubros que ven este item
  excludedBusinessType?: BusinessType[]; // Rubros que NO ven este item
  
  // Filtros por plan (bloqueo)
  requiredPlan?: string[];              // Planes que pueden acceder (null = todos)
  excludedPlan?: string[];            // Planes excluidos
  
  // Jerarquía
  children?: NavigationItem[];
  parentId?: string;
  
  // UI
  badge?: string | number;            // Contador a mostrar
  isNew?: boolean;                    // Badge "Nuevo"
  isBeta?: boolean;                   // Badge "Beta"
  isLocked?: boolean;                 // Icono de candado (requiere upgrade)
  
  // Orden
  sortOrder: number;
}

/**
 * Configuración de grupos
 */
export interface GroupConfig {
  id: MenuGroup;
  label: string;
  icon: string;
  sortOrder: number;
}

// =============================================================================
// CONFIGURACIÓN DE GRUPOS
// =============================================================================

export const groupConfigs: GroupConfig[] = [
  { id: 'core', label: 'Principal', icon: 'LayoutGrid', sortOrder: 1 },
  { id: 'operations', label: 'Operaciones', icon: 'Briefcase', sortOrder: 2 },
  { id: 'catalogo', label: 'Catálogo', icon: 'Package', sortOrder: 3 },
  { id: 'administracion', label: 'Administración', icon: 'Settings', sortOrder: 4 },
  { id: 'saas', label: 'Efectivo 360 SaaS', icon: 'Shield', sortOrder: 5 },
];

// =============================================================================
// CONFIGURACIÓN DE ITEMS DEL MENÚ
// =============================================================================

export const navigationItems: NavigationItem[] = [
  // ==========================================================================
  // CORE - Principal
  // ==========================================================================
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    group: 'core',
    sortOrder: 1,
  },
  {
    id: 'pos',
    label: 'Punto de Venta',
    path: '/pos',
    icon: 'ShoppingCart',
    group: 'core',
    allowedRoles: ['admin', 'manager', 'cashier', 'sales_rep'],
    sortOrder: 2,
  },
  {
    id: 'sales',
    label: 'Ventas',
    path: '/sales',
    icon: 'Receipt',
    group: 'core',
    allowedRoles: ['admin', 'manager', 'cashier', 'sales_rep'],
    sortOrder: 3,
  },
  
  // ==========================================================================
  // OPERATIONS - Operaciones
  // ==========================================================================
  {
    id: 'customers',
    label: 'Clientes',
    path: '/customers',
    icon: 'Users',
    group: 'operations',
    sortOrder: 1,
  },
  {
    id: 'payments',
    label: 'Pagos',
    path: '/payments',
    icon: 'CreditCard',
    group: 'operations',
    requiredModules: ['payments'],
    sortOrder: 2,
  },
  {
    id: 'reports',
    label: 'Reportes',
    path: '/reports',
    icon: 'BarChart3',
    group: 'operations',
    allowedRoles: ['admin', 'manager'],
    sortOrder: 3,
  },
  {
    id: 'advanced-reports',
    label: 'Reportes Avanzados',
    path: '/reports/advanced',
    icon: 'LineChart',
    group: 'operations',
    allowedRoles: ['admin', 'manager'],
    requiredPlan: ['PRO', 'ENTERPRISE'],  // Bloqueado para BASIC
    isLocked: true,
    sortOrder: 4,
  },
  {
    id: 'cash-register',
    label: 'Caja',
    path: '/cash-register',
    icon: 'CashRegister',
    group: 'operations',
    allowedRoles: ['admin', 'manager', 'cashier'],
    sortOrder: 5,
  },
  
  // ==========================================================================
  // CATALOGO - Catálogo e Inventario
  // ==========================================================================
  {
    id: 'products',
    label: 'Productos',
    path: '/inventory/products',
    icon: 'Package',
    group: 'catalogo',
    requiredModules: ['inventory'],
    sortOrder: 1,
  },
  {
    id: 'categories',
    label: 'Categorías',
    path: '/master-data/categories',
    icon: 'FolderTree',
    group: 'catalogo',
    requiredModules: ['inventory'],
    sortOrder: 2,
  },
  {
    id: 'blueprints',
    label: 'Configuración de Rubros',
    path: '/master-data/blueprints',
    icon: 'Palette',
    group: 'catalogo',
    requiredModules: ['inventory'],
    allowedRoles: ['admin', 'manager', 'inventory_manager'],
    sortOrder: 3,
    children: [
      {
        id: 'blueprints-list',
        label: 'Blueprints',
        path: '/master-data/blueprints',
        icon: 'FileJson',
        group: 'catalogo',
        parentId: 'blueprints',
        sortOrder: 1,
      },
      {
        id: 'category-tree',
        label: 'Árbol de Categorías',
        path: '/master-data/category-tree',
        icon: 'GitBranch',
        group: 'catalogo',
        parentId: 'blueprints',
        sortOrder: 2,
      },
      {
        id: 'attributes',
        label: 'Atributos Dinámicos',
        path: '/master-data/attributes',
        icon: 'Tags',
        group: 'catalogo',
        parentId: 'blueprints',
        sortOrder: 3,
        // Solo visible para rubros que usan atributos (ropa, zapatos)
        // Oculto para 'services', 'hardware', 'supermarket', 'pharmacy'
        requiredBusinessType: ['clothing', 'retail', 'electronics', 'wholesale'],
        excludedBusinessType: ['services', 'hardware', 'supermarket', 'pharmacy'],
      },
    ],
  },
  {
    id: 'stock',
    label: 'Control de Stock',
    path: '/inventory/stock',
    icon: 'Warehouse',
    group: 'catalogo',
    requiredModules: ['inventory'],
    allowedRoles: ['admin', 'manager', 'inventory_manager'],
    sortOrder: 4,
  },
  {
    id: 'sizes',
    label: 'Gestión de Tallas/Colores',
    path: '/inventory/sizes',
    icon: 'Ruler',
    group: 'catalogo',
    requiredModules: ['inventory'],
    requiredBusinessType: ['clothing'],  // Solo ropa/zapatos
    excludedBusinessType: ['hardware', 'supermarket', 'pharmacy', 'services'],
    sortOrder: 5,
  },
  
  // ==========================================================================
  // ADMINISTRACIÓN - Configuración del Tenant
  // ==========================================================================
  {
    id: 'settings',
    label: 'Ajustes Generales',
    path: '/settings',
    icon: 'Settings',
    group: 'administracion',
    allowedRoles: ['admin', 'manager'],
    sortOrder: 1,
  },
  {
    id: 'users',
    label: 'Usuarios',
    path: '/users',
    icon: 'UserCog',
    group: 'administracion',
    allowedRoles: ['admin'],
    sortOrder: 2,
  },
  {
    id: 'tenant-profile',
    label: 'Perfil del Comercio',
    path: '/tenant/profile',
    icon: 'Store',
    group: 'administracion',
    allowedRoles: ['admin'],
    sortOrder: 3,
  },
  {
    id: 'integrations',
    label: 'Integraciones',
    path: '/settings/integrations',
    icon: 'Plug',
    group: 'administracion',
    allowedRoles: ['admin'],
    isBeta: true,
    sortOrder: 4,
  },
  
  // ==========================================================================
  // SAAS - Administración (solo Staff/Superadmin)
  // ==========================================================================
  {
    id: 'tenants',
    label: 'Comercios',
    path: '/admin/tenants',
    icon: 'Building2',
    group: 'saas',
    allowedRoles: ['superadmin'],
    sortOrder: 1,
  },
  {
    id: 'plans',
    label: 'Planes y Precios',
    path: '/admin/plans',
    icon: 'CreditCard',
    group: 'saas',
    allowedRoles: ['superadmin'],
    sortOrder: 2,
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    path: '/admin/subscriptions',
    icon: 'Repeat',
    group: 'saas',
    allowedRoles: ['superadmin'],
    sortOrder: 3,
  },
  {
    id: 'saas-payments',
    label: 'Pagos Recibidos',
    path: '/admin/payments',
    icon: 'DollarSign',
    group: 'saas',
    allowedRoles: ['superadmin'],
    sortOrder: 4,
  },
  {
    id: 'analytics',
    label: 'Analytics SaaS',
    path: '/admin/analytics',
    icon: 'LineChart',
    group: 'saas',
    allowedRoles: ['superadmin'],
    isBeta: true,
    sortOrder: 5,
  },
];

// =============================================================================
// EFI - Acceso directo persistente
// =============================================================================

export const efiNavigationItem: NavigationItem = {
  id: 'efi',
  label: 'Asistente Efi',
  path: '#efi',
  icon: 'Bot',
  group: 'core',
  sortOrder: 999,  // Siempre al final
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Obtener items por grupo
 */
export function getItemsByGroup(group: MenuGroup): NavigationItem[] {
  return navigationItems
    .filter(item => item.group === group)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Obtener todos los items (sin filtrar)
 */
export function getAllItems(): NavigationItem[] {
  return [...navigationItems].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Buscar item por ID
 */
export function findItemById(id: string): NavigationItem | null {
  function search(items: NavigationItem[]): NavigationItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = search(item.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(navigationItems);
}

/**
 * Obtener items padre con hijos expandidos
 */
export function getItemsWithChildren(parentId?: string): NavigationItem[] {
  if (parentId) {
    const parent = findItemById(parentId);
    return parent?.children || [];
  }
  return navigationItems.filter(item => !item.parentId);
}
