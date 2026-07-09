import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usersRoutes } from '@modules/users/router';
import { categoriesRoutes } from '@modules/categories/router';
import { blueprintsRoutes } from '@modules/blueprints/router';
import { chatRoutes } from '@modules/chat/router';
import { vaultsRoutes } from '@modules/vaults/router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/es',
    },
    {
      path: '/:lang(es|en)',
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'pricing',
          name: 'Pricing',
          component: () => import('@/views/PricingView.vue'),
        },
        {
          path: 'login',
          name: 'Login',
          component: () => import('@/views/auth/LoginView.vue'),
          props: true,
        },
        {
          path: 'register',
          name: 'Register',
          component: () => import('@/views/auth/RegisterView.vue'),
          props: true,
        },
      ],
    },
    {
      path: '/login',
      redirect: '/es/login',
    },
    {
      path: '/register',
      redirect: '/es/register',
    },
    // Reset password (forced after login with temp password)
    {
      path: '/auth/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { requiresAuth: true, hideSidebar: true },
    },
    // 404 - Full screen without layout
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/modules/shared/views/NotFoundView.vue')
    },
    // Admin routes - protected
    {
      path: '/admin',
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/welcome-to-360',
      name: 'WelcomeTo360',
      component: () => import('@/components/admin/WelcomeInvitation.vue'),
      meta: { requiresAuth: true, hideSidebar: true },
    },
    {
      path: '/admin/setup',
      name: 'ShopSetup',
      component: () => import('@/views/ShopWizardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/onboarding',
      name: 'ShopOnboarding',
      component: () => import('@/views/ShopWizardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/super-console',
      name: 'SuperAdminConsole',
      component: () => import('@/views/admin/super-console'),
      meta: { requiresAuth: true, requiresStaff: true },
    },
    // Auditor routes - for EXTERNAL_AUDITOR role
    {
      path: '/auditor',
      redirect: '/auditor/dashboard',
      meta: { requiresAuth: true },
    },
    {
      path: '/auditor/dashboard',
      name: 'AuditorDashboard',
      component: () => import('@/views/auditor/AuditorDashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/geography/countries',
      name: 'Countries',
      component: () => import('@/views/admin/CountriesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/geography/states',
      name: 'States',
      component: () => import('@/views/admin/StatesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/geography/cities',
      name: 'Cities',
      component: () => import('@/views/admin/CitiesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/geography/country-currency',
      name: 'CountryCurrencyConfig',
      component: () => import('@/views/admin/CountryCurrencyConfigView.vue'),
      meta: { requiresAuth: true },
    },
    // Currencies - Staff only
    {
      path: '/admin/master/currencies',
      name: 'Currencies',
      component: () => import('@/views/admin/CurrenciesView.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
    },
    // Forex Rate Management - All authenticated users (read-only)
    {
      path: '/admin/forex-rates',
      name: 'ForexRates',
      component: () => import('@/views/admin/ForexRatesView.vue'),
      meta: { requiresAuth: true },
    },
// Payment Methods - Separación de responsabilidades
     {
       path: '/admin/staff/payment-templates',
       name: 'StaffPaymentTemplates',
       component: () => import('@/views/admin/GlobalPaymentMethodsView.vue'),
       meta: { requiresAuth: true, requiresStaff: true },
     },
// POS - Punto de Venta - Available to authenticated users (staff and tenants)
     {
         path: '/admin/pos',
         name: 'PosMain',
         component: () => import('@/views/admin/staff/pos/PosMainView.vue'),
         meta: { requiresAuth: true },
         beforeEnter: async (_to, _from, next) => {
           const { useCajaStore } = await import('@/stores/caja');
           const cajaStore = useCajaStore();
           const turno = await cajaStore.verificarTurnoActivo();
           if (turno) {
             next();
           } else {
             next({ name: 'PosApertura' });
           }
         },
       },
       {
         path: '/admin/pos/apertura',
         name: 'PosApertura',
         component: () => import('@/views/admin/staff/pos/AperturaCaja.vue'),
         meta: { requiresAuth: true, hideSidebar: true },
         beforeEnter: async (_to, _from, next) => {
           const { useCajaStore } = await import('@/stores/caja');
           const cajaStore = useCajaStore();
           const turno = await cajaStore.verificarTurnoActivo();
           if (turno) {
             next({ name: 'PosMain' });
           } else {
             next();
           }
         },
       },
// Treasury - Available to authenticated users (staff and tenants)
     {
       path: '/admin/staff/treasury',
       name: 'Treasury',
       component: () => import('@/views/admin/staff/treasury/TreasuryView.vue'),
       meta: { requiresAuth: true },
     },
     // Egresos y Gastos
     {
       path: '/admin/staff/expenses',
       name: 'Expenses',
        component: () => import('@/views/admin/expenses/ExpenseDashboard.vue'),
         meta: { requiresAuth: true },
       },
       {
         path: '/admin/staff/incomes',
         name: 'Incomes',
         component: () => import('@/views/admin/expenses/IncomeDashboard.vue'),
         meta: { requiresAuth: true },
       },
       {
         path: '/admin/staff/cxp',
         name: 'Cxp',
         component: () => import('@/views/admin/cxp/CxpReadonlyDashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/purchases',
        name: 'Purchases',
        component: () => import('@/views/purchases/PurchaseDashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/cxc',
        name: 'Cxc',
        component: () => import('@/views/admin/cxc/CustomerDebtsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/global-catalog',
        name: 'GlobalCatalog',
        component: () => import('@/views/admin/staff/GlobalCatalogView.vue'),
        meta: { requiresAuth: true, requiresStaff: true },
      },
      {
        path: '/admin/purchases/new',
        name: 'NewPurchase',
        component: () => import('@/views/admin/staff/purchases/PurchaseForm.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/purchases/suppliers',
        name: 'Suppliers',
        component: () => import('@/views/admin/staff/purchases/SupplierManageView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/business/console',
        name: 'BusinessConsole',
        component: () => import('@/views/admin/business-console/BusinessConsoleView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/inventory',
        name: 'InventoryList',
        component: () => import('@/views/admin/staff/inventory/InventoryList.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/inventory/kardex',
        name: 'InventoryKardex',
        component: () => import('@/views/admin/staff/inventory/InventoryKardexView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/products',
        name: 'ProductCatalog',
        component: () => import('@/views/admin/staff/products/ProductCatalogView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/products/new',
        name: 'NewProduct',
        component: () => import('@/views/admin/staff/products/ProductForm.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/staff/products/:id/edit',
        name: 'EditProduct',
        component: () => import('@/views/admin/staff/products/ProductForm.vue'),
        meta: { requiresAuth: true },
      },
     {
       path: '/admin/billing/saas-payments',
      name: 'TenantSaasPayments',
      component: () => import('@/views/admin/TenantSaasPaymentsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/settings/pos-payments',
      name: 'TenantPosPayments',
      component: () => import('@/views/admin/TenantPosPaymentMethodsView.vue'),
      meta: { requiresAuth: true },
    },
    // Tenant Add-ons Marketplace
    {
      path: '/admin/marketplace',
      name: 'AddonsMarketplace',
      component: () => import('@/views/tenant/AddonsMarketplace.vue'),
      meta: { requiresAuth: true },
    },
    // Metadata-based Module Marketplace
    {
      path: '/admin/tenant/modules',
      name: 'TenantModules',
      component: () => import('@/views/admin/MarketplaceView.vue'),
      meta: { requiresAuth: true },
    },
    // Navigation Menu Modules - Staff only
    {
      path: '/admin/menu-modules',
      name: 'MenuModules',
      component: () => import('@/views/admin/MenuModulesView.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
    },
    // Role Permissions - Staff only
    {
      path: '/admin/role-permissions',
      name: 'RolePermissions',
      component: () => import('@/views/admin/RolePermissionsView.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
    },
    // Roles Management - Staff only
    {
      path: '/admin/roles',
      name: 'RolesList',
      component: () => import('@/views/admin/RolesListView.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
    },
    // Users module - Staff only
    ...usersRoutes,
    // Categories module - Staff only
    ...categoriesRoutes,
    // Blueprints module - Staff only
    ...blueprintsRoutes,
    // Chat module - Staff only
    ...chatRoutes,
    // Vaults module - Staff and Tenant
    ...vaultsRoutes,
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }
    return { top: 0 };
  },
});

// Auth guard - protect admin routes
let isRedirecting = false;

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Prevent redirect loops
  if (isRedirecting) {
    next();
    return;
  }

  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      // Only redirect if not already going to login
      if (!to.path.startsWith('/es/login') && to.path !== '/login') {
        isRedirecting = true;
        next('/es/login');
        // Reset flag after navigation completes
        setTimeout(() => { isRedirecting = false; }, 100);
        return;
      }
    }

    // Redirect EXTERNAL_AUDITOR to auditor dashboard
    if (authStore.user?.role === 'EXTERNAL_AUDITOR' && to.path.startsWith('/admin/dashboard')) {
      isRedirecting = true;
      next('/auditor/dashboard');
      setTimeout(() => { isRedirecting = false; }, 100);
      return;
    }

    // Force password change if required (skip for reset-password itself)
    if (authStore.requiresPasswordChange && to.name !== 'ResetPassword') {
      isRedirecting = true;
      next({ name: 'ResetPassword' });
      setTimeout(() => { isRedirecting = false; }, 100);
      return;
    }

    // Tenant requirement: redirect users without tenant to welcome page
    if (
      !authStore.isStaff &&
      !authStore.hasTenant &&
      !to.path.startsWith('/admin/dashboard') &&
      !to.path.startsWith('/admin/welcome-to-360') &&
      !to.path.startsWith('/admin/setup') &&
      !to.path.startsWith('/admin/onboarding')
    ) {
      isRedirecting = true;
      next('/admin/welcome-to-360');
      setTimeout(() => { isRedirecting = false; }, 100);
      return;
    }
  }

  next();
});

export default router;
