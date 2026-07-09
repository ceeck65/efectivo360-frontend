<template>
  <div v-if="isOpen && blueprint" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#141824]">
      <!-- Header -->
      <div class="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10 dark:border-white/[0.06] dark:bg-[#141824]">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Grupos de Atributos</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Business Type: <span class="font-mono text-slate-700 dark:text-slate-300">{{ blueprint.code }}</span>
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex items-center justify-center h-64 text-sm text-slate-500 dark:text-slate-400">
        Los grupos de atributos están definidos globalmente y no se configuran por tipo de negocio.
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <button
          @click="$emit('close')"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Blueprint } from '../types';
import { X } from 'lucide-vue-next';

interface Props {
  blueprint: Blueprint | null;
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();
</script>
