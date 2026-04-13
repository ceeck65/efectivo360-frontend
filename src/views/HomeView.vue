<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section id="hero" class="relative flex min-h-[90vh] items-center justify-center px-4">
      <div class="relative z-10 mx-auto max-w-4xl text-center">
        <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {{ isSpanish ? 'Gestiona tus pagos' : 'Manage your payments' }}
          <span class="block bg-gradient-to-r from-[#007BFF] to-[#00D492] bg-clip-text text-transparent">
            {{ isSpanish ? 'con inteligencia' : 'intelligently' }}
          </span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
          {{ isSpanish 
            ? 'La plataforma todo-en-uno para gestionar pagos, facturas y finanzas de tu empresa.' 
            : 'The all-in-one platform to manage payments, invoices and your company finances.' }}
        </p>
        <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <RouterLink
            to="/#registro"
            class="rounded-xl border border-sky-400/35 bg-gradient-to-r from-[#0070F3]/90 to-sky-600/90 px-8 py-4 text-base font-semibold text-white shadow-[0_0_24px_-10px_rgba(56,189,248,0.5)] transition hover:border-sky-300/50 hover:shadow-[0_0_32px_-8px_rgba(56,189,248,0.55)]"
          >
            {{ isSpanish ? 'Comenzar Gratis' : 'Get Started Free' }}
          </RouterLink>
          <a
            :href="demoHref"
            class="rounded-xl px-8 py-4 text-base font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            {{ isSpanish ? 'Solicitar Demo' : 'Request Demo' }}
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="relative py-24 px-4">
      <div class="mx-auto max-w-6xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          {{ isSpanish ? 'Todo lo que necesitas' : 'Everything you need' }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-center text-slate-400">
          {{ isSpanish 
            ? 'Herramientas poderosas para simplificar tu gestión financiera.' 
            : 'Powerful tools to simplify your financial management.' }}
        </p>
      </div>
    </section>

    <!-- Clients Section -->
    <section id="clientes" class="relative py-24 px-4 border-t border-white/[0.08]">
      <div class="mx-auto max-w-6xl">
        <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">
          {{ isSpanish ? 'Empresas que confían' : 'Trusted by companies' }}
        </h2>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const lang = computed(() => route.params.lang as 'es' | 'en');
const isSpanish = computed(() => lang.value === 'es');
const demoHref = computed(() => {
  const subject = isSpanish.value ? 'Demo Efectivo 360' : 'Efectivo 360 demo';
  return `mailto:hola@efectivo360.com?subject=${encodeURIComponent(subject)}`;
});
</script>
