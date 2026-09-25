<script setup lang="ts">
import type { StoreBenefit } from '../storefront';
import { benefitIcon } from './benefitIcons';

defineProps<{ benefits: StoreBenefit[] }>();
</script>

<template>
  <ul class="grid grid-cols-1 gap-3" :class="benefits.length >= 3 ? 'sm:grid-cols-3' : benefits.length === 2 ? 'sm:grid-cols-2' : ''">
    <li
      v-for="benefit in benefits"
      :key="benefit.title"
      class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
        <component :is="benefitIcon(benefit.icon)" :size="20" />
      </span>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-slate-800">{{ benefit.title }}</p>
        <p v-if="benefit.text" class="text-xs text-slate-500">{{ benefit.text }}</p>
      </div>
    </li>
  </ul>
</template>
