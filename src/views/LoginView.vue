<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="rounded-2xl border border-white/[0.08] bg-[#0a0d14]/80 p-8 shadow-2xl backdrop-blur-xl">
        <h1 class="text-2xl font-bold text-white text-center">
          {{ isSpanish ? 'Iniciar Sesión' : 'Sign In' }}
        </h1>
        <p class="mt-2 text-center text-slate-400">
          {{ isSpanish ? 'Accede a tu cuenta' : 'Access your account' }}
        </p>
        
        <form class="mt-8 space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">
              {{ isSpanish ? 'Correo electrónico' : 'Email' }}
            </label>
            <input
              v-model="email"
              type="email"
              class="w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/50"
              :placeholder="isSpanish ? 'tu@email.com' : 'you@email.com'"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">
              {{ isSpanish ? 'Contraseña' : 'Password' }}
            </label>
            <input
              v-model="password"
              type="password"
              class="w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/50"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            class="w-full rounded-xl border border-sky-400/35 bg-gradient-to-r from-[#0070F3]/90 to-sky-600/90 py-3 text-base font-semibold text-white shadow-[0_0_24px_-10px_rgba(56,189,248,0.5)] transition hover:border-sky-300/50 hover:shadow-[0_0_32px_-8px_rgba(56,189,248,0.55)]"
          >
            {{ isSpanish ? 'Entrar' : 'Sign In' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <RouterLink to="/es" class="text-sm text-slate-500 hover:text-[#00D492] transition">
            {{ isSpanish ? 'Volver al inicio' : 'Back to home' }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const lang = computed(() => (route.query.lang as 'es' | 'en') || 'es');
const isSpanish = computed(() => lang.value === 'es');

const email = ref('');
const password = ref('');

const handleLogin = () => {
  // Placeholder for login logic
  console.log('Login attempt:', email.value);
  router.push('/es');
};
</script>
