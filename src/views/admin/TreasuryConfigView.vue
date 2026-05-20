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

interface Vault {
  code: string;
  name: string;
  vault_type: string;
  description: string;
  is_template: boolean;
  allowed_currencies: string[];
  default_currency: string;
  is_configured: boolean;
  initial_balance: number;
  currency: string;
  requires_authorization: boolean;
}

const authStore = useAuthStore();
const { fetchApi } = useApi();

const loading = ref(true);
const activeTab = ref<'payments' | 'vaults'>('payments');
const paymentMethods = ref<PaymentMethod[]>([]);
const vaults = ref<Vault[]>([]);
const isPlatform = ref(false);

// Modal de configuración
const showConfigModal = ref(false);
const configModalTitle = ref('');
const savingConfig = ref(false);
const editingPayment = ref<PaymentMethod | null>(null);
const editingVault = ref<Vault | null>(null);

// Formularios
const paymentForm = ref({
  bank: '',
  identifier: '',
  identifier_type: 'phone',
  vault_code: ''
});

const vaultForm = ref({
  name: '',
  vault_type: 'CASH',
  initial_balance: 0,
  currency: 'VES'
});

const isStaff = computed(() => authStore.user?.is_staff || false);

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

const getVaultIcon = (vault_type: string) => {
  switch (vault_type) {
    case 'CASH':
      return Banknote;
    case 'BANK':
      return Building2;
    case 'DIGITAL':
      return Smartphone;
    case 'PLATFORM':
      return Wallet;
    default:
      return Wallet;
  }
};

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

const currencyOptions = [
  { value: 'VES', label: 'Bolívar (VES)' },
  { value: 'USD', label: 'Dólar (USD)' }
];

const openPaymentConfig = (pm: PaymentMethod) => {
  editingPayment.value = pm;
  paymentForm.value = {
    bank: pm.config.bank || '',
    identifier: pm.config.identifier || '',
    identifier_type: pm.config.identifier_type || 'phone',
    vault_code: pm.config.vault_code || ''
  };
  configModalTitle.value = `Configurar ${pm.name}`;
  showConfigModal.value = true;
};

const openVaultConfig = (vault: Vault) => {
  editingVault.value = vault;
  vaultForm.value = {
    name: vault.name,
    vault_type: vault.vault_type,
    initial_balance: vault.initial_balance,
    currency: vault.currency
  };
  configModalTitle.value = `Configurar ${vault.name}`;
  showConfigModal.value = true;
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
    showConfigModal.value = false;
  } catch (e) {
    console.error('Error saving payment config:', e);
  } finally {
    savingConfig.value = false;
  }
};

const saveVaultConfig = async () => {
  if (!editingVault.value) return;
  
  savingConfig.value = true;
  try {
    await fetchApi('/api/v1/treasury/vaults/configure/', {
      method: 'POST',
      data: {
        vault_code: editingVault.value.code,
        ...vaultForm.value,
        is_active: true
      }
    });
    
    await loadData();
    showConfigModal.value = false;
  } catch (e) {
    console.error('Error saving vault config:', e);
  } finally {
    savingConfig.value = false;
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const [pmData, vaultData] = await Promise.all([
      fetchApi<{ payment_methods: PaymentMethod[]; is_platform: boolean }>('/api/v1/treasury/payment-methods/'),
      fetchApi<{ vaults: Vault[]; is_platform: boolean }>('/api/v1/treasury/vaults/')
    ]);
    
    paymentMethods.value = pmData.payment_methods || [];
    vaults.value = vaultData.vaults || [];
    isPlatform.value = pmData.is_platform;
  } catch (e) {
    console.error('Error loading treasury data:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isStaff.value) {
    loadData();
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-6 dark:bg-[#0D0F14]">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 rounded-lg bg-cyan-500/20">
          <Wallet class="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Tesorería</h1>
      </div>
      <p class="text-slate-500 dark:text-slate-400">
        {{ isPlatform ? 'Configura los métodos de pago y gaveteros de la plataforma' : 'Configura los métodos de pago y gaveteros de tu negocio' }}
      </p>
    </div>

    <!-- Access denied for non-staff -->
    <div v-if="!isStaff" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 text-center">
      <p class="text-red-600 dark:text-red-400">No tienes acceso a esta sección.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center py-20">
      <RefreshCw class="h-8 w-8 text-cyan-400 animate-spin" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Tabs -->
      <div class="flex gap-2 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          @click="activeTab = 'payments'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'payments'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          ]"
        >
          <div class="flex items-center gap-2">
            <CreditCard class="h-4 w-4" />
            Métodos de Pago
          </div>
        </button>
        <button
          @click="activeTab = 'vaults'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'vaults'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          ]"
        >
          <div class="flex items-center gap-2">
            <Wallet class="h-4 w-4" />
            Gaveteros
          </div>
        </button>
      </div>

      <!-- Payment Methods Tab -->
      <div v-if="activeTab === 'payments'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="pm in paymentMethods"
          :key="pm.code"
          class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div :class="[
                'p-2 rounded-lg',
                pm.is_configured ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
              ]">
                <component :is="getPaymentIcon(pm.code)" :class="[
                  'h-5 w-5',
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

          <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
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

      <!-- Vaults Tab -->
      <div v-if="activeTab === 'vaults'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="vault in vaults"
          :key="vault.code"
          class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div :class="[
                'p-2 rounded-lg',
                vault.is_configured ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
              ]">
                <component :is="getVaultIcon(vault.vault_type)" :class="[
                  'h-5 w-5',
                  vault.is_configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                ]" />
              </div>
              <div>
                <h3 class="font-medium text-slate-900 dark:text-white">{{ vault.name }}</h3>
                <p class="text-xs text-slate-500">{{ vault.code }}</p>
              </div>
            </div>
            <span :class="[
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              vault.is_configured 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            ]">
              {{ vault.is_configured ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            <p>{{ vault.description }}</p>
            <p class="text-xs mt-2">Moneda: {{ vault.default_currency }}</p>
          </div>

          <button
            @click="openVaultConfig(vault)"
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings class="h-4 w-4" />
            {{ vault.is_configured ? 'Editar' : 'Activar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Config Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-[#141824] rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-4 border-b border-slate-200 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ configModalTitle }}</h3>
        </div>

        <div class="p-4 space-y-4">
          <!-- Payment Method Config -->
          <template v-if="editingPayment">
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
                :placeholder="editingPayment.reference_help_text || 'Ingrese el identificador'"
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
                <option v-for="v in vaults.filter(v => v.is_configured)" :key="v.code" :value="v.code">
                  {{ v.name }}
                </option>
              </select>
            </div>
          </template>

          <!-- Vault Config -->
          <template v-if="editingVault">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre
              </label>
              <input
                v-model="vaultForm.name"
                type="text"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Vault
              </label>
              <select
                v-model="vaultForm.vault_type"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
              >
                <option value="CASH">Efectivo</option>
                <option value="BANK">Banco</option>
                <option value="DIGITAL">Billetera Digital</option>
                <option value="PLATFORM">Plataforma</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Saldo Inicial
              </label>
              <input
                v-model.number="vaultForm.initial_balance"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Moneda
              </label>
              <select
                v-model="vaultForm.currency"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.06] rounded-lg bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white"
              >
                <option v-for="opt in currencyOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </template>
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-white/[0.06] flex justify-end gap-2">
          <button
            @click="showConfigModal = false"
            class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            @click="editingPayment ? savePaymentConfig() : saveVaultConfig()"
            :disabled="savingConfig"
            class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50"
          >
            {{ savingConfig ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>