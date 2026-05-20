<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { 
   Wallet,
   CreditCard, 
   Building2, 
   RefreshCw,
   Settings,
   Banknote,
   Smartphone,
   Mail
} from 'lucide-vue-next';

interface PaymentMethod {
  code: string;
  name: string;
  icon_url: string;
  reference_type: string;
  reference_required: boolean;
  reference_help_text: string;
  allowed_currencies: string[];
  countries: string[];
  is_active: boolean;
  is_configured: boolean;
  config: Record<string, any>;
}

const authStore = useAuthStore();
const { fetchApi } = useApi();

const loading = ref(true);
const paymentMethods = ref<PaymentMethod[]>([]);
const isPlatform = ref(false);

const bankOptions = [
   { value: 'BDV', label: 'BDV' },
   { value: 'Mercantil', label: 'Mercantil' },
   { value: 'Banesco', label: 'Banesco' },
   { value: 'Provincial', label: 'Provincial' },
   { value: 'Venezuela', label: 'Venezuela' },
   { value: 'Banplus', label: 'Banplus' },
   { value: 'Otro', label: 'Otro' }
];

const identifierTypeOptions = [
   { value: 'phone', label: 'Teléfono' },
   { value: 'identity', label: 'Cédula/RIF' },
   { value: 'email', label: 'Correo Zelle' }
];

// currencyOptions removed as it's not currently used in this component
// const currencyOptions = [
//   { value: 'VES', label: 'Bolívar (VES)' },
//   { value: 'USD', label: 'Dólar (USD)' }
// ];

const isStaff = computed(() => authStore.user?.is_staff || false);
const isAuthenticated = computed(() => !!authStore.user);

const getPaymentIcon = (code: string) => {
  switch (code) {
    case 'cash':
      return Banknote;
    case 'pagomovil':
      return Smartphone;
    case 'zelle':
      return Mail;
    case 'bank_transfer':
      return Building2;
    default:
      return CreditCard;
  }
};

const openConfigModal = ref(false);
const savingConfig = ref(false);
const editingPayment = ref<PaymentMethod | null>(null);
const paymentForm = ref({
  bank: '',
  identifier: '',
  identifier_type: 'phone',
  vault_code: ''
});
const configModalTitle = ref('');

const openPaymentConfig = (pm: PaymentMethod) => {
  editingPayment.value = pm;
  paymentForm.value = {
    bank: pm.config.bank || '',
    identifier: pm.config.identifier || '',
    identifier_type: pm.config.identifier_type || 'phone',
    vault_code: pm.config.vault_code || ''
  };
  configModalTitle.value = `Configurar ${pm.name}`;
  openConfigModal.value = true;
};

const savePaymentConfig = async () => {
  if (!editingPayment.value) return;
  
  savingConfig.value = true;
  try {
    await fetchApi('/api/v1/treasury/payment-methods/configure/', {
      method: 'POST',
      data: {
        payment_code: editingPayment.value.code,
        config: paymentForm.value,
        is_enabled: true
      }
    });
    
    await loadData();
    openConfigModal.value = false;
  } catch (e) {
    console.error('Error saving payment config:', e);
  } finally {
    savingConfig.value = false;
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const data = await fetchApi<{ payment_methods: PaymentMethod[]; is_platform: boolean }>('/api/v1/treasury/payment-methods/');
    
    paymentMethods.value = data.payment_methods || [];
    isPlatform.value = data.is_platform;
  } catch (e) {
    console.error('Error loading payment methods:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
   if (isStaff.value || isAuthenticated.value) {
     loadData();
   }
 });
</script>

<template>
  <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-6 shadow-sm">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-cyan-500/20">
          <Wallet class="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Métodos de Pago</h2>
      </div>
      <button
        @click="loadData"
        :disabled="loading"
        class="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:hover:bg-[#1a1f2e] rounded-lg"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Recargar
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500 dark:text-slate-400">
      <RefreshCw class="mx-auto h-5 w-5 animate-spin mb-2" /> Cargando...
    </div>

    <div v-else class="space-y-4">
      <div v-if="paymentMethods.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
        No se encontraron métodos de pago disponibles
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="pm in paymentMethods"
          :key="pm.code"
          class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div :class="[
                'p-2 rounded-lg',
                pm.is_configured ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
              ]">
                <component :is="getPaymentIcon(pm.code)" :class="[
                  'h-4 w-4',
                  pm.is_configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                ]" />
              </div>
              <div>
                <h3 class="font-medium text-slate-900 dark:text-white">{{ pm.name }}</h3>
                <p class="text-xs text-slate-500">{{ pm.code }}</p>
              </div>
            </div>
            <span :class="[
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              pm.is_configured 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            ]">
              {{ pm.is_configured ? 'Configurado' : 'Pendiente' }}
            </span>
          </div>

          <div class="text-sm text-slate-500 dark:text-slate-400 mb-3">
            <p v-if="pm.reference_type !== 'NONE'">
              Referencia: {{ pm.reference_type }}
              <span v-if="pm.reference_required" class="text-red-500">*</span>
            </p>
            <p v-if="pm.reference_help_text" class="text-xs mt-1">{{ pm.reference_help_text }}</p>
          </div>

          <button
            @click="openPaymentConfig(pm)"
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings class="h-4 w-4" />
            {{ pm.is_configured ? 'Editar' : 'Configurar' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Config Modal -->
  <div v-if="openConfigModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white dark:bg-[#141824] rounded-xl shadow-xl w-full max-w-md mx-4">
      <div class="p-4 border-b border-slate-200 dark:border-white/[0.06]">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ configModalTitle }}</h3>
      </div>

      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Banco
          </label>
          <select
            v-model="paymentForm.bank"
            class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
          >
            <option value="">Seleccionar banco...</option>
            <option v-for="opt in bankOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tipo de Identificador
          </label>
          <select
            v-model="paymentForm.identifier_type"
            class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
          >
            <option v-for="opt in identifierTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Identificador
          </label>
          <input
            v-model="paymentForm.identifier"
            type="text"
            class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
            :placeholder="editingPayment?.reference_help_text || 'Ingrese el identificador'"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Gavetero Destino
          </label>
          <select
            v-model="paymentForm.vault_code"
            class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
          >
            <option value="">Seleccionar gavetero...</option>
            <option v-for="v in paymentMethods.filter(v => v.is_configured)" :key="v.code" :value="v.code">
              {{ v.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="p-4 border-t border-slate-200 dark:border-white/[0.06] flex justify-end gap-2">
        <button
          @click="openConfigModal = false"
          class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-300 rounded-lg"
        >
          Cancelar
        </button>
        <button
          @click="savePaymentConfig()"
          :disabled="savingConfig"
          class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50"
        >
          {{ savingConfig ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>