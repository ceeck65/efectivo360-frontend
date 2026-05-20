<script setup lang="ts">
import type { Profile } from '../../views/admin/expenses/types';

defineProps<{
  profiles: Profile[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  'quick-expense': [profile: Profile];
}>();
</script>

<template>
  <div class="space-y-2">
    <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
      Pagos Frecuentes
    </p>
    <div v-if="loading" class="flex gap-2">
      <div v-for="n in 3" :key="n" class="h-10 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
    </div>
    <div v-else-if="profiles.length === 0"
      class="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400 dark:border-white/[0.08] dark:bg-[#141824]">
      Sin perfiles frecuentes. Crea gastos recurrentes desde el wizard.
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <button v-for="p in profiles" :key="p.id" @click="emit('quick-expense', p)"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-slate-300 dark:hover:bg-white/[0.06]">
        <span>{{ p.alias || p.name }}</span>
        <span class="text-slate-400 dark:text-slate-500">{{ p.default_currency }}</span>
      </button>
    </div>
  </div>
</template>
