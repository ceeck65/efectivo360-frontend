<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X, Printer, Ban, Loader2 } from 'lucide-vue-next';
import { useSalesHistory, type SaleDetail } from '@/composables/useSalesHistory';

const props = defineProps<{
  saleId: number;
}>();

const emit = defineEmits<{
  close: [];
  void: [sale: SaleDetail];
}>();

const { fetchSaleDetail } = useSalesHistory();

const sale = ref<SaleDetail | null>(null);
const loading = ref(true);
const loadError = ref<string | null>(null);

const isVoided = computed(() => sale.value?.status === 'ANULADA');

function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(value: string | number): string {
  return Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function load() {
  loading.value = true;
  loadError.value = null;
  const detail = await fetchSaleDetail(props.saleId);
  if (detail) {
    sale.value = detail;
  } else {
    loadError.value = 'No se pudo cargar el detalle de la venta.';
  }
  loading.value = false;
}

function printTicket() {
  window.print();
}

onMounted(load);
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 print:bg-white print:p-0 print:backdrop-blur-none" @click.self="emit('close')">
    <div class="bg-white dark:bg-[#141824] w-full max-w-md rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-white/[0.08] relative z-10 flex flex-col overflow-hidden text-slate-800 dark:text-white print:shadow-none print:border-0 print:rounded-none print:max-w-full">

      <!-- Header (oculto al imprimir) -->
      <div class="p-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] flex justify-between items-center print:hidden">
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Detalle de Venta</h3>
          <p class="text-[10px] text-slate-400 font-medium">#{{ props.saleId }}</p>
        </div>
        <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors">
          <X :size="18" />
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 :size="24" class="animate-spin" />
        <span class="text-xs font-medium">Cargando ticket…</span>
      </div>

      <!-- Error -->
      <div v-else-if="loadError || !sale" class="p-10 text-center">
        <p class="text-sm text-rose-500 font-medium">{{ loadError || 'Venta no encontrada.' }}</p>
      </div>

      <!-- Cuerpo -->
      <div v-else id="sale-ticket-print" class="p-4 space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
        <!-- Encabezado de ticket -->
        <div class="text-center space-y-0.5 pb-3 border-b border-dashed border-slate-200 dark:border-white/[0.1]">
          <p class="text-xs font-black uppercase tracking-wider">{{ sale.invoice_number ? `Factura ${sale.invoice_number}` : `Ticket #${sale.id}` }}</p>
          <p class="text-[10px] text-slate-400 font-mono">{{ sale.public_hash }}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ formatDateTime(sale.sold_at) }}</p>
          <span
            class="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            :class="isVoided
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'"
          >{{ isVoided ? 'ANULADA' : 'REALIZADA' }}</span>
        </div>

        <!-- Metadatos -->
        <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div>
            <p class="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Cliente</p>
            <p class="font-semibold truncate">{{ sale.customer_name }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Cajero</p>
            <p class="font-semibold truncate">{{ sale.seller_name || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Tasa BCV</p>
            <p class="font-semibold font-mono">{{ formatVES(sale.exchange_rate) }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Items</p>
            <p class="font-semibold">{{ sale.lines.length }}</p>
          </div>
        </div>

        <!-- Líneas -->
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Productos</p>
          <div class="border border-slate-200 dark:border-white/[0.08] rounded-xl divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
            <div v-for="line in sale.lines" :key="line.id" class="p-2.5 flex justify-between gap-3 text-xs">
              <div class="min-w-0 flex-1">
                <p class="font-semibold truncate">{{ line.product_name || `Producto #${line.product}` }}</p>
                <p class="text-[10px] text-slate-400">{{ line.quantity }} {{ line.unit_label || '' }} × ${{ formatUSD(line.price_applied_usd) }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold">${{ formatUSD(Number(line.quantity) * Number(line.price_applied_usd)) }}</p>
                <p class="text-[10px] text-slate-400 font-mono">Bs. {{ formatVES(Number(line.quantity) * Number(line.price_applied_ves)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagos -->
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Método de Pago</p>
          <div v-if="sale.payments.length === 0" class="text-[11px] text-slate-400 text-center py-2">Sin pagos registrados</div>
          <div v-else class="space-y-1">
            <div v-for="p in sale.payments" :key="p.id" class="flex justify-between items-center text-xs bg-slate-50 dark:bg-white/[0.04] rounded-lg px-2.5 py-1.5">
              <span class="font-semibold">{{ p.method_name }}</span>
              <span class="font-mono text-slate-600 dark:text-slate-300">
                <template v-if="Number(p.amount_usd) > 0">${{ formatUSD(p.amount_usd) }}</template>
                <template v-if="Number(p.amount_usd) > 0 && Number(p.amount_ves) > 0"> / </template>
                <template v-if="Number(p.amount_ves) > 0">Bs. {{ formatVES(p.amount_ves) }}</template>
              </span>
            </div>
          </div>
        </div>

        <!-- Totales -->
        <div class="pt-3 border-t border-dashed border-slate-200 dark:border-white/[0.1] space-y-1">
          <div class="flex justify-between text-sm font-black">
            <span>TOTAL</span>
            <span>${{ formatUSD(sale.total_usd) }}</span>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>&nbsp;</span>
            <span>Bs. {{ formatVES(sale.total_ves) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer (oculto al imprimir) -->
      <div v-if="sale && !loading" class="p-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] flex gap-2 justify-between print:hidden">
        <button
          v-if="!isVoided"
          @click="emit('void', sale)"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10 transition-colors"
        >
          <Ban :size="14" /> Anular
        </button>
        <span v-else />
        <button
          @click="printTicket"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors"
        >
          <Printer :size="14" /> Reimprimir
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #sale-ticket-print,
  #sale-ticket-print * {
    visibility: visible;
  }
  #sale-ticket-print {
    position: fixed;
    inset: 0;
    padding: 1rem;
  }
}
</style>
