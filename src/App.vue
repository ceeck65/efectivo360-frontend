<template>
  <SplashScreen v-if="showSplash" @complete="showSplash = false" />
  
  <!-- Auth pages - simple layout -->
  <div v-else-if="isAuthRoute" class="min-h-screen">
    <RouterView />
  </div>

  <!-- 404 page - no layout -->
  <div v-else-if="route.name === 'not-found'">
    <RouterView />
  </div>

  <!-- Setup/Onboarding pages - simple layout (no sidebar/header) -->
  <div v-else-if="isSimpleRoute" class="min-h-screen">
    <RouterView />
  </div>

  <!-- Admin/Dashboard pages - with sidebar -->
  <div v-else-if="isAdminRoute" class="flex h-screen w-full overflow-hidden">
    <!-- Sidebar -->
    <TheSidebar 
      v-model="isMobileMenuOpen" 
      v-model:is-collapsed="isSidebarCollapsed"
    />
    
    <!-- Right Container -->
    <div class="flex-1 flex flex-col min-w-0 h-full">
      <!-- Header -->
      <BackofficeHeader 
        :on-open-sidebar="() => isMobileMenuOpen = true" 
        :forex-rate="forexRate"
      />
      
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-slate-50">
        <div class="p-6">
          <!-- Tenant Configuration Banner -->
          <TenantConfigurationBanner />
          <RouterView />
        </div>
      </main>
    </div>
    
    <!-- Efi Chat Components -->
    <EfiChatBubble />
    <EfiChatWindow />
  </div>
  
  <!-- Landing pages - with header/footer -->
  <div v-else class="landing-page">
    <LandingNav v-model:lang="currentLang" :copy="messages" />
    <main class="pt-16 md:pt-[72px]">
      <RouterView />
    </main>
    <LandingFooter v-model:lang="currentLang" :copy="messages" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, RouterView, useRouter } from 'vue-router';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import SplashScreen from '@/components/splash/SplashScreen.vue';
import { TheSidebar } from '@shared/index';
import BackofficeHeader from '@/components/header/BackofficeHeader.vue';
import EfiChatBubble from '@/modules/assistant/components/EfiChatBubble.vue';
import EfiChatWindow from '@/components/efi/EfiChatWidget.vue';
import TenantConfigurationBanner from '@/components/tenant/TenantConfigurationBanner.vue';
import { useAuthStore } from '@/stores/auth';
import { useForexRate } from '@/composables/useForexRate';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const showSplash = ref(true);
const isMobileMenuOpen = ref(false);
const isSidebarCollapsed = ref(false);

// Use the forex rate composable - it will auto-refresh
const { forexRate } = useForexRate();

// Check if current route is auth page (login/register)
const isAuthRoute = computed(() => {
  const path = route.path;
  return path.startsWith('/es/login') || path.startsWith('/es/register') ||
         path === '/login' || path === '/register';
});

// Check if current route is admin/backoffice route
const isAdminRoute = computed(() => {
  const path = route.path;
  return (path.startsWith('/admin') || path.startsWith('/auditor')) && !isSimpleRoute.value;
});

// Check if current route is a simple route (no sidebar/header)
const isSimpleRoute = computed(() => {
  const path = route.path;
  return path.startsWith('/admin/setup') || path.startsWith('/admin/onboarding');
});

// Check if user needs to be redirected to shop wizard
const needsShopWizard = computed(() => {
  return (
    isAdminRoute.value &&
    authStore.isAuthenticated &&
    !authStore.isStaff &&
    !authStore.hasConfiguredTenant &&
    !route.path.startsWith('/admin/setup') && // Don't redirect if already on setup
    !route.path.startsWith('/admin/chat') // Don't redirect if on chat
  );
});

// Silence unused variable warning (computed is used in watch)
void needsShopWizard;

// Watch for authentication changes and redirect if needed
watch(() => [authStore.isAuthenticated, authStore.hasConfiguredTenant], ([isAuthenticated, hasConfigured]) => {
  if (isAuthenticated && !hasConfigured && isAdminRoute.value) {
    router.push('/admin/setup');
  }
}, { immediate: true });

// Language detection from route - only update when actually changed
const currentLang = ref<'es' | 'en'>('es');

// Watch for route changes to update language (without immediate to prevent loops)
watch(() => route.params.lang as string | undefined, (lang) => {
  if (lang === 'en' || lang === 'es') {
    currentLang.value = lang;
  }
});

// i18n messages
const messages = computed(() => {
  const isSpanish = currentLang.value === 'es';
  return {
    nav: {
      features: isSpanish ? 'Características' : 'Features',
      pricing: isSpanish ? 'Planes' : 'Pricing',
      clients: isSpanish ? 'Clientes' : 'Clients',
      ctaSecondary: isSpanish ? 'Solicitar Demo' : 'Request Demo',
      ctaPrimary: isSpanish ? 'Comenzar Gratis' : 'Get Started',
      menuTitle: isSpanish ? 'Menú' : 'Menu',
      login: isSpanish ? 'Iniciar Sesión' : 'Login',
      openMenu: isSpanish ? 'Abrir menú' : 'Open menu',
      closeMenu: isSpanish ? 'Cerrar menú' : 'Close menu',
    },
    footer: {
      tagline: isSpanish
        ? 'La plataforma de pagos y gestión financiera diseñada para empresas modernas.'
        : 'The payments and financial management platform designed for modern businesses.',
      product: isSpanish ? 'Producto' : 'Product',
      company: isSpanish ? 'Empresa' : 'Company',
      legal: isSpanish ? 'Legal' : 'Legal',
      language: isSpanish ? 'Idioma' : 'Language',
      rights: isSpanish ? 'Todos los derechos reservados.' : 'All rights reserved.',
      links: {
        features: isSpanish ? 'Características' : 'Features',
        pricing: isSpanish ? 'Precios' : 'Pricing',
        security: isSpanish ? 'Seguridad' : 'Security',
        about: isSpanish ? 'Nosotros' : 'About',
        careers: isSpanish ? 'Empleos' : 'Careers',
        contact: isSpanish ? 'Contacto' : 'Contact',
        privacy: isSpanish ? 'Privacidad' : 'Privacy',
        terms: isSpanish ? 'Términos' : 'Terms',
      },
    },
  };
});

</script>
