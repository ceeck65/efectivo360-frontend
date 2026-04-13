<template>
  <SplashScreen v-if="showSplash" @complete="showSplash = false" />
  
  <!-- Auth pages - simple layout -->
  <div v-else-if="isAuthRoute" class="min-h-screen">
    <RouterView />
  </div>
  
  <!-- Admin/Dashboard pages - with sidebar -->
  <div v-else-if="isAdminRoute" class="min-h-screen flex">
    <TheSidebar v-model="isMobileMenuOpen" />
    <main class="flex-1 lg:ml-64 transition-all duration-300">
      <RouterView />
    </main>
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
import { useRoute, RouterView } from 'vue-router';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import SplashScreen from '@/components/splash/SplashScreen.vue';

const route = useRoute();
const showSplash = ref(true);
const isMobileMenuOpen = ref(false);

// Check if current route is auth page (login/register)
const isAuthRoute = computed(() => {
  const path = route.path;
  return path.startsWith('/es/login') || path.startsWith('/es/register') ||
         path === '/login' || path === '/register';
});

// Check if current route is admin/backoffice route
const isAdminRoute = computed(() => route.path.startsWith('/admin'));

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
