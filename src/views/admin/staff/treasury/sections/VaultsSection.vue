<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { getCurrencyStep } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import {
  Wallet, Building2, Banknote, Smartphone, Shield, Plus,
  Pencil, X, Loader2, ArrowLeft, CreditCard, Key, Power,
} from 'lucide-vue-next';

interface VaultTemplate {
  code: string; name: string; vault_type: string; description: string;
  default_currency: string; is_template: boolean;
}

interface VaultInstance {
  id: number; alias: string; vault_template_code: string;
  vault_type: string; vault_name: string | null;
  initial_balance: number; currency: string;
  is_platform_vault: boolean; is_active: boolean;
  current_balance: number; label: string; blueprint_code: string;
  currency_code: string;
}

const VAULT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo', BANK: 'Banco', DIGITAL: 'Billetera Digital',
  PLATFORM: 'Plataforma', SAFE: 'Caja Fuerte', TERMINAL: 'Terminal de Pago',
  MOBILE: 'Caja Móvil', PETTY: 'Caja Chica', CRYPTO: 'Bóveda Cripto', CUSTOM: 'Personalizado',
};
const VAULT_ICONS: Record<string, any> = {
  CASH: Banknote, BANK: Building2, DIGITAL: Smartphone, PLATFORM: Shield,
  SAFE: Shield, TERMINAL: CreditCard, MOBILE: Smartphone, PETTY: Wallet, CRYPTO: Key, CUSTOM: Wallet,
};
const getIcon = (type: string) => VAULT_ICONS[type] || Wallet;

const authStore = useAuthStore();
const { fetchApi } = useApi();

const loading = ref(true);
const saving = ref(false);
const templates = ref<VaultTemplate[]>([]);
const instances = ref<VaultInstance[]>([]);

const showTemplateModal = ref(false);
const showConfigModal = ref(false);
const editingInstance = ref<VaultInstance | null>(null);
const activeTemplate = ref<VaultTemplate | null>(null);
const vaultForm = ref({ alias: '', vault_type: 'CASH', initial_balance: 0, currency: 'VES' });

const currencyOptions = [
  { value: 'VES', label: 'Bolívar (VES)' },
  { value: 'USD', label: 'Dólar (USD)' },
];
const isAuthenticated = computed(() => !!authStore.user);

const openTemplateModal = () => { showTemplateModal.value = true; };
const closeTemplateModal = () => { showTemplateModal.value = false; };

const selectTemplate = (vault: VaultTemplate) => {
  activeTemplate.value = vault;
  showTemplateModal.value = false;
  editingInstance.value = null;
  vaultForm.value = { alias: '', vault_type: vault.vault_type, initial_balance: 0, currency: vault.default_currency };
  showConfigModal.value = true;
};

const editInstance = (inst: VaultInstance) => {
  const tpl = templates.value.find(t => t.code === inst.vault_template_code);
  activeTemplate.value = tpl || null;
  editingInstance.value = inst;
  vaultForm.value = { alias: inst.alias, vault_type: inst.vault_type, initial_balance: inst.initial_balance, currency: inst.currency };
  showConfigModal.value = true;
};

const closeConfigModal = () => {
  showConfigModal.value = false;
  activeTemplate.value = null;
  editingInstance.value = null;
};

const backToTemplates = () => {
  showConfigModal.value = false;
  showTemplateModal.value = true;
};

const toggleInstance = async (inst: VaultInstance) => {
  try {
    await fetchApi(`/api/v1/treasury/vault-instances/${inst.id}/toggle/`, { method: 'POST' });
    toast.success(inst.is_active ? 'Gavetero desactivado' : 'Gavetero activado');
    await loadData();
  } catch (e) {
    toast.error('Error al cambiar el estado');
    console.error('Error toggling:', e);
  }
};

const saveConfig = async () => {
  if (!activeTemplate.value) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      vault_template_code: activeTemplate.value.code,
      alias: vaultForm.value.alias,
      vault_type: vaultForm.value.vault_type,
      initial_balance: vaultForm.value.initial_balance,
      currency: vaultForm.value.currency,
    };
    if (editingInstance.value) payload.id = editingInstance.value.id;
    await fetchApi('/api/v1/treasury/vault-instances/configure/', { method: 'POST', data: payload });
    toast.success(editingInstance.value ? 'Gavetero actualizado' : 'Gavetero creado exitosamente');
    closeConfigModal();
    await loadData();
  } catch (e) {
    toast.error('Error al guardar el gavetero');
    console.error('Error saving:', e);
  }
  finally { saving.value = false; }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [tplResp, instResp] = await Promise.all([
      fetchApi<{ vaults: VaultTemplate[] }>('/api/v1/treasury/vaults/'),
      fetchApi<{ instances: VaultInstance[] }>('/api/v1/treasury/vault-instances/'),
    ]);
    templates.value = (tplResp.vaults || []).map((vt: any) => ({
      code: vt.code,
      name: vt.name,
      vault_type: vt.vault_type,
      description: vt.financial_rules?.description || vt.name,
      default_currency: (vt.financial_rules?.allowed_currencies || ['USD'])[0],
      is_template: true,
    }));
    instances.value = (instResp.instances || []).map((i: any) => ({
      id: i.id,
      alias: i.label || i.alias || '',
      vault_template_code: i.blueprint_code || '',
      vault_type: i.vault_type || '',
      vault_name: i.blueprint_name || null,
      initial_balance: i.current_balance || 0,
      currency: i.currency_code || 'USD',
      is_platform_vault: !i.tenant_id,
      is_active: i.is_active !== undefined ? i.is_active : true,
      current_balance: i.current_balance || 0,
      label: i.label || '',
      blueprint_code: i.blueprint_code || '',
      currency_code: i.currency_code || 'USD',
    }));
  } catch (e) {
    toast.error('Error al cargar los datos');
    console.error('Error loading:', e);
  }
  finally { loading.value = false; }
};

