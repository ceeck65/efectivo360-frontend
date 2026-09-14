<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-start justify-end">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div class="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock class="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Ventas Pausadas</h3>
              <p class="text-[11px] text-slate-500">{{ parkedSales.length }} venta{{ parkedSales.length !== 1 ? 's' : '' }} pendiente{{ parkedSales.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <button @click="$emit('close')" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div v-if="parkedSales.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Clock class="w-10 h-10 text-slate-200" />
          <span class="text-sm font-medium">No hay ventas pausadas</span>
        </div>

        <div v-else class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          <div v-for="sale in parkedSales" :key="sale.id"
            class="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900 truncate">
                    {{ sale.alias || sale.reference || `#TICKET-${sale.id}` }}
                  </span>
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    :class="(parkedTimers[sale.id] ?? 0) > 300
                      ? 'bg-emerald-100 text-emerald-700'
                      : (parkedTimers[sale.id] ?? 0) > 60
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'">
                    {{ formatTimer(parkedTimers[sale.id] ?? 0) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{{ sale.items.length }} ítem{{ sale.items.length !== 1 ? 's' : '' }}</span>
                  <span class="text-slate-300">·</span>
                  <span class="font-bold text-slate-700">${{ formatUSD(sale.total_usd) }}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span v-for="(item, ii) in sale.items.slice(0, 4)" :key="ii"
                    class="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded leading-tight truncate max-w-[140px]">
                    {{ item.qty }} {{ item.mode === 'BULTO' ? 'Bulto' : 'x' }} {{ item.name }}
                  </span>
                  <span v-if="sale.items.length > 4" class="text-[10px] text-slate-400 flex items-center">+{{ sale.items.length - 4 }} más</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5 shrink-0">
                <button @click="$emit('resume', sale)" :title="'Reanudar ' + (sale.alias || sale.reference)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm">
                  <PlayCircle class="w-3.5 h-3.5" />
                  Reanudar
                </button>
                <button @click="$emit('cancel', sale)" :title="'Cancelar ' + (sale.alias || sale.reference)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-bold transition-all">
                  <X class="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-slate-200 px-4 py-3">
          <button @click="$emit('close')"
            class="w-full h-10 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Clock, PlayCircle } from 'lucide-vue-next';
import type { ParkedSale } from '@/modules/inventory/services/parkedSales.service';

defineProps<{
  parkedSales: ParkedSale[];
  parkedTimers: Record<number, number>;
}>();

defineEmits<{
  resume: [sale: ParkedSale];
  cancel: [sale: ParkedSale];
  close: [];
}>();

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
</script>
