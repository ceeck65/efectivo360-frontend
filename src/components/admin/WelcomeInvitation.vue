<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Wallet, Globe, BarChart3, ArrowRight, Sparkles, Shield, Users
} from 'lucide-vue-next';

const router = useRouter();
const loading = ref(false);

function goSetup() {
  loading.value = true;
  router.push('/admin/setup');
}

const pillars = [
  {
    icon: Wallet,
    title: 'Control Total',
    description: 'Gestiona tus gaveteros y efectivo en tiempo real.',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: Globe,
    title: 'Multimoneda',
    description: 'Vende y gasta en Bs., USD o COP sin complicaciones.',
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Inteligencia Financiera',
    description: 'Reportes automáticos para que tu negocio nunca se detenga.',
    gradient: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
];
</script>

<template>
  <div
    class="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] dark:from-[#0D0F14] dark:via-[#111620] dark:to-[#141824]">
    
    <!-- Subtle animated circles background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-cyan-400/5 blur-3xl animate-pulse" />
      <div
        class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-400/10 to-teal-400/5 blur-3xl animate-pulse"
        style="animation-delay: 2s" />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-300/5 to-blue-300/5 blur-3xl"
        style="animation-delay: 4s" />
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
      <!-- Logo / Brand -->
      <div class="mb-12 text-center animate-fade-in">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-blue-500/10 dark:bg-white/[0.06] mb-6">
          <Sparkles class="h-8 w-8 text-blue-600" />
        </div>
        <h1 class="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Bienvenido a
          <span class="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Efectivo 360</span>
        </h1>
        <p class="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Tu centro de control financiero. Configura tu primera tienda y empieza a gestionar tus finanzas como un profesional.
        </p>
      </div>

      <!-- Pillars -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-16">
        <div v-for="(p, idx) in pillars" :key="p.title"
          class="group relative rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-200/60 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] hover:border-slate-300/80 transition-all duration-500 dark:bg-white/[0.03] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
          :style="{ animationDelay: `${idx * 150}ms` }"
          style="animation: fadeSlideUp 0.6s ease-out both">
          <div class="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r" :class="p.gradient" />
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ring-1 ring-slate-100 dark:ring-white/[0.06]"
            :class="p.bg">
            <component :is="p.icon" class="h-6 w-6" :class="p.title === 'Control Total' ? 'text-emerald-600' : p.title === 'Multimoneda' ? 'text-blue-600' : 'text-violet-600'" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">{{ p.title }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ p.description }}</p>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center animate-fade-in" style="animation-delay: 0.5s">
        <button
          @click="goSetup"
          :disabled="loading"
          class="group relative inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-2xl shadow-[0_8px_30px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] disabled:opacity-70"
          style="background-size: 200% 200%">
          <span v-if="loading"
            class="h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent" />
          <span v-else>Configurar mi primera tienda ahora</span>
          <ArrowRight v-if="!loading" class="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        <p class="mt-4 text-xs text-slate-400">Menos de 2 minutos · Sin tarjeta de crédito</p>
      </div>

      <!-- Footer -->
      <div class="mt-20 text-center">
        <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield class="h-3.5 w-3.5" />
          <span>Tus datos están seguros con cifrado de grado bancario</span>
          <span class="mx-1">·</span>
          <Users class="h-3.5 w-3.5" />
          <span>Soporte 24/7</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeSlideUp 0.6s ease-out both;
}
</style>
