<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        <div class="flex items-start gap-3 p-4 border-b border-slate-100">
          <div class="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0">
            <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover"
              @error="($event.target as HTMLImageElement).style.display='none'" />
            <div v-else class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-slate-900 truncate">{{ product.name }}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Selecciona una variante</p>
          </div>
          <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div class="max-h-80 overflow-y-auto p-3 space-y-2">
          <button v-for="v in variants" :key="v.id" @click="selectVariant(v)"
            class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
            :class="v.stock <= 0
              ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
              : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'"
            :disabled="v.stock <= 0">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span v-for="(attr, ai) in v.formatted_attributes" :key="ai"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <span class="text-slate-400">{{ attr.name }}:</span>
                  <span>{{ attr.value }}</span>
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-xs font-black text-slate-900">${{ formatUSD(parseFloat(v.price_base)) }}</span>
                <span class="text-[10px] font-medium text-slate-400">Bs.{{ formatVES(parseFloat(v.price_base) * tasaBCV) }}</span>
                <span class="text-[10px] text-slate-400">·</span>
                <span class="text-[10px] font-semibold"
                  :class="v.stock <= 0 ? 'text-rose-600' : v.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ Math.round(v.stock) }} uds
                </span>
              </div>
            </div>
            <div v-if="v.stock > 0" class="shrink-0 text-blue-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
            <span v-else class="shrink-0 text-[9px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-1 rounded">Agotado</span>
          </button>

          <div v-if="variants.length === 0" class="flex flex-col items-center justify-center py-8 text-slate-400">
            <p class="text-sm font-medium">No hay variantes disponibles</p>
          </div>
        </div>

        <div class="border-t border-slate-100 p-3 flex justify-end">
          <button @click="$emit('close')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useForexRate } from '@/composables/useForexRate';

interface VariantItem {
  id: string;
  sku: string;
  barcode: string;
  stock: number;
  price_base: string;
  display_name: string;
  formatted_attributes: { name: string; value: string; id: number | null }[];
  attribute_values: Record<string, string>;
}

interface ProductInfo {
  id: string;
  name: string;
  image?: string;
  sku?: string;
}

defineProps<{
  product: ProductInfo;
  variants: VariantItem[];
}>();

const { rateValue: tasaBCV } = useForexRate();

const emit = defineEmits<{
  select: [variant: VariantItem];
  close: [];
}>();

function selectVariant(v: VariantItem) {
  if (v.stock <= 0) return;
  emit('select', v);
}

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(n: number): string {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script><｜end▁of▁thinking｜>Now update `PosMainView.vue` to import and use the variant selector modal, and add variant detection + barcode search logic:

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="edit">
<｜｜DSML｜｜parameter name="filePath" string="true">/home/ceeck65/Projects/html/efectivo360-frontend/src/views/admin/staff/pos/PosMainView.vue