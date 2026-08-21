<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-base font-semibold text-slate-800">Personalización de Impresión</h3>
      <p class="text-xs text-slate-500 mt-0.5">Configura el formato del ticket térmico y previsualiza los cambios en vivo</p>
    </div>

    <div v-if="loading" class="text-xs text-slate-400 py-8 text-center">Cargando configuración...</div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
      <!-- Columna Izquierda: Formulario -->
      <div class="space-y-6 min-w-0">
        <!-- Formato de Papel -->
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Formato de Papel</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" @click="form.paper_width = '58mm'"
              class="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors"
              :class="form.paper_width === '58mm' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'">
              <Printer class="w-4 h-4" /> 58mm
            </button>
            <button type="button" @click="form.paper_width = '80mm'"
              class="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors"
              :class="form.paper_width === '80mm' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'">
              <Printer class="w-4 h-4" /> 80mm
            </button>
          </div>
        </div>

        <!-- Comportamiento -->
        <div class="space-y-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Comportamiento</p>
          <label class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
            <div>
              <p class="text-sm font-medium text-slate-800">Auto-imprimir al Cobrar</p>
              <p class="text-[11px] text-slate-500">Imprime el ticket automáticamente al finalizar la venta</p>
            </div>
            <button type="button"
              class="relative w-10 h-5 rounded-full transition-colors shrink-0"
              :class="form.auto_print ? 'bg-blue-500' : 'bg-slate-300'"
              @click="form.auto_print = !form.auto_print">
              <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                :class="form.auto_print ? 'translate-x-5 left-0.5' : 'left-0.5'" />
            </button>
          </label>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Número de Copias</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="n in [1, 2, 3]" :key="n" type="button" @click="form.copies_count = n"
                class="h-9 rounded-lg border text-sm font-medium transition-colors"
                :class="form.copies_count === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'">
                {{ n }}
              </button>
            </div>
          </div>
        </div>

        <!-- Encabezado y Pie -->
        <div class="space-y-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Encabezado y Pie</p>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Texto Personalizado de Encabezado</label>
            <input v-model="form.header_custom_text" type="text" placeholder="Ej: Sujeto a Fiscalización"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Mensaje al Pie del Ticket</label>
            <textarea v-model="form.footer_custom_text" rows="2" placeholder="Ej: ¡Gracias por su compra!"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
          </div>
        </div>

        <!-- Elementos Visibles -->
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Elementos Visibles en el Ticket</p>
          <div class="space-y-2">
            <label v-for="item in visibilityToggles" :key="item.key"
              class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <div class="flex items-center gap-2.5">
                <component :is="item.icon" class="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ item.label }}</p>
                  <p class="text-[11px] text-slate-500">{{ item.description }}</p>
                </div>
              </div>
              <button type="button"
                class="relative w-10 h-5 rounded-full transition-colors shrink-0"
                :class="form[item.key] ? 'bg-blue-500' : 'bg-slate-300'"
                @click="form[item.key] = !form[item.key]">
                <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  :class="form[item.key] ? 'translate-x-5 left-0.5' : 'left-0.5'" />
              </button>
            </label>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="save" :disabled="saving"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <!-- Columna Derecha: Vista Previa en Vivo -->
      <div class="xl:sticky xl:top-4 flex flex-col items-center gap-4">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start">Vista Previa en Vivo</p>

        <div id="print-settings-ticket"
          class="transition-all duration-300 ease-in-out mx-auto bg-white border border-dashed border-slate-300 rounded-md shadow-sm font-mono text-slate-800 overflow-hidden"
          :class="ticketWidthClass">
          <div class="p-3 text-[11px] leading-snug">
            <!-- Encabezado -->
            <div class="text-center space-y-0.5">
              <div v-if="form.show_logo" class="flex justify-center mb-1.5">
                <div class="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img v-if="tenantLogoUrl" :src="tenantLogoUrl" class="w-full h-full object-contain" alt="" />
                  <ImageIcon v-else class="w-5 h-5 text-slate-300" />
                </div>
              </div>
              <p class="font-bold uppercase">{{ business.name || 'Mi Negocio C.A.' }}</p>
              <p v-if="business.rif">RIF: {{ business.rif }}</p>
              <p v-if="business.address">{{ business.address }}</p>
              <p v-if="form.header_custom_text" class="pt-1 whitespace-pre-line">{{ form.header_custom_text }}</p>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2" />

            <!-- Datos del documento -->
            <div class="text-center space-y-0.5">
              <p class="font-semibold">COMPROBANTE DE VENTA</p>
              <p>N° 000-000123</p>
              <p>{{ sampleDateLabel }}</p>
              <p v-if="form.show_cashier_name">Cajero: {{ sampleCashierName }}</p>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2" />

            <!-- Items -->
            <table class="w-full">
              <thead>
                <tr class="border-b border-dashed border-slate-300">
                  <th class="text-left font-semibold pb-0.5">Cant</th>
                  <th class="text-left font-semibold pb-0.5">Descripción</th>
                  <th class="text-right font-semibold pb-0.5">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in sampleItems" :key="i">
                  <td class="align-top py-0.5">{{ item.qty }}</td>
                  <td class="align-top py-0.5">{{ item.name }}</td>
                  <td class="align-top py-0.5 text-right">${{ (item.qty * item.price).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="border-t border-dashed border-slate-300 my-2" />

            <!-- Totales -->
            <div class="space-y-0.5">
              <template v-if="form.show_tax_breakdown">
                <div class="flex justify-between"><span>Subtotal</span><span>${{ sampleSubtotal.toFixed(2) }}</span></div>
                <div class="flex justify-between"><span>IVA (16%)</span><span>${{ sampleIva.toFixed(2) }}</span></div>
              </template>
              <div class="flex justify-between font-bold pt-0.5"><span>TOTAL USD</span><span>${{ sampleTotal.toFixed(2) }}</span></div>
              <template v-if="form.show_bcv_rate">
                <div class="flex justify-between"><span>Tasa BCV</span><span>Bs. {{ sampleBcvRate.toFixed(2) }}</span></div>
                <div class="flex justify-between font-bold"><span>TOTAL Bs.</span><span>Bs. {{ sampleTotalVes.toFixed(2) }}</span></div>
              </template>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2" />

            <!-- Pie -->
            <div class="text-center space-y-1.5">
              <p class="whitespace-pre-line">{{ form.footer_custom_text || '¡Gracias por su compra!' }}</p>
              <div v-if="form.show_qr_code" class="flex justify-center pt-1">
                <div class="grid grid-cols-5 gap-[1px] p-1 bg-white border border-slate-300">
                  <span v-for="(dot, i) in qrPattern" :key="i" class="w-1.5 h-1.5" :class="dot ? 'bg-slate-800' : 'bg-white'" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="button" @click="printSample"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
          <Printer class="w-4 h-4" /> Probar Impresión de Ejemplo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { Printer, Save, Loader2, Image as ImageIcon, Receipt, Landmark, UserRound, QrCode } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { printThermalReceipt } from '@/composables/useThermalReceipt';

interface PrintSettingsForm {
  paper_width: '58mm' | '80mm';
  auto_print: boolean;
  copies_count: number;
  header_custom_text: string;
  footer_custom_text: string;
  show_logo: boolean;
  show_tax_breakdown: boolean;
  show_bcv_rate: boolean;
  show_cashier_name: boolean;
  show_qr_code: boolean;
}

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();
const business = reactive({ name: '', rif: '', address: '' });
const tenantLogoUrl = ref('');

const loading = ref(true);
const saving = ref(false);

const form = reactive<PrintSettingsForm>({
  paper_width: '80mm',
  auto_print: false,
  copies_count: 1,
  header_custom_text: '',
  footer_custom_text: '',
  show_logo: true,
  show_tax_breakdown: true,
  show_bcv_rate: true,
  show_cashier_name: true,
  show_qr_code: false,
});

type VisibilityKey = 'show_logo' | 'show_tax_breakdown' | 'show_bcv_rate' | 'show_cashier_name' | 'show_qr_code';

const visibilityToggles: { key: VisibilityKey; label: string; description: string; icon: unknown }[] = [
  { key: 'show_logo', label: 'Mostrar Logo de la Tienda', description: 'Incluye el logo comercial en el encabezado', icon: ImageIcon },
  { key: 'show_tax_breakdown', label: 'Desglose de Impuestos / IVA SENIAT', description: 'Exento, base imponible e IVA 16%', icon: Receipt },
  { key: 'show_bcv_rate', label: 'Tasa Oficial BCV y Total en Bs.', description: 'Conversión a bolívares al tipo de cambio del día', icon: Landmark },
  { key: 'show_cashier_name', label: 'Nombre del Cajero', description: 'Identifica quién atendió la venta', icon: UserRound },
  { key: 'show_qr_code', label: 'Código QR de Verificación', description: 'Código para validar el comprobante en línea', icon: QrCode },
];

onMounted(async () => {
  try {
    const [printSettings, businessInfo] = await Promise.all([
      fetchApi<Partial<PrintSettingsForm>>('/api/v1/tenant/print-settings/'),
      fetchApi<any>('/api/v1/tenants/settings/info/').catch(() => null),
    ]);
    Object.assign(form, printSettings);
    business.name = businessInfo?.commercial_name || businessInfo?.legal_name || businessInfo?.name || '';
    business.rif = businessInfo?.rif || '';
    business.address = businessInfo?.address || '';
    tenantLogoUrl.value = businessInfo?.thumb_url || businessInfo?.logo_url || '';
  } catch {
    notifyError('No se pudo cargar la configuración de impresión');
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  try {
    const data = await fetchApi<Partial<PrintSettingsForm>>('/api/v1/tenant/print-settings/', {
      method: 'PATCH',
      data: { ...form },
    });
    Object.assign(form, data);
    success('Configuración de impresión guardada');
  } catch {
    notifyError('Error al guardar la configuración de impresión');
  } finally {
    saving.value = false;
  }
}

const ticketWidthClass = computed(() => (form.paper_width === '58mm' ? 'w-[220px]' : 'w-[300px]'));

// Datos sintéticos para la vista previa y la impresión de ejemplo
const sampleDateLabel = computed(() =>
  new Date().toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
);
const sampleCashierName = 'María Pérez';
const sampleItems = [
  { qty: 2, name: 'Harina P.A.N. 1kg', price: 1.35 },
  { qty: 1, name: 'Aceite Mazeite 1L', price: 3.1 },
  { qty: 3, name: 'Refresco Cola 2L', price: 1.8 },
];
const sampleBcvRate = 46.85;
const sampleSubtotal = computed(() => sampleItems.reduce((sum, item) => sum + item.qty * item.price, 0));
const sampleIva = computed(() => sampleSubtotal.value * 0.16);
const sampleTotal = computed(() => sampleSubtotal.value + sampleIva.value);
const sampleTotalVes = computed(() => sampleTotal.value * sampleBcvRate);
const qrPattern = [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1].map(Boolean);

async function printSample() {
  await printThermalReceipt();
}
</script>

<style>
@media print {
  @page {
    margin: 0;
    size: auto;
  }
  body * {
    display: none !important;
  }
  #print-settings-ticket {
    display: block !important;
  }
  #print-settings-ticket * {
    display: revert !important;
  }
  #print-settings-ticket {
    margin: 0 auto;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
