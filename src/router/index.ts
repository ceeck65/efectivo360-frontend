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
      component: () => import('@/views/admin/SuperAdminConsole.vue'),
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
  }

  next();
});

export default router;
