<script setup lang="ts">
import { onMounted } from 'vue';
import { CalendarCheck2, Printer, PlusCircle } from 'lucide-vue-next';
import type { LayawayDetail } from '@/composables/useLayaway';
import { useBusinessInfo, usePrintSettings, printThermalReceipt } from '@/composables/useThermalReceipt';
import LayawayReceiptPrint from '@/shared/components/LayawayReceiptPrint.vue';

const business = useBusinessInfo();
const { settings: printSettings, logoUrl, fetchPrintSettings } = usePrintSettings();

defineProps<{
  layaway: LayawayDetail;
}>();

const emit = defineEmits<{
  'new-sale': [];
}>();

let autoPrinted = false;
onMounted(async () => {
  await fetchPrintSettings();
  business.logoUrl = logoUrl.value;
  if (printSettings.value.auto_print && !autoPrinted) {
    autoPrinted = true;
    printThermalReceipt();
  }
});

function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function printReceipt() {
  printThermalReceipt();
}
</script>

<template>
  <!-- El comprobante térmico real se imprime aparte (LayawayReceiptPrint, vía Teleport a
       <body>); este modal es solo la vista en pantalla, por eso se oculta entero al imprimir. -->
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 relative z-10 flex flex-col overflow-hidden text-slate-800">

      <div class="pt-8 pb-4 flex flex-col items-center">
        <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <CalendarCheck2 :size="40" class="text-blue-600" />
        </div>
        <h3 class="mt-3 text-base font-black text-slate-800">¡Apartado Registrado!</h3>
        <p class="text-[11px] text-slate-400">{{ layaway.reference }}</p>
      </div>

      <div class="px-5 pb-5 space-y-3">
        <div class="flex justify-between text-xs">
          <span class="text-slate-400 font-medium">Cliente</span>
          <span class="font-bold text-slate-700">{{ layaway.customer_name }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-center">
            <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Abono Inicial</p>
            <p class="text-lg font-black text-slate-700">${{ formatUSD(layaway.initial_deposit_usd) }}</p>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center">
            <p class="text-[9px] font-bold uppercase tracking-wider text-amber-600">Saldo Pendiente</p>
            <p class="text-lg font-black text-amber-700">${{ formatUSD(layaway.balance_usd) }}</p>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
          <p class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Fecha Límite de Retiro</p>
          <p class="text-xl font-black text-blue-700">{{ formatDate(layaway.expiration_date) }}</p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <button @click="printReceipt"
          class="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
          <Printer :size="15" /> Imprimir Compromiso de Reserva
        </button>

        <button @click="emit('new-sale')"
          class="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all active:scale-[0.98]">
          <PlusCircle :size="16" /> Nueva Venta
        </button>
      </div>
    </div>
  </div>

  <LayawayReceiptPrint :layaway="layaway" :business="business" :print-settings="printSettings" />
</template>
