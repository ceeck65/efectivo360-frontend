<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Cambio de Contraseña</h1>
        <p class="text-sm text-blue-200/70 mt-1.5 font-medium">Debes cambiar tu contraseña temporal antes de continuar</p>
      </div>

      <form @submit.prevent="onSubmit"
        class="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-5 shadow-2xl">

        <div v-if="errorMsg"
          class="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
          <p class="text-red-300 text-xs font-medium">{{ errorMsg }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Nueva Contraseña
          </label>
          <div class="relative">
            <input v-model="newPassword" :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              class="w-full h-12 px-4 pr-12 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Confirmar Contraseña
          </label>
          <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'"
            placeholder="Repite la contraseña"
            class="w-full h-12 px-4 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all" />
        </div>

        <div v-if="passwordError" class="text-xs text-amber-400 font-medium">
          {{ passwordError }}
        </div>

        <button type="submit" :disabled="!canSubmit || submitting"
          class="w-full h-13 rounded-xl text-sm font-black text-white tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          :class="canSubmit && !submitting
            ? 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-400 hover:to-sky-400 shadow-blue-500/30'
            : 'bg-slate-600/50 cursor-not-allowed'">
          <div v-if="submitting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Actualizar Contraseña
          </template>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

const router = useRouter();
const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success } = useNotify();

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const submitting = ref(false);
const errorMsg = ref('');

const passwordError = computed(() => {
  if (newPassword.value && newPassword.value.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
    return 'Las contraseñas no coinciden';
  }
  return '';
});

const canSubmit = computed(() =>
  newPassword.value.length >= 8
  && newPassword.value === confirmPassword.value
);

async function onSubmit() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  errorMsg.value = '';

  try {
    await fetchApi('/api/v1/auth/set-password/', {
      method: 'POST',
      data: { password: newPassword.value },
    });
    authStore.confirmPasswordChange();
    success('Contraseña actualizada exitosamente');
    router.push('/admin/dashboard');
  } catch (e: any) {
    errorMsg.value = e?.message || 'Error al actualizar la contraseña';
  } finally {
    submitting.value = false;
  }
}
</script>
