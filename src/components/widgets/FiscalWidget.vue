<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-vue-next';

interface FiscalStatus {
  cashClosing: 'up_to_date' | 'pending' | 'overdue';
  booksClosing: 'up_to_date' | 'pending' | 'overdue';
  lastCashClosing?: string;
  lastBooksClosing?: string;
}

const props = defineProps<{
  status?: FiscalStatus;
}>();

const status = props.status || {
  cashClosing: 'up_to_date',
  booksClosing: 'pending',
  lastCashClosing: '2026-04-27',
  lastBooksClosing: '2026-04-26',
};

const overallStatus = computed(() => {
  if (status.cashClosing === 'overdue' || status.booksClosing === 'overdue') {
    return 'critical';
  }
  if (status.cashClosing === 'pending' || status.booksClosing === 'pending') {
    return 'warning';
  }
  return 'ok';
});

const statusConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Atención Requerida',
  },
  warning: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Pendiente',
  },
  ok: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Al Día',
  },
};

const currentConfig = computed(() => statusConfig[overallStatus.value]);
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_50px_-18px_rgba(30,64,175,0.15)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(30,64,175,0.1),0_28px_55px_-18px_rgba(0,0,0,0.55)]">
    <!-- Top accent bar -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-corporate-blue via-corporate-blueLight to-corporate-gray" />
    <!-- Glow effect -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(30,64,175,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.07),transparent_55%)]" />
    
    <div class="relative z-[2]">
      <!-- Header -->
      <div class="mb-4 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-corporate-blue/12 text-corporate-blue ring-1 ring-corporate-blue/25 dark:bg-corporate-blue/10 dark:text-corporate-blueLight dark:ring-corporate-blue/30" aria-hidden>
          <ShieldCheck class="h-[18px] w-[18px] stroke-[1.5]" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Estado Fiscal</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Cierres de caja y libros</p>
        </div>
      </div>

      <!-- Overall Status -->
      <div :class="['mb-4 flex items-center gap-2 rounded-lg px-3 py-2', currentConfig.bgColor, currentConfig.borderColor, 'border']">
        <component :is="currentConfig.icon" :class="['h-4 w-4', currentConfig.color]" />
        <span :class="['text-xs font-semibold', currentConfig.color]">{{ currentConfig.label }}</span>
      </div>

      <!-- Status Details -->
      <div class="space-y-3">
        <!-- Cash Closing -->
        <div class="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div class="flex items-center gap-2">
            <div :class="['h-2 w-2 rounded-full', status.cashClosing === 'up_to_date' ? 'bg-emerald-500' : status.cashClosing === 'pending' ? 'bg-amber-500' : 'bg-red-500']" />
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Cierre de Caja</span>
          </div>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ status.lastCashClosing || '—' }}</span>
        </div>

        <!-- Books Closing -->
        <div class="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div class="flex items-center gap-2">
            <div :class="['h-2 w-2 rounded-full', status.booksClosing === 'up_to_date' ? 'bg-emerald-500' : status.booksClosing === 'pending' ? 'bg-amber-500' : 'bg-red-500']" />
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Libros Contables</span>
          </div>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ status.lastBooksClosing || '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
