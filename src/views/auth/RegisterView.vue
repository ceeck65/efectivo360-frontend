<template>
  <div class="min-h-screen grid grid-cols-1 md:grid-cols-2">
    <!-- Column 1: Marketing/Branding - Hidden on mobile, visible on md+ -->
    <div class="hidden md:flex flex-col justify-between bg-gradient-to-br from-brand-primary to-brand-secondary p-8 lg:p-12">
      <!-- Top: Logo -->
      <div class="flex items-center gap-3 motion-fade-in-down">
        <img
          src="/assets/efectivo360/logo-mark.svg"
          alt="Efectivo 360"
          class="h-12 w-12 drop-shadow-lg"
        />
        <span class="text-xl font-bold text-white drop-shadow-md">Efectivo 360</span>
      </div>

      <!-- Center: Tagline and Mockup Preview -->
      <div class="flex flex-col items-center justify-center flex-1 py-8">
        <div class="text-center mb-8 motion-fade-in-up">
          <h1 class="text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg mb-4">
            Toma el control total<br />de tu negocio
          </h1>
          <p class="text-white/80 text-lg">
            El centro de control administrativo para tu éxito
          </p>
        </div>

        <!-- Mockup Preview Cards -->
        <div class="relative w-full max-w-md motion-scale-in">
          <!-- Dashboard Card -->
          <div class="absolute top-0 left-0 right-0 bg-white rounded-xl shadow-2xl p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2 bg-brand-primary/10 rounded-lg">
                <BarChart3 class="h-5 w-5 text-brand-primary" />
              </div>
              <span class="font-semibold text-slate-700">Dashboard</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-slate-100 rounded-lg p-2 text-center">
                <p class="text-xs text-slate-500">Ventas</p>
                <p class="text-lg font-bold text-emerald-600">$12.5K</p>
              </div>
              <div class="bg-slate-100 rounded-lg p-2 text-center">
                <p class="text-xs text-slate-500">Pedidos</p>
                <p class="text-lg font-bold text-brand-primary">84</p>
              </div>
              <div class="bg-slate-100 rounded-lg p-2 text-center">
                <p class="text-xs text-slate-500">Clientes</p>
                <p class="text-lg font-bold text-brand-secondary">128</p>
              </div>
            </div>
          </div>

          <!-- POS Card - Overlapping -->
          <div class="absolute top-32 left-8 right-0 bg-white rounded-xl shadow-2xl p-4 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2 bg-brand-secondary/10 rounded-lg">
                <CreditCard class="h-5 w-5 text-brand-secondary" />
              </div>
              <span class="font-semibold text-slate-700">Punto de Venta</span>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                <div class="flex items-center gap-2">
                  <Package class="h-4 w-4 text-slate-400" />
                  <span class="text-sm text-slate-600">Café Premium</span>
                </div>
                <span class="text-sm font-semibold text-slate-700">$12.00</span>
              </div>
              <div class="flex items-center justify-between bg-brand-primary/5 rounded-lg p-2">
                <span class="text-sm font-semibold text-slate-700">Total</span>
                <span class="text-base font-bold text-brand-primary">$36.00</span>
              </div>
            </div>
          </div>

          <!-- Spacer for layout -->
          <div class="h-64" />
        </div>
      </div>

      <!-- Bottom: Footer -->
      <p class="text-white/60 text-sm text-center motion-fade-in">
        © 2026 Efectivo 360. Todos los derechos reservados.
      </p>
    </div>

    <!-- Column 2: Form - Visible on all devices -->
    <div class="flex items-center justify-center bg-brand-light p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-md motion-fade-in-up-fast">
        <!-- Mobile Logo - Only visible on small screens -->
        <div class="md:hidden flex justify-center mb-6">
          <img
            src="/assets/efectivo360/logo-mark.svg"
            alt="Efectivo 360"
            class="h-16 w-16"
          />
        </div>

        <!-- Register Form Card -->
        <div class="border border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl w-full max-w-md">
          <div class="p-6 space-y-1 pb-2">
            <div class="mb-2 flex justify-center">
              <img
                src="/assets/efectivo360/logo-mark.svg"
                alt="Efectivo 360"
                class="h-12 w-12"
              />
            </div>
            <h2 class="text-center text-xl font-semibold text-brand-dark">
              {{ t('auth.createStoreTitle') }}
            </h2>
            <p class="text-center text-sm text-slate-500">
              {{ t('auth.registerHero') }}
            </p>
          </div>
          <div class="p-6 pt-0">
            <div
              v-if="msg"
              :class="cn(
                'mb-4 rounded-lg border px-3 py-2 text-sm',
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
                <label class="text-sm font-medium text-slate-700">{{ t('auth.ownerUsername') }}</label>
                <div class="relative">
                  <User class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    :class="cn('pl-10 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0', inputAuthClass)"
                    autoComplete="username"
                    v-model="form.ownerUsername"
                  />
                </div>
                <p v-if="errors.ownerUsername" class="text-sm text-red-500">{{ errors.ownerUsername }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">{{ t('auth.email') }}</label>
                <div class="relative">
                  <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    :class="cn('pl-10 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0', inputAuthClass)"
                    autoComplete="email"
                    v-model="form.email"
                  />
                </div>
                <p v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">{{ t('auth.password') }}</label>
                <div class="relative">
                  <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    :class="cn('pl-10 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0', inputAuthClass)"
                    autoComplete="new-password"
                    v-model="form.password"
                  />
                </div>
                <p v-if="errors.password" class="text-sm text-red-500">{{ errors.password }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">{{ t('auth.confirmPassword') }}</label>
                <div class="relative">
                  <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    :class="cn('pl-10 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0', inputAuthClass)"
                    autoComplete="new-password"
                    v-model="form.confirmPassword"
                  />
                </div>
                <p v-if="errors.confirmPassword" class="text-sm text-red-500">{{ errors.confirmPassword }}</p>
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="h-11 w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:shadow-lg transition-all rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <template v-if="isSubmitting">
                  <Loader2 class="h-4 w-4 animate-spin mr-2 inline" />
                  {{ t('auth.registering') }}
                </template>
                <template v-else>
                  {{ t('auth.registerSubmit') }}
                </template>
              </button>
            </form>

            <p class="mt-5 text-center text-sm text-slate-500">
              {{ t('auth.haveAccount') }}
              <button
                type="button"
                @click="onLogin"
                class="font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                {{ t('auth.signIn') }}
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
import { Loader2, Lock, Mail, User, BarChart3, CreditCard, Package } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const inputAuthClass =
  'h-11 border-slate-200 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0';

const form = reactive({
  ownerUsername: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const msg = ref<{ type: 'ok' | 'err'; text: string } | null>(null);
const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});

const t = (key: string): string => {
  const translations: Record<string, string> = {
    'auth.createStoreTitle': 'Crea tu cuenta',
    'auth.registerHero': 'Regístrate para comenzar',
    'auth.ownerUsername': 'Nombre de usuario',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.registering': 'Registrando...',
    'auth.registerSubmit': 'Registrar',
    'auth.haveAccount': '¿Ya tienes cuenta?',
    'auth.signIn': 'Inicia sesión',
    'auth.registerSuccess': '¡Cuenta creada exitosamente!',
    'auth.registerError': 'Error al crear la cuenta',
  };
  return translations[key] || key;
};

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);

  if (!form.ownerUsername.trim()) errors.ownerUsername = 'El nombre de usuario es requerido';
  if (!form.email.trim()) errors.email = 'El correo es requerido';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Correo inválido';
  if (!form.password) errors.password = 'La contraseña es requerida';
  else if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres';
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

  return Object.keys(errors).length === 0;
};

const onSubmit = async () => {
  msg.value = null;

  if (!validate()) return;

  isSubmitting.value = true;

  try {
    await authStore.register(form.ownerUsername, form.email, form.password);
    msg.value = { type: 'ok', text: t('auth.registerSuccess') };
    setTimeout(() => {
      router.push('/es/admin/dashboard');
    }, 1500);
  } catch (err: any) {
    msg.value = { type: 'err', text: err.message || t('auth.registerError') };
  } finally {
    isSubmitting.value = false;
  }
};

const onLogin = () => {
  router.push('/es/login');
};
</script>

<style>
/* Motion animations - Vue equivalent to Framer Motion */
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.motion-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

.motion-fade-in-up {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.motion-fade-in-up-fast {
  animation: fadeInUp 0.5s ease-out;
}

.motion-scale-in {
  animation: scaleIn 0.6s ease-out 0.4s both;
}

.motion-fade-in {
  animation: fadeIn 0.6s ease-out 0.6s both;
}
</style>
