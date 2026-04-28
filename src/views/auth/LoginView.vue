<template>
  <div class="min-h-screen grid grid-cols-1 md:grid-cols-2">
    <!-- Column 1: Marketing/Branding - Hidden on mobile, visible on md+ -->
    <div class="hidden md:flex flex-col bg-gradient-to-br from-[#007BFF] to-[#00D492] relative overflow-hidden">
      <!-- Pattern overlay -->
      <div 
        class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"/>
      
      <div class="relative z-10 flex flex-col h-full p-8 lg:p-12">
        <!-- Top: Logo -->
        <div
          class="flex items-center gap-3 motion-safe:animate-[fadeInDown_0.6s_ease-out]"
        >
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 rounded-full bg-white/30 blur-sm" />
            <div class="relative w-full h-full rounded-full bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              <img
                src="/assets/efectivo360/logo-mark.svg"
                alt="Efectivo 360"
                class="h-10 w-10 object-contain"
              />
            </div>
          </div>
          <span class="text-xl font-bold text-white drop-shadow-md">Efectivo 360</span>
        </div>

        <!-- Center: Hero Content -->
        <div class="flex flex-col justify-center flex-1 py-8 max-w-lg">
          <div
            class="motion-safe:animate-[fadeInUp_0.6s_ease-out_0.2s]"
          >
            <h1 class="text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg mb-4">
              Tu comercio, sincronizado en todo momento.
            </h1>
            <p class="text-white/90 text-lg mb-8">
              La plataforma administrativa diseñada para negocios que venden en serio.
            </p>
          </div>

          <!-- Feature List -->
          <div
            class="space-y-4 motion-safe:animate-[fadeInUp_0.6s_ease-out_0.4s]"
          >
            <div class="flex items-start gap-3">
              <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <Package class="h-5 w-5 text-white" />
              </div>
              <p class="text-white/90 text-sm leading-relaxed">
                Inventario en tiempo real y multisucursal.
              </p>
            </div>
            <div class="flex items-start gap-3">
              <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <CreditCard class="h-5 w-5 text-white" />
              </div>
              <p class="text-white/90 text-sm leading-relaxed">
                POS omnicanal con soporte multimoneda (Bs/USD).
              </p>
            </div>
            <div class="flex items-start gap-3">
              <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <BarChart3 class="h-5 w-5 text-white" />
              </div>
              <p class="text-white/90 text-sm leading-relaxed">
                Reportes de ventas y gestión de créditos integrada.
              </p>
            </div>
            <div class="flex items-start gap-3">
              <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <Shield class="h-5 w-5 text-white" />
              </div>
              <p class="text-white/90 text-sm leading-relaxed">
                Seguridad empresarial con respaldo en la nube.
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom: Mockup Preview -->
        <div
          class="relative mt-auto motion-safe:animate-[fadeInUp_0.6s_ease-out_0.6s]"
        >
          <div class="relative w-full max-w-md mx-auto" style="perspective: 1000px;">
            <div 
              class="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-white/20"
              style="transform: rotateX(5deg) rotateY(-5deg) rotateZ(2deg); transform-style: preserve-3d;"
            >
              <!-- Mockup Header -->
              <div class="h-8 border-b border-slate-100 flex items-center px-3 gap-2 bg-slate-50">
                <div class="flex gap-1">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div class="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>
              <!-- Mockup Content -->
              <div class="p-4 bg-slate-50/50">
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <div class="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                    <p class="text-[8px] text-slate-500">Ventas</p>
                    <p class="text-sm font-bold text-[#007BFF]">$12.5K</p>
                  </div>
                  <div class="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                    <p class="text-[8px] text-slate-500">Pedidos</p>
                    <p class="text-sm font-bold text-[#00D492]">84</p>
                  </div>
                  <div class="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                    <p class="text-[8px] text-slate-500">Clientes</p>
                    <p class="text-sm font-bold text-slate-700">128</p>
                  </div>
                </div>
                <div class="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                  <div class="h-12 flex items-end gap-1">
                    <div 
                      v-for="(h, i) in [40, 65, 45, 80, 55, 90, 70]" 
                      :key="i" 
                      class="flex-1 rounded-t-sm bg-gradient-to-t from-[#007BFF] to-[#00D492]"
                      :style="{ height: `${h * 0.4}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- Glow effect behind -->
            <div class="absolute -inset-4 bg-white/10 rounded-2xl blur-2xl -z-10" />
          </div>
        </div>

        <!-- Footer -->
        <p
          class="text-white/60 text-sm text-center mt-6 motion-safe:animate-[fadeIn_0.6s_ease-out_0.8s]"
        >
          © 2026 Efectivo 360. Todos los derechos reservados.
        </p>
      </div>
    </div>

    <!-- Column 2: Form - Visible on all devices -->
    <div class="flex items-center justify-center bg-brand-light p-4 sm:p-6 lg:p-8">
      <div
        class="w-full max-w-md motion-safe:animate-[fadeInUp_0.5s_ease-out]"
      >
        <!-- Mobile Logo - Only visible on small screens -->
        <div class="md:hidden flex justify-center mb-6">
          <img
            src="/assets/efectivo360/logo-mark.svg"
            alt="Efectivo 360"
            class="h-16 w-16"
          />
        </div>

        <!-- Login Form Card -->
        <div class="border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl w-full max-w-md">
          <div class="flex flex-col space-y-1.5 p-6 pb-2">
            <div class="mb-2 flex justify-center">
              <img
                src="/assets/efectivo360/logo-mark.svg"
                alt="Efectivo 360"
                class="h-14 w-14"
              />
            </div>
            <h3 class="text-center text-xl text-brand-dark font-semibold leading-none tracking-tight">
              {{ t('auth.welcomeBack') }}
            </h3>
            <p class="text-center text-slate-500 text-sm">
              {{ t('auth.loginHero') }}
            </p>
          </div>
          <div class="p-6 pt-0 space-y-5">
            <div
              v-if="msg"
              :class="cn(
                'rounded-lg border px-3 py-2 text-sm',
                msg.type === 'err'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700'
              )"
              role="status"
            >
              {{ msg.text }}
            </div>

            <form @submit.prevent="onSubmit" class="space-y-4">
              <div class="space-y-2">
                <label for="emailOrUsername" class="text-slate-700 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{{ t('auth.emailOrUsername') }}</label>
                <div class="relative">
                  <User class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="emailOrUsername"
                    v-model="form.emailOrUsername"
                    type="text"
                    :class="cn('pl-20', inputAuthClass)"
                    autocomplete="username"
                    class=" pl-8"
                  />
                </div>
                <p v-if="errors.emailOrUsername" class="text-sm text-red-500">{{ errors.emailOrUsername }}</p>
              </div>
              <div class="space-y-2">
                <label for="password" class="text-slate-700 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{{ t('auth.password') }}</label>
                <div class="relative">
                  <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    :class="cn('pr-12 pl-20', inputAuthClass)"
                    autocomplete="current-password"
                    class=" pl-8"
                  />
                  <button
                    type="button"
                    class="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>
                <p v-if="errors.password" class="text-sm text-red-500">{{ errors.password }}</p>
              </div>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="h-11 w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <template v-if="isSubmitting">
                  <Loader2 class="h-4 w-4 animate-spin mr-2" />
                  {{ t('auth.loading') }}
                </template>
                <template v-else>
                  {{ t('auth.login') }}
                </template>
              </button>
            </form>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-slate-200" />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white px-2 text-slate-400">
                  {{ t('auth.orContinueWith') }}
              </span>
              </div>
            </div>

            <!-- Social buttons -->
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2 gap-2"
                @click="onGoogleClick"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2 gap-2"
                @click="onFacebookClick"
              >
                <Facebook class="h-5 w-5" />
                Facebook
              </button>
            </div>

            <!-- Register link -->
            <p class="text-center text-sm text-slate-500">
              {{ t('auth.newHere') }}
              <button
                type="button"
                @click="onRegister"
                class="font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                {{ t('auth.createAccount') }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2, Eye, EyeOff, Facebook, User, Lock, BarChart3, CreditCard, Package, Shield } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const inputAuthClass =
  'h-11 border-slate-200 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0 flex w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

