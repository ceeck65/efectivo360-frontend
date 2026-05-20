<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import {
  Wallet, Building2, Plus, Pencil, X, ArrowLeft, Loader2, Power,
} from 'lucide-vue-next';

interface CredentialField {
  key: string; label: string; type: string; required: boolean;
  placeholder?: string; options?: Array<{ label: string; value: string }>;
}
interface Template {
  slug: string; name: string; description: string; brand_color: string;
  logo_url: string; credential_schema: CredentialField[];
  num_fields: number; required_fields: number; features: string[]; source: string;
}
interface PaymentInstance {
  id: number; template: number; template_name: string; template_slug: string;
  alias: string; vault: number | null; vault_name: string | null;
  configuration_data: Record<string, any>;
  is_platform_revenue: boolean; is_active: boolean; created_at: string;
}
interface VaultOption { id: number; alias: string; vault_template_code: string; vault_type: string; is_active: boolean; }
interface Bank { id: number; name: string; business_name: string; }

const { fetchApi } = useApi();

const loading = ref(true);
const saving = ref(false);
const templates = ref<Template[]>([]);
const instances = ref<PaymentInstance[]>([]);
const vaults = ref<VaultOption[]>([]);
const banks = ref<Bank[]>([]);

const showTemplateModal = ref(false);
const showConfigModal = ref(false);
const activeTemplate = ref<Template | null>(null);
const editingInstance = ref<PaymentInstance | null>(null);
const configForm = ref<Record<string, any>>({});
const selectedVault = ref('');
const alias = ref('');

const configuredVaults = computed(() => vaults.value.filter(v => v.is_active));

const openTemplateModal = () => { showTemplateModal.value = true; };
const closeTemplateModal = () => { showTemplateModal.value = false; };

const selectTemplate = (tpl: Template) => {
  activeTemplate.value = tpl;
  showTemplateModal.value = false;
  editingInstance.value = null;
  alias.value = '';
  selectedVault.value = '';
  configForm.value = {};
  if (tpl.credential_schema) for (const f of tpl.credential_schema) configForm.value[f.key] = '';
  showConfigModal.value = true;
  loadBanks(tpl);
};

let lastBanksCountry = '';

const loadBanks = async (tpl?: Template) => {
  const tmpl = tpl || activeTemplate.value;
  if (!tmpl) return;
  const bankField = (tmpl.credential_schema || []).find((f: any) => ['bank', 'bank_code'].includes(f.key));
  if (!bankField) return;
  const countries = (bankField as any).countries || ['VE'];
  const country = countries[0];
  if (country === lastBanksCountry && banks.value.length > 0) return;
  lastBanksCountry = country;
  try {
    banks.value = (await fetchApi(`/api/v1/public/financial-entities/?country_code=${country}&is_active=true`)) as any || [];
  } catch (_) { banks.value = []; }
};

const editInstance = (inst: PaymentInstance) => {
  editingInstance.value = inst;
  const found = templates.value.find(t => t.slug === inst.template_slug);
  activeTemplate.value = found || null;
  alias.value = inst.alias || '';
  selectedVault.value = (inst as any).vault_code || '';
  configForm.value = { ...(inst.configuration_data || {}) };
  showConfigModal.value = true;
  loadBanks();
};

const closeConfigModal = () => {
  showConfigModal.value = false;
  activeTemplate.value = null;
  editingInstance.value = null;
  alias.value = '';
  selectedVault.value = '';
};

const backToTemplates = () => { showConfigModal.value = false; showTemplateModal.value = true; };

const toggleInstance = async (inst: PaymentInstance) => {
  try {
    await fetchApi(`/api/v1/treasury/payment-instances/${inst.id}/toggle/`, { method: 'POST' });
    toast.success(inst.is_active ? 'Método desactivado' : 'Método activado');
    await loadData();
  } catch (e) { toast.error('Error al cambiar estado'); }
};

