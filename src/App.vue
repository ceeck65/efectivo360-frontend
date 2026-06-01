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
        <div class="p-3 sm:p-4 lg:p-6">
          <!-- Tenant Configuration Banner -->
          <TenantConfigurationBanner />
          <RouterView />
        </div>
      </main>
    </div>
    
    <!-- Efi Chat Components (hidden on POS route) -->
    <EfiChatBubble v-if="!isPosView" />
    <EfiChatWindow v-if="!isPosView" />
  </div>
  
  <!-- Landing pages - with header/footer -->
  <div v-else class="landing-page">
    <LandingNav v-model:lang="currentLang" :copy="messages" />
    <main class="pt-16 md:pt-[72px]">
      <RouterView />
    </main>
    <LandingFooter v-model:lang="currentLang" :copy="messages" />
  </div>

  <!-- PWA Update Toast -->
  <Teleport to="body">
    <div v-if="needRefresh" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
      <span class="text-sm font-medium">Nueva versión disponible</span>
      <button @click="updateSW" class="px-3 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors">
        Actualizar
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, RouterView, useRouter } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import SplashScreen from '@/components/splash/SplashScreen.vue';
import { TheSidebar } from '@shared/index';
import BackofficeHeader from '@/components/header/BackofficeHeader.vue';
import EfiChatBubble from '@/modules/assistant/components/EfiChatBubble.vue';
import EfiChatWindow from '@/components/efi/EfiChatWidget.vue';
import TenantConfigurationBanner from '@/components/tenant/TenantConfigurationBanner.vue';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useForexRate } from '@/composables/useForexRate';

const { needRefresh, updateSW } = useRegisterSW({
  immediate: true,
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration) {
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const configStore = useConfigStore();
const showSplash = ref(true);
const isMobileMenuOpen = ref(false);
const isSidebarCollapsed = ref(false);

const { forexRate } = useForexRate();

const isAuthRoute = computed(() => {
  const path = route.path;
  return path.startsWith('/es/login') || path.startsWith('/es/register') ||
         path === '/login' || path === '/register';
});

const isAdminRoute = computed(() => {
  const path = route.path;
  return (path.startsWith('/admin') || path.startsWith('/auditor')) && !isSimpleRoute.value;
});

const isSimpleRoute = computed(() => {
  const path = route.path;
  return path.startsWith('/admin/setup') || path.startsWith('/admin/onboarding') || path.startsWith('/admin/welcome-to-360');
});

const isPosView = computed(() => route.path === '/admin/pos');

const needsShopWizard = computed(() => {
  return (
    isAdminRoute.value &&
    authStore.isAuthenticated &&
    !authStore.isStaff &&
    !authStore.hasConfiguredTenant &&
    !route.path.startsWith('/admin/setup') &&
    !route.path.startsWith('/admin/welcome-to-360') &&
    !route.path.startsWith('/admin/chat')
  );
});

void needsShopWizard;

watch(() => [authStore.isAuthenticated, authStore.hasConfiguredTenant], ([isAuthenticated, hasConfigured]) => {
  if (isAuthenticated && !hasConfigured && isAdminRoute.value) {
    router.push('/admin/setup');
  }
}, { immediate: true });

const currentLang = ref<'es' | 'en'>('es');

watch(() => route.params.lang as string | undefined, (lang) => {
  if (lang === 'en' || lang === 'es') {
    currentLang.value = lang;
  }
});

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

onMounted(() => {
  configStore.initialize();
});
</script>

<style>
@keyframes slide-up {
  from { transform: translate(-50%, 20px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
.animate-slide-up { animation: slide-up 0.3s ease-out; }
</style>
