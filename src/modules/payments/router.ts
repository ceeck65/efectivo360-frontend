/**
 * @fileoverview Router del módulo Payments
 * @module @modules/payments/router
 */

import { defineAsyncComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const PaymentDashboard = defineAsyncComponent(
  () => import('./views/PaymentDashboard.vue')
);

const PaymentMethodsView = defineAsyncComponent(
  () => import('./views/PaymentMethodsView.vue')
);

const PaymentMethodFormView = defineAsyncComponent(
  () => import('./views/PaymentMethodFormView.vue')
);

const CurrencyConfigView = defineAsyncComponent(
  () => import('./views/CurrencyConfigView.vue')
);

const ExchangeRatesView = defineAsyncComponent(
  () => import('./views/ExchangeRatesView.vue')
);

const PaymentTemplatesView = defineAsyncComponent(
  () => import('./views/PaymentTemplatesView.vue')
);

const PaymentTemplateFormView = defineAsyncComponent(
  () => import('./views/PaymentTemplateFormView.vue')
);

const SaasPaymentMethodsView = defineAsyncComponent(
  () => import('./views/SaasPaymentMethodsView.vue')
);

const TransactionsView = defineAsyncComponent(
  () => import('./views/TransactionsView.vue')
);

const TransactionDetailView = defineAsyncComponent(
  () => import('./views/TransactionDetailView.vue')
);

const PaymentReportsView = defineAsyncComponent(
  () => import('./views/PaymentReportsView.vue')
);

// =============================================================================
// ROUTE CONSTANTS
// =============================================================================

export const PAYMENTS_ROUTE_PREFIX = '/payments';
export const PAYMENTS_ROUTE_NAME = 'payments';

// =============================================================================
// ROUTE NAMES
// =============================================================================

export const paymentsRouteNames = {
  dashboard: `${PAYMENTS_ROUTE_NAME}.dashboard`,
  methods: `${PAYMENTS_ROUTE_NAME}.methods`,
  methodCreate: `${PAYMENTS_ROUTE_NAME}.methods.create`,
  methodEdit: `${PAYMENTS_ROUTE_NAME}.methods.edit`,
  currencies: `${PAYMENTS_ROUTE_NAME}.currencies`,
  exchangeRates: `${PAYMENTS_ROUTE_NAME}.exchange-rates`,
  templates: `${PAYMENTS_ROUTE_NAME}.templates`,
  templateCreate: `${PAYMENTS_ROUTE_NAME}.templates.create`,
  templateEdit: `${PAYMENTS_ROUTE_NAME}.templates.edit`,
  saasMethods: `${PAYMENTS_ROUTE_NAME}.saas-methods`,
  transactions: `${PAYMENTS_ROUTE_NAME}.transactions`,
  transactionDetail: `${PAYMENTS_ROUTE_NAME}.transactions.detail`,
  reports: `${PAYMENTS_ROUTE_NAME}.reports`,
} as const;

// =============================================================================
// ROUTE PATHS HELPER
// =============================================================================

export const paymentsPaths = {
  dashboard: () => PAYMENTS_ROUTE_PREFIX,
  methods: () => `${PAYMENTS_ROUTE_PREFIX}/methods`,
  methodCreate: () => `${PAYMENTS_ROUTE_PREFIX}/methods/new`,
  methodEdit: (id: string) => `${PAYMENTS_ROUTE_PREFIX}/methods/${id}/edit`,
  currencies: () => `${PAYMENTS_ROUTE_PREFIX}/currencies`,
  exchangeRates: () => `${PAYMENTS_ROUTE_PREFIX}/exchange-rates`,
  templates: () => `${PAYMENTS_ROUTE_PREFIX}/templates`,
  templateCreate: () => `${PAYMENTS_ROUTE_PREFIX}/templates/new`,
  templateEdit: (id: string) => `${PAYMENTS_ROUTE_PREFIX}/templates/${id}/edit`,
  saasMethods: () => `${PAYMENTS_ROUTE_PREFIX}/saas-methods`,
  transactions: () => `${PAYMENTS_ROUTE_PREFIX}/transactions`,
  transactionDetail: (id: string) => `${PAYMENTS_ROUTE_PREFIX}/transactions/${id}`,
  reports: () => `${PAYMENTS_ROUTE_PREFIX}/reports`,
} as const;

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

export const paymentsRoutes: RouteRecordRaw[] = [
  {
    path: PAYMENTS_ROUTE_PREFIX,
    name: PAYMENTS_ROUTE_NAME,
    component: PaymentDashboard,
    meta: {
      title: 'Pagos y Monedas',
      requiresAuth: true,
      module: 'payments',
      icon: 'CreditCard',
      breadcrumb: 'Pagos',
    },
    children: [
      // Dashboard
      {
        path: '',
        name: paymentsRouteNames.dashboard,
        component: PaymentDashboard,
        meta: {
          title: 'Dashboard de Pagos',
          breadcrumb: 'Dashboard',
        },
      },
      
      // Tenant Payment Methods
      {
        path: 'methods',
        name: paymentsRouteNames.methods,
        component: PaymentMethodsView,
        meta: {
          title: 'Métodos de Pago',
          breadcrumb: 'Métodos',
        },
      },
      {
        path: 'methods/new',
        name: paymentsRouteNames.methodCreate,
        component: PaymentMethodFormView,
        meta: {
          title: 'Nuevo Método de Pago',
          breadcrumb: 'Nuevo',
        },
      },
      {
        path: 'methods/:id/edit',
        name: paymentsRouteNames.methodEdit,
        component: PaymentMethodFormView,
        props: true,
        meta: {
          title: 'Editar Método de Pago',
          breadcrumb: 'Editar',
        },
      },
      
      // Currencies (Staff)
      {
        path: 'currencies',
        name: paymentsRouteNames.currencies,
        component: CurrencyConfigView,
        meta: {
          title: 'Configuración de Monedas',
          breadcrumb: 'Monedas',
          requiresStaff: true,
        },
      },
      
      // Exchange Rates (Staff)
      {
        path: 'exchange-rates',
        name: paymentsRouteNames.exchangeRates,
        component: ExchangeRatesView,
        meta: {
          title: 'Tasas de Cambio',
          breadcrumb: 'Tasas',
          requiresStaff: true,
        },
      },
      
      // Payment Templates (Staff)
      {
        path: 'templates',
        name: paymentsRouteNames.templates,
        component: PaymentTemplatesView,
        meta: {
          title: 'Plantillas de Pago',
          breadcrumb: 'Plantillas',
          requiresStaff: true,
        },
      },
      {
        path: 'templates/new',
        name: paymentsRouteNames.templateCreate,
        component: PaymentTemplateFormView,
        meta: {
          title: 'Nueva Plantilla',
          breadcrumb: 'Nueva',
          requiresStaff: true,
        },
      },
      {
        path: 'templates/:id/edit',
        name: paymentsRouteNames.templateEdit,
        component: PaymentTemplateFormView,
        props: true,
        meta: {
          title: 'Editar Plantilla',
          breadcrumb: 'Editar',
          requiresStaff: true,
        },
      },
      
      // SaaS Payment Methods (Staff)
      {
        path: 'saas-methods',
        name: paymentsRouteNames.saasMethods,
        component: SaasPaymentMethodsView,
        meta: {
          title: 'Métodos SaaS',
          breadcrumb: 'SaaS',
          requiresStaff: true,
        },
      },
      
      // Transactions
      {
        path: 'transactions',
        name: paymentsRouteNames.transactions,
        component: TransactionsView,
        meta: {
          title: 'Transacciones',
          breadcrumb: 'Transacciones',
        },
      },
      {
        path: 'transactions/:id',
        name: paymentsRouteNames.transactionDetail,
        component: TransactionDetailView,
        props: true,
        meta: {
          title: 'Detalle de Transacción',
          breadcrumb: 'Detalle',
        },
      },
      
      // Reports
      {
        path: 'reports',
        name: paymentsRouteNames.reports,
        component: PaymentReportsView,
        meta: {
          title: 'Reportes de Pagos',
          breadcrumb: 'Reportes',
        },
      },
    ],
  },
];

// =============================================================================
// PLACEHOLDER COMPONENTS (se crearán las vistas reales después)
// =============================================================================

// Estos componentes deben ser creados en la carpeta views/
// Por ahora el router los referencia para completar la estructura
