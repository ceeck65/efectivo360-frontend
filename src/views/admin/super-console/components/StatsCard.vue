<template>
  <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16]">
    <div :class="['pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95', gradientClass]" />
    <div class="relative z-[2] flex items-center justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ title }}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{{ value }}</p>
      </div>
      <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBgClass, iconTextClass, iconRingClass]">
        <component :is="iconComponent" class="h-[18px] w-[18px]" stroke-width="1.5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Building2, Boxes, Tags, Building, FileCode } from 'lucide-vue-next';

const props = defineProps<{
  title: string;
  value: number;
  icon: string;
  color: 'cyan' | 'emerald' | 'purple' | 'amber';
}>();

const iconMap: Record<string, any> = {
  Building2, Boxes, Tags, Building, FileCode
};

const iconComponent = computed(() => iconMap[props.icon] || Building2);

const colorClasses = {
  cyan: {
    gradient: 'from-cyan-500/90 via-blue-500/70 to-indigo-600/50',
    bg: 'bg-cyan-500/12',
    text: 'text-cyan-600',
    ring: 'ring-cyan-500/25',
    darkBg: 'dark:bg-cyan-500/10',
    darkText: 'dark:text-cyan-300',
    darkRing: 'dark:ring-cyan-400/30'
  },
  emerald: {
    gradient: 'from-emerald-500/90 via-green-500/70 to-teal-600/50',
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-600',
    ring: 'ring-emerald-500/25',
    darkBg: 'dark:bg-emerald-500/10',
    darkText: 'dark:text-emerald-300',
    darkRing: 'dark:ring-emerald-400/30'
  },
  purple: {
    gradient: 'from-purple-500/90 via-violet-500/70 to-indigo-600/50',
    bg: 'bg-purple-500/12',
    text: 'text-purple-600',
    ring: 'ring-purple-500/25',
    darkBg: 'dark:bg-purple-500/10',
    darkText: 'dark:text-purple-300',
    darkRing: 'dark:ring-purple-400/30'
  },
  amber: {
    gradient: 'from-amber-500/90 via-orange-500/70 to-red-600/50',
    bg: 'bg-amber-500/12',
    text: 'text-amber-600',
    ring: 'ring-amber-500/25',
    darkBg: 'dark:bg-amber-500/10',
    darkText: 'dark:text-amber-300',
    darkRing: 'dark:ring-amber-400/30'
  }
};

const colors = colorClasses[props.color];
const gradientClass = computed(() => colors.gradient);
const iconBgClass = computed(() => `${colors.bg} ${colors.darkBg}`);
const iconTextClass = computed(() => `${colors.text} ${colors.darkText}`);
const iconRingClass = computed(() => `${colors.ring} ${colors.darkRing}`);
</script>