const form = reactive({
  emailOrUsername: '',
  password: '',
});

const msg = ref<{ type: 'ok' | 'err'; text: string } | null>(null);
const isSubmitting = ref(false);
const showPassword = ref(false);
const errors = reactive<Record<string, string>>({});

const t = (key: string): string => {
  const translations: Record<string, string> = {
    'auth.welcomeBack': 'Bienvenido de nuevo',
    'auth.loginHero': 'Ingresa para gestionar tu negocio',
    'auth.emailOrUsername': 'Correo electrónico o Usuario',
    'auth.password': 'Contraseña',
    'auth.loading': 'Iniciando sesión...',
    'auth.login': 'Iniciar sesión',
    'auth.orContinueWith': 'O continúa con',
    'auth.newHere': '¿Nuevo aquí?',
    'auth.createAccount': 'Crear cuenta',
    'auth.loginError': 'Error al iniciar sesión',
    'auth.loginSuccess': 'Sesión iniciada correctamente',
    'auth.googleHint': 'Próximamente: Google OAuth',
    'auth.facebookHint': 'Próximamente: Facebook OAuth',
  };
  return translations[key] || key;
};

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);

  if (!form.emailOrUsername) errors.emailOrUsername = 'El correo o usuario es requerido';
  if (!form.password) errors.password = 'La contraseña es requerida';

  return Object.keys(errors).length === 0;
};

const onSubmit = async () => {
  msg.value = null;

  if (!validate()) return;

  isSubmitting.value = true;

  try {
    await authStore.login(form.emailOrUsername, form.password);
    msg.value = { type: 'ok', text: t('auth.loginSuccess') };
    setTimeout(() => {
      // Redirect EXTERNAL_AUDITOR to auditor dashboard, others to admin dashboard
      if (authStore.user?.role === 'EXTERNAL_AUDITOR') {
        router.push('/auditor/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    }, 500);
  } catch (err: any) {
    msg.value = { type: 'err', text: err.message || t('auth.loginError') };
  } finally {
    isSubmitting.value = false;
  }
};

const onRegister = () => {
  router.push('/es/register');
};

const onGoogleClick = () => {
  msg.value = { type: 'ok', text: t('auth.googleHint') };
};

const onFacebookClick = () => {
  msg.value = { type: 'ok', text: t('auth.facebookHint') };
};
</script>

<style>
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
