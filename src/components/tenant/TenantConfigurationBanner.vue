<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { AlertCircle, ArrowRight, X } from 'lucide-vue-next';
import ShopWizard from './ShopWizard.vue';

const authStore = useAuthStore();
const isWizardOpen = ref(false);

// Check if user needs to configure tenant
const needsConfiguration = computed(() => {
  const user = authStore.user;
  // Non-staff users without configured tenant need to see the banner
  return (
    !user?.is_staff &&
    !user?.tenant_is_configured &&
    user?.role !== 'STAFF'
  );
});

const openWizard = () => {
  isWizardOpen.value = true;
};

const closeWizard = () => {
  isWizardOpen.value = false;
};

const handleWizardComplete = () => {
  closeWizard();
  // The wizard will handle redirect on success
};
</script>

<template>
  <!-- Banner -->
  <div
    v-if="needsConfiguration"
    class="mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/30"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0">
        <AlertCircle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-amber-900 dark:text-amber-100">
          Configura tu tienda
        </h3>
        <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Para comenzar a usar el sistema, necesitas configurar tu tienda. Completa la configuración inicial para acceder a todas las funcionalidades.
        </p>
        <button
          @click="openWizard"
          class="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          Configurar ahora
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>

  <!-- Wizard Modal -->
  <div
    v-if="isWizardOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="closeWizard"
  >
    <div class="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
      <!-- Close Button -->
      <button
        @click="closeWizard"
        class="absolute right-4 top-4 z-10 rounded-lg bg-white/90 p-2 text-slate-600 hover:bg-white hover:text-slate-900 backdrop-blur-sm"
      >
        <X class="h-5 w-5" />
      </button>

      <!-- Wizard Content -->
      <ShopWizard @complete="handleWizardComplete" />
    </div>
  </div>
</template>
