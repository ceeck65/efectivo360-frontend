import {
  BarChart3,
  LineChart,
  Boxes,
  CreditCard,
  Gauge,
  Monitor,
  Ruler,
  Users,
  Settings,
  Tag,
  ShieldCheck,
  Crown,
  Building2,
  Waypoints,
  Shield,
  CheckCircle2,
  Landmark,
  Wallet,
  Globe,
} from 'lucide-vue-next';
import type { Component } from 'vue';

export interface NavItem {
  href: string;
  label: string;
  icon: Component;
  shortcut?: string;
  permission?: string;
  requiresStaff?: boolean;
  requiresOnline?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// Icon registry for CMS menu items
export const iconMap: Record<string, Component> = {
  BarChart3,
  LineChart,
  Boxes,
  CreditCard,
  Gauge,
  Monitor,
  Ruler,
  Users,
  Settings,
  Tag,
  ShieldCheck,
  Crown,
  Building2,
  Waypoints,
  Shield,
  CheckCircle2,
  Landmark,
  Wallet,
  Globe,
};

// All admin paths
export const paths = {
  dashboard: '/admin/dashboard',
  pos: '/admin/pos',
  inventory: '/admin/inventory',
  billing: '/admin/billing',
  financialAnalytics: '/admin/financial-analytics',
  exchangeRates: '/admin/exchange-rates',
  units: '/admin/units',
  platformClients: '/admin/platform/clients',
  platformReports: '/admin/platform/reports',
  platformSettings: '/admin/platform/settings',
  founderGlobalProducts: '/admin/founder/global-products',
  founderPaymentMethods: '/admin/founder/payment-methods',
  dashboardInvoices: '/admin/dashboard/invoices',
  returnables: '/admin/returnables',
  priceManagement: '/admin/price-management',
  receivables: '/admin/receivables',
  customers: '/admin/customers',
  warehouseMovements: '/admin/warehouse-movements',
  team: '/admin/team',
  users: '/admin/users',
  posTerminals: '/admin/pos-terminals',
  cashClosures: '/admin/cash-closures',
  fiscalClosure: '/admin/fiscal-closure',
  settings: '/admin/settings',
  moduleConfig: '/admin/module-config',
  cms: '/admin/cms',
  posSettings: '/admin/pos-settings',
  masterTenants: '/admin/master/tenants',
  masterCategories: '/admin/master/categories',
  masterCommerceTypes: '/admin/master/commerce-types',
  subscriptions: '/admin/subscriptions',
  masterDashboard: '/admin/master/dashboard',
  masterCurrencies: '/admin/master/currencies',
  masterHealth: '/admin/master/health',
  masterSupport: '/admin/master/support',
  masterPayments: '/admin/master/payments',
  masterPlans: '/admin/master/plans',
  masterNotifications: '/admin/master/notifications',
  bankReconciliation: '/admin/bank-reconciliation',
  vaults: '/admin/vaults',
  // Payment Methods - Nueva arquitectura
  staffPaymentTemplates: '/admin/staff/payment-templates',
  tenantSaasPayments: '/admin/billing/saas-payments',
  tenantPosPayments: '/admin/settings/pos-payments',
} as const;

export type AdminPathKey = keyof typeof paths;

/** Dashboard primero, POS segundo, el resto por etiqueta (es). */
export function sortNavItems<T extends { href: string; label: string }>(list: T[]): T[] {
  const dash = list.filter((i) => i.href === paths.dashboard);
  const pos = list.filter((i) => i.href === paths.pos);
  const rest = list.filter((i) => i.href !== paths.dashboard && i.href !== paths.pos);
  rest.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
  return [...dash, ...pos, ...rest];
}

/** Convierte rutas legacy a /admin/... */
export function adminPath(legacy: string): string {
  if (!legacy) return paths.dashboard;
  if (legacy.startsWith('/admin')) return legacy;
  if (legacy === '/' || legacy === '') return paths.dashboard;
  return `/admin${legacy.startsWith('/') ? legacy : `/${legacy}`}`;
}

// Translation helper (uses t function from i18n)
import es from '@/locales/es.json';

export const t = (key: string, fallback?: string): string => {
  return (es as Record<string, string>)[key] ?? fallback ?? key;
};

// All navigation items
export const allNavItems: NavItem[] = [
  { href: paths.dashboard, label: 'sidebar.dashboard', icon: BarChart3, shortcut: 'F9' },
  { href: paths.pos, label: 'sidebar.posDesktop', icon: Monitor, shortcut: 'F2' },
  { href: paths.inventory, label: 'sidebar.inventory', icon: Boxes, shortcut: 'F4' },
  { href: paths.billing, label: 'sidebar.billing', icon: CreditCard, shortcut: 'F3' },
  { href: '/admin/billing/report', label: 'Reportar Pago', icon: CheckCircle2 },
  // Nuevos items de métodos de pago para Tenants
  { href: paths.tenantSaasPayments, label: 'Métodos de Pago (Suscripción)', icon: CreditCard },
  { href: paths.tenantPosPayments, label: 'Mis Métodos de Cobro', icon: Wallet },
  { href: paths.financialAnalytics, label: 'sidebar.financialAnalytics', icon: LineChart, shortcut: 'F10' },
  { href: paths.exchangeRates, label: 'sidebar.exchangeRates', icon: Gauge, shortcut: 'F6' },
  { href: paths.units, label: 'sidebar.units', icon: Ruler, shortcut: 'F7' },
  { href: paths.receivables, label: 'sidebar.receivables', icon: Tag, shortcut: 'F5' },
  { href: paths.customers, label: 'sidebar.customers', icon: Users, shortcut: 'F8' },
  { href: paths.team, label: 'sidebar.team', icon: Users },
  { href: paths.users, label: 'Gestión de Usuarios', icon: ShieldCheck },
  { href: paths.subscriptions, label: 'Planes y Licencias', icon: Shield },
  { href: '/admin/bank-reconciliation', label: 'Conciliación Bancaria', icon: Landmark },
  { href: paths.moduleConfig, label: 'Configuración de Módulos', icon: Waypoints },
  { href: paths.settings, label: 'sidebar.settings', icon: Settings, shortcut: 'F12' },
];

// Staff menu items
export const staffMenu: NavItem[] = [
  { href: paths.masterDashboard, label: 'Admin Global', icon: Crown },
  { href: '/admin/master/health', label: 'Salud del Sistema', icon: Gauge },
  { href: '/admin/master/support', label: 'Soporte', icon: Users },
  { href: '/admin/master/payments', label: 'Pagos Recibidos', icon: CreditCard },
  { href: paths.subscriptions, label: 'Planes y Licencias', icon: Shield },
  { href: '/admin/bank-reconciliation', label: 'Conciliación Bancaria', icon: Landmark },
  { href: '/admin/vaults', label: 'Gestión de Gavetas', icon: Wallet },
  { href: paths.masterCategories, label: 'Categorías ERP', icon: Waypoints },
  { href: paths.masterCommerceTypes, label: 'Tipos de Comercio', icon: Building2 },
  { href: '/admin/master/notifications', label: 'Notificaciones Push', icon: Tag },
  { href: paths.users, label: 'Gestión de Usuarios', icon: ShieldCheck },
];

// Financial config menu (Monedas, Pagos y Geografía)
export const financialConfigMenu: NavItem[] = [
  { href: paths.masterCurrencies, label: 'Monedas', icon: Gauge },
  { href: '/admin/geography/country-currency', label: 'Monedas por País', icon: Landmark },
  { href: paths.staffPaymentTemplates, label: 'Catálogo de Métodos', icon: CreditCard },
  { href: '/admin/geography/countries', label: 'Geografía', icon: Globe },
];

// Founder menu items
export const founderMenu: NavItem[] = [
  { href: paths.platformClients, label: 'sidebar.platformLicenses', icon: Users, shortcut: 'F2' },
  { href: paths.founderPaymentMethods, label: 'sidebar.paymentMethods', icon: CreditCard },
  { href: paths.founderGlobalProducts, label: 'sidebar.globalProductBank', icon: Boxes, shortcut: 'F5' },
  { href: paths.platformReports, label: 'sidebar.platformMetrics', icon: LineChart, shortcut: 'F3' },
  { href: paths.platformSettings, label: 'sidebar.platformSettings', icon: Settings, shortcut: 'F4' },
];

// Group nav items by category
export function getNavGroups(
  items: NavItem[],
  isStaff: boolean,
  userType?: string | null,
  extraGroups?: { id: string; label: string; items: NavItem[] }[]
): NavGroup[] {
  if (isStaff) {
    const groupOrder = [
      { id: 'core', label: 'Núcleo', hrefs: [paths.masterDashboard] as string[] },
      {
        id: 'catalog',
        label: 'Catálogo',
        hrefs: [paths.masterCategories, paths.masterCommerceTypes] as string[],
      },
      {
        id: 'platform',
        label: 'Plataforma',
        hrefs: ['/admin/master/plans', paths.subscriptions, '/admin/payments', paths.users] as string[],
      },
      {
        id: 'ops',
        label: 'Operaciones',
        hrefs: ['/admin/master/health', '/admin/master/support', '/admin/master/payments', '/admin/master/notifications'] as string[],
      },
    ];

    const groups = groupOrder
      .map((group) => ({
        id: group.id,
        label: group.label,
        items: items.filter((item) => group.hrefs.includes(item.href)),
      }))
      .filter((group) => group.items.length > 0);

    // Add extra groups (like financial config) after catalog
    if (extraGroups && extraGroups.length > 0) {
      const catalogIndex = groups.findIndex(g => g.id === 'catalog');
      extraGroups.forEach((group, idx) => {
        groups.splice(catalogIndex + 1 + idx, 0, group);
      });
    }

    const groupedHrefs = new Set(groups.flatMap((group) => group.items.map((item) => item.href)));
    const remaining = items.filter((item) => !groupedHrefs.has(item.href));
    if (remaining.length > 0) {
      groups.push({ id: 'other', label: 'Otros', items: remaining });
    }
    return groups;
  }

  if (userType === 'FOUNDER') {
    return [
      {
        id: 'home',
        label: 'Inicio',
        items: items.filter((item) => item.href === paths.dashboard),
      },
      {
        id: 'platform',
        label: 'Plataforma',
        items: items.filter((item) => [
          paths.platformClients,
          paths.platformReports,
          paths.platformSettings,
          paths.founderPaymentMethods,
          paths.founderGlobalProducts,
        ].includes(item.href as any)),
      },
    ].filter((group) => group.items.length > 0);
  }

  const groupOrder = [
    {
      id: 'operations',
      label: 'Operaciones',
      hrefs: [paths.dashboard, paths.pos, paths.inventory, paths.billing, paths.receivables, paths.customers] as string[],
    },
    {
      id: 'analytics',
      label: 'Analítica',
      hrefs: [paths.financialAnalytics, paths.exchangeRates, paths.dashboardInvoices] as string[],
    },
    {
      id: 'admin',
      label: 'Administración',
      hrefs: [paths.team, paths.users, paths.moduleConfig, paths.settings, paths.units] as string[],
    },
  ];

  const groups = groupOrder
    .map((group) => ({
      id: group.id,
      label: group.label,
      items: items.filter((item) => group.hrefs.includes(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  const groupedHrefs = new Set(groups.flatMap((group) => group.items.map((item) => item.href)));
  const remaining = items.filter((item) => !groupedHrefs.has(item.href));
  if (remaining.length > 0) {
    groups.push({ id: 'other', label: 'Otros', items: remaining });
  }
  return groups;
}

// Filter nav items by role
export function filterNavItemsByRole(
  items: NavItem[],
  role: string | null,
  isStaff: boolean,
  canViewReports: boolean,
  canEditPrice: boolean,
  canVoidInvoice: boolean
): NavItem[] {
  if (isStaff) {
    return staffMenu;
  }

  if (role === 'FOUNDER') {
    return sortNavItems([
      {
        href: paths.dashboard,
        label: 'sidebar.dashboard',
        icon: BarChart3,
        shortcut: 'F9',
      },
      ...founderMenu.filter((item) => {
        if (item.href === paths.platformReports && !canViewReports) return false;
        return true;
      }),
    ]);
  }

  let menu = items.filter((item) => {
    if (role === 'SALES_CLERK') {
      return (
        item.href === paths.dashboard ||
        item.href === paths.pos ||
        item.href === paths.inventory ||
        item.href === paths.customers ||
        item.href === paths.dashboardInvoices
      );
    }
    if (role === 'WAREHOUSE') {
      return item.href === paths.dashboard || item.href === paths.inventory;
    }
    if (role === 'OWNER' || role === 'MANAGER') {
      if (item.href === paths.financialAnalytics) {
        return role === 'OWNER';
      }
      return (
        item.href !== paths.platformClients &&
        item.href !== paths.platformReports &&
        item.href !== paths.subscriptions
      );
    }
    return true;
  });

  return sortNavItems(
    menu.filter((item) => {
      if (item.href === paths.dashboard) return true;
      if (item.href === paths.financialAnalytics && !canViewReports) return false;
      if (item.href === paths.platformReports && !canViewReports) return false;
      if (item.href === paths.priceManagement && !canEditPrice) return false;
      if (item.href === paths.dashboardInvoices && !canVoidInvoice) return false;
      return true;
    })
  );
}