onMounted(() => { if (isAuthenticated.value) loadData(); });
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-center py-12">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-slate-400" />
      <p class="mt-3 text-sm text-slate-400">Cargando gaveteros...</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Gaveteros Configurados</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ instances.length }} gavetero(s)</p>
        </div>
        <button @click="openTemplateModal"
          class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
          <Plus class="h-4 w-4" /> Agregar Gavetero
        </button>
      </div>

      <div v-if="instances.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="inst in instances" :key="inst.id"
          class="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04]">
                <component :is="getIcon(inst.vault_type)" class="h-5 w-5 text-slate-600 dark:text-cyan-500" />
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 dark:text-white">{{ inst.alias || inst.vault_template_code }}</h4>
                <p class="text-xs text-slate-500">{{ VAULT_TYPE_LABELS[inst.vault_type] || inst.vault_type }}</p>
              </div>
            </div>
            <button @click="toggleInstance(inst)"
              :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                inst.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                               : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400']">
              <Power class="h-3 w-3 mr-1" /> {{ inst.is_active ? 'Activo' : 'Inactivo' }}
            </button>
          </div>
          <div class="space-y-1 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <p>Moneda: {{ inst.currency === 'VES' ? 'Bolívar' : 'Dólar' }} ({{ inst.currency }})</p>
            <p v-if="inst.initial_balance > 0">Saldo inicial: {{ inst.initial_balance }}</p>
          </div>
          <button @click="editInstance(inst)"
            class="w-full inline-flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors">
            <Pencil class="h-4 w-4" /> Editar
          </button>
        </div>
      </div>

      <div v-else class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
        <Wallet class="mx-auto h-10 w-10 text-slate-400 mb-4" />
        <h4 class="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">No hay gaveteros configurados</h4>
        <p class="text-sm text-slate-500 max-w-md mx-auto mb-6">Crea gaveteros desde las plantillas del Blueprint.</p>
        <button @click="openTemplateModal"
          class="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
          <Plus class="h-4 w-4" /> Agregar Primer Gavetero
        </button>
      </div>
    </template>

    <!-- MODAL: Template Selection -->
    <div v-if="showTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
          <div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Seleccionar Gavetero</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">Elige una plantilla de Bóveda del Blueprint</p>
          </div>
          <button @click="closeTemplateModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300">
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="p-6">
          <div v-if="templates.length === 0" class="text-center py-8"><p class="text-slate-500">No hay plantillas disponibles.</p></div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button v-for="vt in templates" :key="vt.code" @click="selectTemplate(vt)"
              class="text-left group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:hover:border-cyan-500/30 dark:hover:bg-[#1a2235]">
              <div class="p-2 rounded-lg bg-slate-100 shrink-0 dark:bg-white/[0.04]">
                <component :is="getIcon(vt.vault_type)" class="h-5 w-5 text-slate-600 dark:text-cyan-500" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-slate-900 dark:text-white">{{ vt.name }}</h4>
                  <span class="text-xs text-slate-400">{{ vt.code }}</span>
                </div>
                <p v-if="vt.description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{{ vt.description }}</p>
                <span class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-cyan-500/10 dark:text-cyan-400 mt-1.5">
                  {{ VAULT_TYPE_LABELS[vt.vault_type] || vt.vault_type }} · {{ vt.default_currency }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Configuration Form -->
    <div v-if="showConfigModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
          <button @click="backToTemplates" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300 shrink-0">
            <ArrowLeft class="h-5 w-5" />
          </button>
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] shrink-0">
              <component :is="getIcon(activeTemplate?.vault_type || '')" class="h-5 w-5 text-slate-600 dark:text-cyan-500" />
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {{ editingInstance ? 'Editar' : 'Nuevo' }} {{ activeTemplate?.name }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ activeTemplate?.code }}</p>
            </div>
          </div>
          <button @click="closeConfigModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300 shrink-0">
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alias <span class="text-red-500">*</span></label>
            <input v-model="vaultForm.alias" type="text" placeholder="Ej: Caja Principal Divisas"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Gavetero</label>
            <select v-model="vaultForm.vault_type"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors">
              <option v-for="(label, code) in VAULT_TYPE_LABELS" :key="code" :value="code">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Saldo Inicial</label>
            <input v-model.number="vaultForm.initial_balance" type="number" :step="getCurrencyStep(vaultForm.currency || 'USD')" min="0"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Moneda</label>
            <select v-model="vaultForm.currency"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors">
              <option v-for="opt in currencyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div class="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3 dark:border-white/[0.06] dark:bg-[#141824]">
          <button @click="closeConfigModal"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors">
            Cancelar
          </button>
          <button @click="saveConfig" :disabled="saving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            <span v-else>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
