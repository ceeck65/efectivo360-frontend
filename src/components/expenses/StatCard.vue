<script setup lang="ts">
defineProps<{
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon?: string;
  loading?: boolean;
}>();
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95"
      :class="color" />
    <div class="relative z-[2] flex items-center justify-between">
      <div>
        <p
          class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ title }}</p>
        <p v-if="loading" class="mt-1 h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
        <p v-else class="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ value }}</p>
        <p v-if="subtitle" class="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{{ subtitle }}</p>
      </div>
      <div v-if="icon"
        class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-slate-100 bg-slate-50 dark:ring-white/[0.06] dark:bg-white/[0.04]">
        <span class="text-base">{{ icon }}</span>
      </div>
    </div>
  </div>
</template>
