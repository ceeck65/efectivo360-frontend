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
export type MenuGroup = 'saas' | 'master' | 'operations' | 'config' | 'super_admin';

/**
 * Nombres de iconos Lucide soportados
 */
export type IconName = 
  | 'LayoutDashboard'
  | 'Users'
  | 'Settings'
  | 'Building2'
  | 'CreditCard'
  | 'BarChart3'
  | 'Package'
  | 'Database'
  | 'Tags'
  | 'Waypoints'
  | 'MessageSquare'
  | 'Receipt'
  | 'Shield'
  | 'ShieldCheck'
  | 'Briefcase'
  | 'Plug'
  | 'Bot'
  | 'Globe'
  | 'Map'
  | 'Coins'
  | 'Flag'
  | 'Wallet'
  | 'DollarSign';

/**
 * Definición de un item del menú
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: IconName;         // Nombre del icono Lucide
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
  icon: IconName;
  sortOrder: number;
}

// =============================================================================
// CONFIGURACIÓN DE GRUPOS
// =============================================================================

export const groupConfigs: GroupConfig[] = [
  { id: 'saas', label: 'Administración SaaS', icon: 'Building2', sortOrder: 1 },
  { id: 'master', label: 'Maestro de Datos', icon: 'Database', sortOrder: 2 },
  { id: 'operations', label: 'Operaciones', icon: 'Briefcase', sortOrder: 3 },
  { id: 'config', label: 'Configuración', icon: 'Settings', sortOrder: 4 },
  { id: 'super_admin', label: 'Super-Admin', icon: 'Shield', sortOrder: 0 },
];

// =============================================================================
// CONFIGURACIÓN DE ITEMS DEL MENÚ
// =============================================================================

export const navigationItems: NavigationItem[] = [
  // ==========================================================================
  // ADMINISTRACIÓN SaaS
  // ==========================================================================
  {
    id: 'tenants',
    label: 'Tenants',
    path: '/admin/tenants',
    icon: 'Building2',
    group: 'saas',
    sortOrder: 1,
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    path: '/admin/subscriptions',
    icon: 'CreditCard',
    group: 'saas',
    sortOrder: 2,
  },
  {
    id: 'users',
    label: 'Usuarios',
    path: '/admin/users',
    icon: 'Users',
    group: 'saas',
    sortOrder: 3,
  },
  
  // ==========================================================================
  // MAESTRO DE DATOS
  // ==========================================================================
  {
    id: 'countries',
    label: 'Países',
    path: '/admin/geography/countries',
    icon: 'Globe',
    group: 'master',
    sortOrder: 4,
  },
  {
    id: 'states',
    label: 'Estados y Ciudades',
    path: '/admin/geography/states',
    icon: 'Map',
    group: 'master',
    sortOrder: 5,
  },
  {
    id: 'master-data',
    label: 'Datos Maestros',
    path: '/admin/master-data',
    icon: 'Database',
    group: 'master',
    sortOrder: 1,
  },
  {
    id: 'categories',
    label: 'Categorías',
    path: '/admin/master/categories',
    icon: 'Waypoints',
    group: 'master',
    sortOrder: 2,
  },
  {
    id: 'blueprints',
    label: 'Tipos de Comercio',
    path: '/admin/master/commerce-types',
    icon: 'Building2',
    group: 'master',
    sortOrder: 3,
  },
  {
    id: 'chat',
    label: 'Chat',
    path: '/admin/chat',
    icon: 'MessageSquare',
    group: 'master',
    sortOrder: 4,
  },
  {
    id: 'products',
    label: 'Productos',
    path: '/admin/products',
    icon: 'Package',
    group: 'master',
    sortOrder: 4,
  },
  
  // ==========================================================================
  // OPERACIONES (Blueprint: Ventas, Inventario, Finanzas, Auditoría)
  // ==========================================================================
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: 'LayoutDashboard',
    group: 'operations',
    sortOrder: 1,
  },
  {
    id: 'sales',
    label: 'Ventas',
    path: '/admin/sales',
    icon: 'Receipt',
    group: 'operations',
    sortOrder: 2,
  },
  {
    id: 'inventory',
    label: 'Inventario',
    path: '/admin/inventory',
    icon: 'Package',
    group: 'operations',
    sortOrder: 3,
  },
  {
    id: 'finances',
    label: 'Finanzas',
    path: '/admin/finances',
    icon: 'Coins',
    group: 'operations',
    sortOrder: 4,
  },
  {
    id: 'audit',
    label: 'Auditoría',
    path: '/admin/audit',
    icon: 'ShieldCheck',
    group: 'operations',
    sortOrder: 5,
  },
  {
    id: 'payments',
    label: 'Pagos',
    path: '/admin/payments',
    icon: 'CreditCard',
    group: 'operations',
    sortOrder: 6,
  },
  {
    id: 'reports',
    label: 'Reportes',
    path: '/admin/reports',
    icon: 'BarChart3',
    group: 'operations',
    sortOrder: 7,
  },
  
  // ==========================================================================
  // SUPER-ADMIN (Solo para staff)
  // ==========================================================================
  {
    id: 'super-console',
    label: 'Consola Super-Admin',
    path: '/admin/super-console',
    icon: 'Shield',
    group: 'super_admin',
    sortOrder: 1,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  
  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================
  {
    id: 'settings',
    label: 'Configuración',
    path: '/admin/settings',
    icon: 'Settings',
    group: 'config',
    sortOrder: 1,
  },
  {
    id: 'integrations',
    label: 'Integraciones',
    path: '/admin/integrations',
    icon: 'Plug',
    group: 'config',
    sortOrder: 2,
  },
  {
    id: 'currencies',
    label: 'Monedas',
    path: '/admin/master/currencies',
    icon: 'Coins',
    group: 'config',
    sortOrder: 3,
  },
  {
    id: 'currencies-country',
    label: 'Monedas por País',
    path: '/admin/geography/country-currency',
    icon: 'Flag',
    group: 'config',
    sortOrder: 4,
  },
  {
    id: 'payment-methods',
    label: 'Métodos de Pago',
    path: '/admin/staff/payment-templates',
    icon: 'Wallet',
    group: 'config',
    sortOrder: 5,
  },
  {
    id: 'forex-rates',
    label: 'Tasas de Cambio',
    path: '/admin/forex-rates',
    icon: 'DollarSign',
    group: 'config',
    sortOrder: 6,
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
  group: 'config',
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