const saveConfig = async () => {
  if (!activeTemplate.value) return;
  saving.value = true;
  try {
    const payload: Record<string, any> = {
      template_slug_input: activeTemplate.value.slug,
      alias: alias.value,
      configuration_data: configForm.value,
    };
    if (selectedVault.value) payload.vault_code = selectedVault.value;
    if (editingInstance.value) payload.id = editingInstance.value.id;
    await fetchApi('/api/v1/treasury/payment-instances/configure/', { method: 'POST', data: payload });
    toast.success(editingInstance.value ? 'Método actualizado' : 'Método creado exitosamente');
    closeConfigModal();
    await loadData();
  } catch (e) { toast.error('Error al guardar'); }
  finally { saving.value = false; }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [bpResp, instResp, vaultResp] = await Promise.all([
      fetchApi<{ blueprints: any[] }>('/api/v1/global-vault/payment-blueprints/'),
      fetchApi<{ instances: any[] }>('/api/v1/treasury/payment-instances/'),
      fetchApi<{ instances: any[] }>('/api/v1/treasury/vault-instances/?active=true'),
    ]);
    templates.value = (bpResp.blueprints || []).map((bp: any) => ({
      slug: bp.code,
      name: bp.name,
      description: bp.name,
      brand_color: '#3b82f6',
      logo_url: '',
      credential_schema: bp.config_schema?.fields || [],
      num_fields: bp.config_schema?.fields?.length || 0,
      required_fields: (bp.config_schema?.fields || []).filter((f: any) => f.required).length,
      features: [],
      source: 'treasury',
    }));
    instances.value = (instResp.instances || []).map((i: any) => ({
      id: i.id,
      template: i.blueprint_code || '',
      template_name: i.blueprint_name || '',
      template_slug: i.blueprint_code || '',
      alias: i.label || '',
      vault: i.vault_label || null,
      vault_name: i.vault_label || null,
      vault_code: i.vault_code || '',
      configuration_data: i.config_data || {},
      is_platform_revenue: !i.tenant_id,
      is_active: i.is_enabled !== undefined ? i.is_enabled : true,
      created_at: i.created_at || '',
    }));
    vaults.value = (vaultResp.instances || []).map((i: any) => ({
      id: i.id,
      alias: i.label || i.alias || '',
      vault_template_code: i.blueprint_code || '',
      vault_type: i.vault_type || '',
      is_active: i.is_active !== undefined ? i.is_active : true,
    }));
    instances.value = (instResp.instances || []).map((i: any) => ({
      id: i.id,
      template: i.blueprint_code || '',
      template_name: i.blueprint_name || '',
      template_slug: i.blueprint_code || '',
      alias: i.label || '',
      vault: i.vault_label || null,
      vault_name: i.vault_label || null,
      vault_code: i.vault_code || '',
      configuration_data: i.config_data || {},
      is_platform_revenue: !i.tenant_id,
      is_active: i.is_enabled !== undefined ? i.is_enabled : true,
      created_at: i.created_at || '',
    }));
    vaults.value = (vaultResp.instances || []).map((i: any) => ({
      id: i.id,
      alias: i.label || i.alias || '',
      vault_template_code: i.blueprint_code || '',
      vault_type: i.vault_type || '',
      is_active: i.is_active !== undefined ? i.is_active : true,
    }));
  } catch (e) { toast.error('Error al cargar datos'); }
  finally { loading.value = false; }
};

