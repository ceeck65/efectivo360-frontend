import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { inventoryRoutes } from '@modules/inventory/router';
import { paymentsRoutes } from '@modules/payments/router';

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
    // Admin routes - protected
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
        },
        {
          path: 'geography/countries',
          name: 'Countries',
          component: () => import('@/views/admin/CountriesView.vue'),
        },
        {
          path: 'geography/states',
          name: 'States',
          component: () => import('@/views/admin/StatesView.vue'),
        },
        {
          path: 'geography/cities',
          name: 'Cities',
          component: () => import('@/views/admin/CitiesView.vue'),
        },
        {
          path: 'geography/country-currency',
          name: 'CountryCurrencyConfig',
          component: () => import('@/views/admin/CountryCurrencyConfigView.vue'),
        },
        // Currencies - Staff only
        {
          path: 'master/currencies',
          name: 'Currencies',
          component: () => import('@/views/admin/CurrenciesView.vue'),
          meta: { requiresStaff: true },
        },
        // Payment Methods - Separación de responsabilidades
        {
          path: 'staff/payment-templates',
          name: 'StaffPaymentTemplates',
          component: () => import('@/views/admin/GlobalPaymentMethodsView.vue'),
          meta: { requiresStaff: true },
        },
        {
          path: 'billing/saas-payments',
          name: 'TenantSaasPayments',
          component: () => import('@/views/admin/TenantSaasPaymentsView.vue'),
        },
        {
          path: 'settings/pos-payments',
          name: 'TenantPosPayments',
          component: () => import('@/views/admin/TenantPosPaymentMethodsView.vue'),
        },
        // Inventory module routes
        ...inventoryRoutes.map(route => ({
          ...route,
          path: route.path.replace('/inventory', 'inventory'),
        })),
        // Payments module routes
        ...paymentsRoutes.map(route => ({
          ...route,
          path: route.path.replace('/payments', 'payments'),
        })),
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/es',
    },
  ],
  scrollBehavior(to, from, savedPosition) {
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

router.beforeEach((to, from, next) => {
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
  }

  next();
});

export default router;
