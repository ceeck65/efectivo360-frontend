<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { CheckCircle2, Printer, MessageCircle, PlusCircle, Loader2 } from 'lucide-vue-next';
import type { SaleDetail } from '@/composables/useSalesHistory';
import { useWhatsAppReceipt } from '@/composables/useWhatsAppReceipt';
import { useBusinessInfo, usePrintSettings, printThermalReceipt } from '@/composables/useThermalReceipt';
import ThermalReceiptPrint from '@/shared/components/ThermalReceiptPrint.vue';

const business = useBusinessInfo();
const { settings: printSettings, logoUrl, fetchPrintSettings } = usePrintSettings();

const props = defineProps<{
  sale: SaleDetail;
  /** Teléfono del cliente al momento del checkout (SaleDetail no lo trae). */
  customerPhone?: string | null;
}>();

const emit = defineEmits<{
  'new-sale': [];
}>();

const { isSending, errorMessage: whatsappError, sendReceipt } = useWhatsAppReceipt();

// Configuración oficial de impresión del tenant (/admin/business/console > Impresión):
// si trae auto_print activado, se imprime sola apenas carga la configuración —
// una sola vez por venta, sin depender de que el cajero toque "Imprimir".
let autoPrinted = false;
onMounted(async () => {
  await fetchPrintSettings();
  business.logoUrl = logoUrl.value;
  if (printSettings.value.auto_print && !autoPrinted) {
    autoPrinted = true;
    printThermalReceipt();
  }
});

// Precargado del cliente registrado, pero editable: si no tiene teléfono (o el
// registrado no sirve), el cajero puede escribir uno válido antes de enviar.
const phoneInput = ref(props.customerPhone?.trim() || '');
const whatsappSent = ref(false);
watch(() => props.customerPhone, (phone) => {
  phoneInput.value = phone?.trim() || '';
});

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
function shortHash(hash: string): string {
  return hash ? hash.slice(0, 8).toUpperCase() : '—';
}

const ticketLabel = computed(() => props.sale.invoice_number || `#${shortHash(props.sale.public_hash)}`);

/** Validación laxa solo para habilitar el botón; la normalización real (y el
 * rechazo de números inválidos) la hace el backend en WhatsAppService. */
const isPhoneLikelyValid = computed(() => phoneInput.value.replace(/\D/g, '').length >= 10);

function printReceipt() {
  printThermalReceipt();
}

async function sendWhatsapp() {
  if (!isPhoneLikelyValid.value || isSending.value) return;
  whatsappSent.value = false;
  const log = await sendReceipt(props.sale.id, phoneInput.value);
  if (log?.status === 'SENT') {
    whatsappSent.value = true;
  }
}
</script>

<template>
  <!-- El comprobante térmico real se imprime aparte (ThermalReceiptPrint, vía Teleport a
       <body>); este modal es solo la vista en pantalla, por eso se oculta entero al imprimir. -->
  <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 relative z-10 flex flex-col overflow-hidden text-slate-800">

      <!-- Ícono de éxito -->
      <div class="pt-8 pb-4 flex flex-col items-center">
        <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-[success-pop_0.4s_ease-out]">
          <CheckCircle2 :size="40" class="text-emerald-600" />
        </div>
        <h3 class="mt-3 text-base font-black text-slate-800">¡Venta Exitosa!</h3>
      </div>

      <!-- Ticket -->
      <div class="px-5 pb-5 space-y-3">
        <div class="text-center space-y-0.5 pb-3 border-b border-dashed border-slate-200">
          <p class="text-xs font-black uppercase tracking-wider">{{ ticketLabel }}</p>
          <p class="text-[10px] text-slate-400 font-mono">{{ sale.public_hash }}</p>
          <p class="text-[11px] text-slate-500">{{ formatDateTime(sale.sold_at) }}</p>
        </div>

        <div class="flex justify-between text-xs">
          <span class="text-slate-400 font-medium">Cliente</span>
          <span class="font-bold text-slate-700">{{ sale.customer_name }}</span>
        </div>

        <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
          <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Pagado</p>
          <p class="text-2xl font-black text-emerald-700">${{ formatUSD(sale.total_usd) }}</p>
          <p class="text-xs font-medium text-emerald-500 font-mono">Bs. {{ formatVES(sale.total_ves) }}</p>
        </div>
      </div>

      <!-- Acciones -->
      <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <div class="space-y-1">
          <label for="whatsapp-phone" class="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            WhatsApp del cliente
          </label>
          <input
            id="whatsapp-phone"
            v-model="phoneInput"
            type="tel"
            placeholder="Ej: 0412-1234567"
            class="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button @click="printReceipt"
            class="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
            <Printer :size="15" /> Imprimir
          </button>
          <button
            @click="sendWhatsapp"
            :disabled="!isPhoneLikelyValid || isSending"
            class="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :title="isPhoneLikelyValid ? 'Enviar comprobante por WhatsApp' : 'Escribe un número de WhatsApp válido'">
            <Loader2 v-if="isSending" :size="15" class="animate-spin" />
            <MessageCircle v-else :size="15" />
            {{ isSending ? 'Enviando...' : 'WhatsApp' }}
          </button>
        </div>
        <p v-if="whatsappSent" class="text-[11px] font-semibold text-emerald-600 text-center">
          ✓ Comprobante enviado por WhatsApp
        </p>
        <p v-else-if="whatsappError" class="text-[11px] font-semibold text-red-600 text-center">
          {{ whatsappError }}
        </p>

        <button @click="emit('new-sale')"
          class="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all active:scale-[0.98]">
          <PlusCircle :size="16" /> Nueva Venta
        </button>
      </div>
    </div>
  </div>

  <ThermalReceiptPrint :sale="sale" :business="business" :print-settings="printSettings" />
</template>

<style>
@keyframes success-pop {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); }
}
</style>
