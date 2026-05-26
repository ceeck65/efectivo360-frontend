<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Package class="h-7 w-7 text-cyan-500" />
          Catálogo Global
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Moderación del banco global de productos — revisa, aprueba, rechaza o banea propuestas.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          @click="showSlideOver = true"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-sm transition-colors"
        >
          <Plus class="h-4 w-4" />
          Nuevo Producto
        </button>
        <button
          @click="refreshKey++"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw class="h-4 w-4" />
          Recargar
        </button>
      </div>
    </div>

    <GlobalProductModerationDashboard :key="refreshKey" @productCreated="onProductCreated" />
    <GlobalProductSlideOver :visible="showSlideOver" @close="showSlideOver = false" @productCreated="onProductCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Package, Plus, RefreshCw } from 'lucide-vue-next';
import GlobalProductModerationDashboard from '@/views/admin/super-console/components/GlobalProductModerationDashboard.vue';
import GlobalProductSlideOver from '@/views/admin/super-console/components/GlobalProductSlideOver.vue';

const refreshKey = ref(0);
const showSlideOver = ref(false);

function onProductCreated() {
  refreshKey.value++;
  showSlideOver.value = false;
}
</script>