onMounted(() => { loadData(); });
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-center py-12">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-slate-400" />
      <p class="mt-3 text-sm text-slate-400">Cargando métodos de pago...</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Métodos de Pago Configurados</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ instances.length }} método(s)</p>
        </div>
        <button @click="openTemplateModal" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
          <Plus class="h-4 w-4" /> Agregar Método de Pago
        </button>
      </div>

      <div v-if="instances.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="inst in instances" :key="inst.id" class="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04]"><Wallet class="h-5 w-5 text-slate-600 dark:text-cyan-500" /></div>
              <div>
                <h4 class="font-semibold text-slate-900 dark:text-white">{{ inst.alias || inst.template_name }}</h4>
                <p class="text-xs text-slate-500">{{ inst.template_name }}</p>
              </div>
            </div>
            <button @click="toggleInstance(inst)" :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors', inst.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400']">
              <Power class="h-3 w-3 mr-1" /> {{ inst.is_active ? 'Activo' : 'Inactivo' }}
            </button>
          </div>
          <div v-if="inst.vault_name" class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <Building2 class="h-3.5 w-3.5" /> <span>{{ inst.vault_name }}</span>
          </div>
          <button @click="editInstance(inst)" class="w-full inline-flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors">
            <Pencil class="h-4 w-4" /> Editar
          </button>
        </div>
      </div>

      <div v-else class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
        <Wallet class="mx-auto h-10 w-10 text-slate-400 mb-4" />
        <h4 class="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">No hay métodos de pago configurados</h4>
        <p class="text-sm text-slate-500 max-w-md mx-auto mb-6">Agrega métodos como Pago Móvil, Zelle o Transferencia.</p>
        <button @click="openTemplateModal" class="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
          <Plus class="h-4 w-4" /> Agregar Primer Método
        </button>
      </div>
    </template>

    <!-- MODAL: Templates -->
    <div v-if="showTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
          <div><h2 class="text-xl font-semibold text-slate-900 dark:text-white">Seleccionar Método de Pago</h2><p class="text-sm text-slate-500 dark:text-slate-400">Catálogo de Blueprints</p></div>
          <button @click="closeTemplateModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300"><X class="h-5 w-5" /></button>
        </div>
        <div class="p-6">
          <div v-if="templates.length === 0" class="text-center py-8"><p class="text-slate-500">No hay plantillas disponibles.</p></div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button v-for="tpl in templates" :key="tpl.slug" @click="selectTemplate(tpl)" class="text-left group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:hover:border-cyan-500/30 dark:hover:bg-[#1a2235]">
              <div class="p-2 rounded-lg bg-slate-100 shrink-0 dark:bg-white/[0.04]"><Wallet class="h-5 w-5 text-slate-600 dark:text-cyan-500" /></div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2"><h4 class="font-medium text-slate-900 dark:text-white">{{ tpl.name }}</h4><span class="text-xs text-slate-400">{{ tpl.slug }}</span></div>
                <div class="flex flex-wrap gap-1 mt-2"><span v-for="f in tpl.features" :key="f" class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-cyan-500/10 dark:text-cyan-400">{{ f }}</span></div>
                <div v-if="tpl.credential_schema.length" class="mt-2 text-[10px] text-slate-400">{{ tpl.required_fields }} campos: {{ tpl.credential_schema.filter(f => f.required).map(f => f.label).join(', ') }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Config -->
    <div v-if="showConfigModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
          <button @click="backToTemplates" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300 shrink-0"><ArrowLeft class="h-5 w-5" /></button>
          <div class="min-w-0 flex-1"><h2 class="text-lg font-semibold text-slate-900 dark:text-white truncate">{{ editingInstance ? 'Editar' : 'Configurar' }} {{ activeTemplate?.name }}</h2></div>
          <button @click="closeConfigModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-white/[0.06] dark:hover:text-slate-300 shrink-0"><X class="h-5 w-5" /></button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alias <span class="text-red-500">*</span></label>
            <input v-model="alias" type="text" placeholder="Ej: Pago Móvil Mio" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gavetero Destino <span class="text-red-500">*</span></label>
            <select v-model="selectedVault" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors">
              <option value="">Seleccionar gavetero...</option>
              <option v-for="v in configuredVaults" :key="v.id" :value="v.vault_template_code">{{ v.alias || v.vault_template_code }}</option>
            </select>
          </div>
          <template v-if="activeTemplate?.credential_schema?.length">
            <div class="border-t border-slate-200 pt-4 dark:border-white/[0.06]"><p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Datos del método</p></div>
            <div v-for="field in activeTemplate.credential_schema" :key="field.key" class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ field.label }} <span v-if="field.required" class="text-red-500">*</span></label>

              <!-- Bank - from API -->
              <select v-if="['bank', 'bank_code'].includes(field.key)" v-model="configForm[field.key]" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors">
                <option value="">Seleccionar banco...</option>
                <option v-for="b in banks" :key="b.id" :value="b.name">{{ b.name }} - {{ b.business_name }}</option>
              </select>
              <!-- Generic select -->
              <select v-else-if="field.type === 'select'" v-model="configForm[field.key]" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors">
                <option value="">Seleccionar...</option>
                <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <!-- Text/email -->
              <input v-else :type="field.type === 'email' ? 'email' : 'text'" v-model="configForm[field.key]" :placeholder="field.placeholder || ''" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white transition-colors" />
            </div>
          </template>
        </div>
        <div class="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3 dark:border-white/[0.06] dark:bg-[#141824]">
          <button @click="closeConfigModal" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors">Cancelar</button>
          <button @click="saveConfig" :disabled="saving" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" /><span v-else>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
