<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        <div class="p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Clock class="w-5 h-5 text-rose-600" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-slate-900">Reserva Expirada</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">
                {{ sale.alias || sale.reference || `#TICKET-${sale.id}` }}
              </p>
            </div>
            <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
              <X class="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div class="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5">
            <div v-for="(item, ii) in sale.items.slice(0, 5)" :key="ii"
              class="flex items-center justify-between text-xs">
              <span class="text-slate-600 truncate max-w-[220px]">
                {{ item.qty }} {{ item.mode === 'BULTO' ? 'Bulto' : 'x' }} {{ item.name }}
              </span>
              <span class="font-semibold text-slate-800 shrink-0 ml-2">${{ formatUSD(item.unitPrice * item.qty) }}</span>
            </div>
            <div v-if="sale.items.length > 5" class="text-[10px] text-slate-400">
              +{{ sale.items.length - 5 }} ítems más
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
              <span class="text-xs font-bold text-slate-700">Total</span>
              <span class="text-sm font-black text-slate-900">${{ formatUSD(sale.total_usd) }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-600 mb-5 leading-relaxed">
            El tiempo de reserva de 20 minutos ha finalizado.
            ¿Deseas <span class="font-semibold">extender</span> la reserva
            o <span class="font-semibold">liberar</span> los productos al inventario?
          </p>

          <div class="flex flex-col gap-2">
            <button @click="$emit('extend', sale)"
              class="w-full h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Clock class="w-4 h-4" />
              Extender +20 min
            </button>
            <button @click="$emit('cancel', sale)"
              class="w-full h-11 rounded-xl text-sm font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <X class="w-4 h-4" />
              Cancelar y Liberar Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Clock } from 'lucide-vue-next';
import type { ParkedSale } from '@/modules/inventory/services/parkedSales.service';

defineProps<{
  sale: ParkedSale;
}>();

defineEmits<{
  extend: [sale: ParkedSale];
  cancel: [sale: ParkedSale];
  close: [];
}>();

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
