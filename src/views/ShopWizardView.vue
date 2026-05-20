<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGeographyStore } from '@/stores/geography';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { fetchApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import {
  Store, MapPin, Dna, Wallet, Zap, ArrowRight, ArrowLeft, Check, X, Plus,
  Camera, Building2, FileBadge, Phone, MapPinned, Globe, Landmark, CreditCard,
  Sparkles, Banknote, Loader2,
} from 'lucide-vue-next';
import LucideIcon from '@/components/lucide/LucideIcon.vue';

const router = useRouter();
const geography = useGeographyStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const logoInput = ref<HTMLInputElement | null>(null);

const step = ref(1);
const totalSteps = 5;
const submitting = ref(false);
const loadingNext = ref(false);
const showLoader = ref(false);

const biz = ref({ legalName: '', rifType: 'J', rifNumber: '', phoneCountry: 'VE', phoneNumber: '', address: '', logo: null as File | null, logoPreview: '' as string });
const rifClean = computed(() => {
  const n = biz.value.rifNumber.replace(/[.\-]/g, '');
  return biz.value.rifType + n;
});
const rifRegex = /^[VJEG]\d{7,9}$/;

const phoneConfig: Record<string, { prefix: string, mask: string | null, len: number, label: string, flag: string }> = {
  VE: { prefix: '+58', mask: '(####) ###-####', len: 11, label: 'Venezuela', flag: '🇻🇪' },
  CO: { prefix: '+57', mask: '### ### ####', len: 10, label: 'Colombia', flag: '🇨🇴' },
  PE: { prefix: '+51', mask: '### ### ###', len: 9, label: 'Perú', flag: '🇵🇪' },
  CL: { prefix: '+56', mask: '# #### ####', len: 9, label: 'Chile', flag: '🇨🇱' },
  US: { prefix: '+1', mask: '(###) ###-####', len: 10, label: 'EE.UU./Canadá', flag: '🇺🇸' },
  OT: { prefix: '+XX', mask: null, len: 0, label: 'Otro', flag: '🌐' },
};
const veCodes = [
  { codigo: '0412', tipo: 'móvil', empresa: 'Digitel' },
  { codigo: '0422', tipo: 'móvil', empresa: 'Digitel (Expansión)' },
  { codigo: '0414', tipo: 'móvil', empresa: 'Movistar' },
  { codigo: '0424', tipo: 'móvil', empresa: 'Movistar (Expansión)' },
  { codigo: '0416', tipo: 'móvil', empresa: 'Movilnet' },
  { codigo: '0426', tipo: 'móvil', empresa: 'Movilnet (Expansión)' },
  { codigo: '0212', tipo: 'fijo', estado: 'Distrito Capital, Miranda, La Guaira' },
  { codigo: '0241', tipo: 'fijo', estado: 'Carabobo (Valencia)' },
  { codigo: '0242', tipo: 'fijo', estado: 'Carabobo (Puerto Cabello)' },
  { codigo: '0245', tipo: 'fijo', estado: 'Carabobo (Guacara / San Diego)' },
  { codigo: '0243', tipo: 'fijo', estado: 'Aragua (Maracay)' },
  { codigo: '0244', tipo: 'fijo', estado: 'Aragua (Zonas Internas)' },
  { codigo: '0246', tipo: 'fijo', estado: 'Guárico' },
  { codigo: '0248', tipo: 'fijo', estado: 'Amazonas' },
  { codigo: '0251', tipo: 'fijo', estado: 'Lara (Barquisimeto)' },
  { codigo: '0252', tipo: 'fijo', estado: 'Lara (Carora)' },
  { codigo: '0253', tipo: 'fijo', estado: 'Lara (El Tocuyo)' },
  { codigo: '0254', tipo: 'fijo', estado: 'Yaracuy' },
  { codigo: '0258', tipo: 'fijo', estado: 'Cojedes' },
  { codigo: '0259', tipo: 'fijo', estado: 'Falcón' },
  { codigo: '0261', tipo: 'fijo', estado: 'Zulia (Maracaibo)' },
  { codigo: '0262', tipo: 'fijo', estado: 'Zulia (Zonas Internas)' },
  { codigo: '0263', tipo: 'fijo', estado: 'Zulia (Costa Oriental - Norte)' },
  { codigo: '0264', tipo: 'fijo', estado: 'Zulia (Costa Oriental - Sur)' },
  { codigo: '0265', tipo: 'fijo', estado: 'Zulia (Cabimas / Lagunillas)' },
  { codigo: '0266', tipo: 'fijo', estado: 'Zulia (Zonas Occidentales)' },
  { codigo: '0267', tipo: 'fijo', estado: 'Zulia (Zonas Sur)' },
  { codigo: '0271', tipo: 'fijo', estado: 'Trujillo' },
  { codigo: '0273', tipo: 'fijo', estado: 'Barinas' },
  { codigo: '0274', tipo: 'fijo', estado: 'Mérida' },
  { codigo: '0275', tipo: 'fijo', estado: 'Zulia (Sur del Lago)' },
  { codigo: '0276', tipo: 'fijo', estado: 'Táchira (San Cristóbal)' },
  { codigo: '0277', tipo: 'fijo', estado: 'Táchira (Zonas Internas)' },
  { codigo: '0278', tipo: 'fijo', estado: 'Apure' },
  { codigo: '0279', tipo: 'fijo', estado: 'Portuguesa' },
  { codigo: '0281', tipo: 'fijo', estado: 'Anzoátegui (Barcelona / Puerto La Cruz)' },
  { codigo: '0282', tipo: 'fijo', estado: 'Anzoátegui (Zonas Centrales)' },
  { codigo: '0283', tipo: 'fijo', estado: 'Anzoátegui (El Tigre)' },
  { codigo: '0285', tipo: 'fijo', estado: 'Bolívar (Ciudad Bolívar)' },
  { codigo: '0286', tipo: 'fijo', estado: 'Bolívar (Ciudad Guayana / Puerto Ordaz)' },
  { codigo: '0287', tipo: 'fijo', estado: 'Delta Amacuro' },
  { codigo: '0288', tipo: 'fijo', estado: 'Bolívar (Zonas del Sur)' },
  { codigo: '0291', tipo: 'fijo', estado: 'Monagas (Maturín)' },
  { codigo: '0292', tipo: 'fijo', estado: 'Monagas (Zonas Internas)' },
  { codigo: '0293', tipo: 'fijo', estado: 'Sucre (Cumaná)' },
  { codigo: '0294', tipo: 'fijo', estado: 'Sucre (Carúpano)' },
  { codigo: '0295', tipo: 'fijo', estado: 'Nueva Esparta (Margarita)' },
];
const veCodeInfo = computed(() => {
  if (biz.value.phoneCountry !== 'VE') return null;
  const digits = biz.value.phoneNumber.replace(/\D/g, '');
  if (digits.length < 4) return null;
  const code = digits.slice(0, 4);
  return veCodes.find(c => c.codigo === code) || null;
});
const veCodeValid = computed(() => {
  if (biz.value.phoneCountry !== 'VE') return true;
  const digits = biz.value.phoneNumber.replace(/\D/g, '');
  if (digits.length < 4) return true;
  return veCodeInfo.value !== null;
});
const veCodeError = computed(() => {
  if (biz.value.phoneCountry !== 'VE') return '';
  const digits = biz.value.phoneNumber.replace(/\D/g, '');
  if (digits.length < 4) return '';
  if (!veCodeInfo.value) return 'Código de área u operadora no válido en Venezuela';
  return '';
});
const phoneClean = computed(() => {
  const digits = biz.value.phoneNumber.replace(/\D/g, '');
  const cfg = phoneConfig[biz.value.phoneCountry];
  if (biz.value.phoneCountry === 'OT') return digits;
  const national = digits.replace(/^0+/, '');
  return cfg.prefix.replace('+', '') + national;
});
const phoneValid = computed(() => {
  if (!biz.value.phoneNumber) return false;
  const digits = biz.value.phoneNumber.replace(/\D/g, '');
  const cfg = phoneConfig[biz.value.phoneCountry];
  if (biz.value.phoneCountry === 'OT') return digits.length >= 4;
  if (biz.value.phoneCountry === 'VE') {
    if (!veCodeValid.value) return false;
    if (digits.length < 4) return false;
  }
  return cfg.len > 0 && digits.length === cfg.len;
});

const step1Valid = computed(() => biz.value.legalName.length >= 3 && rifRegex.test(rifClean.value) && phoneValid.value);

function maskPhone(v: string) {
  let digits = v.replace(/\D/g, '');
  const cfg = phoneConfig[biz.value.phoneCountry];
  if (!cfg?.mask) { biz.value.phoneNumber = digits; return; }
  const raw = cfg.mask;
  let out = '', di = 0;
  for (const ch of raw) {
    if (di >= digits.length) break;
    if (ch === '#') { out += digits[di]; di++; }
    else out += ch;
  }
  biz.value.phoneNumber = out;
}

const rifMaxLen = computed(() => biz.value.rifType === 'V' || biz.value.rifType === 'E' ? 10 : 12);

function maskRif(v: string) {
  let digits = v.replace(/[^0-9]/g, '');
  const isCI = biz.value.rifType === 'V' || biz.value.rifType === 'E';
  const maxDi = isCI ? 8 : 9;
  if (digits.length > maxDi) digits = digits.slice(0, maxDi);
  if (isCI) {
    if (digits.length <= 3) biz.value.rifNumber = digits;
    else if (digits.length <= 6) biz.value.rifNumber = digits.slice(0, -3) + '.' + digits.slice(-3);
    else biz.value.rifNumber = digits.slice(0, -6) + '.' + digits.slice(-6, -3) + '.' + digits.slice(-3);
  } else {
    if (digits.length <= 2) biz.value.rifNumber = digits;
    else if (digits.length <= 5) biz.value.rifNumber = digits.slice(0, 2) + '.' + digits.slice(2);
    else if (digits.length <= 8) biz.value.rifNumber = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
    else biz.value.rifNumber = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '-' + digits.slice(8);
  }
}

const loc = ref({ countryId: '', stateId: '', cityId: '', country: '', state: '', city: '' });
const localStates = ref<any[]>([]);
const localCities = ref<any[]>([]);
const loadingStates = ref(false);
const loadingCities = ref(false);
const step2Valid = computed(() => !!loc.value.countryId && !!loc.value.stateId && !!loc.value.cityId);

async function onCountryChange(countryUlid?: string) {
  const id = countryUlid ?? loc.value.countryId;
  loc.value.countryId = id;
  if (!id) return;
  const found = geography.activeCountries.find(c => String(c.id) === id);
  loc.value.country = found?.name || '';
  loc.value.stateId = '';
  loc.value.cityId = '';
  localStates.value = [];
  localCities.value = [];
  loadingStates.value = true;
  try {
    const data = await geography.fetchStatesByCountry(id);
    localStates.value = Array.isArray(data) ? data : (data as any)?.results || [];
  } catch (e) {
    console.error('Failed to load states:', e);
  }
  finally { loadingStates.value = false; }
}
async function onStateChange(stateUlid?: string) {
  const id = stateUlid ?? loc.value.stateId;
  loc.value.stateId = id;
  if (!id) return;
  const found = localStates.value.find((s: any) => s.id === id);
  loc.value.state = found?.name || '';
  loc.value.cityId = '';
  localCities.value = [];
  loadingCities.value = true;
  try {
    const data = await geography.fetchCitiesByState(id);
    localCities.value = Array.isArray(data) ? data : (data as any)?.results || [];
  } catch (e) {
    console.error('Failed to load cities:', e);
  }
  finally { loadingCities.value = false; }
}
function onCityChange(cityUlid?: string) {
  const id = cityUlid ?? loc.value.cityId;
  loc.value.cityId = id;
  const found = localCities.value.find((c: any) => c.id === id);
  loc.value.city = found?.name || '';
}

const blueprints = ref<any[]>([]);
const selectedBlueprint = ref<any>(null);
const step3Valid = computed(() => selectedBlueprint.value !== null);

const blueprintFeatures = computed(() => {
  const bp = selectedBlueprint.value;
  if (!bp) return [];
  const fs: string[] = [];
  const c = bp.category_structure;
  if (c?.manejo_tallas || bp.code === 'calzado' || bp.code === 'ropa') fs.push('Manejo de Tallas y Colores');
  if (c?.lotes || bp.code === 'farmacia' || bp.code === 'viveres') fs.push('Control de Lotes y Caducidad');
  if (c?.servicios || bp.code === 'restaurante') fs.push('Gestión de Servicios y Mesas');
  if (c?.garantias || bp.code === 'tecnologia') fs.push('Control de Garantías');
  fs.push('Gaveteros financieros automáticos');
  fs.push('Dashboard de ventas y gastos');
  return fs;
});

const activeCurrencies = computed(() =>
  configStore.currencies?.filter((c: any) => c.is_active) || []
);
const vaultTemplates = ref<any[]>([]);
const paymentMethodTemplates = ref<any[]>([]);

const fin = ref({
  currencyIds: [] as string[],
  vaults: [] as { code: string, name: string, vault_type: string, currency: string, alias: string, initialBalance: number }[],
  paymentMethods: [] as { slug: string, name: string, alias: string, vaultCode: string, config: Record<string, any> }[],
  initialRate: 0,
});
const step4Valid = computed(() => fin.value.currencyIds.length > 0 && fin.value.vaults.length > 0);
function addPaymentMethod(tpl: any) {
  if (fin.value.paymentMethods.some(pm => pm.slug === tpl.slug)) return;
  fin.value.paymentMethods.push({
    slug: tpl.slug,
    name: tpl.name,
    alias: '',
    vaultCode: '',
    config: {},
  });
}
function removePaymentMethod(idx: number) { fin.value.paymentMethods.splice(idx, 1); }

const showVaultModal = ref(false);
const showVaultConfig = ref(false);
const vaultConfig = ref({ code: '', name: '', currency: '', vault_type: '', alias: '', initialBalance: 0 });
function openVaultModal() { showVaultModal.value = true; }
function closeVaultModal() { showVaultModal.value = false; }
function selectVaultTemplate(tpl: any) {
  vaultConfig.value = { code: tpl.code, name: tpl.name, currency: tpl.default_currency, vault_type: tpl.vault_type, alias: '', initialBalance: 0 };
  showVaultModal.value = false;
  showVaultConfig.value = true;
}
function confirmVault() {
  fin.value.vaults.push({ ...vaultConfig.value });
  showVaultConfig.value = false;
}
function removeVault(idx: number) { fin.value.vaults.splice(idx, 1); }

const templatesForSelectedCurrencies = computed(() => {
  const codes = new Set<string>();
  for (const curId of fin.value.currencyIds) {
    const cur = activeCurrencies.value.find((c: any) => c.code === curId || c.id === curId);
    if (cur) codes.add(cur.code);
  }
  return vaultTemplates.value.filter((v: any) => codes.has(v.default_currency));
});
const availableMethods = computed(() => {
  const codes = new Set<string>();
  for (const curId of fin.value.currencyIds) {
    const cur = activeCurrencies.value.find((c: any) => c.code === curId || c.id === curId);
    if (cur) codes.add(cur.code);
  }
  const pmByCurrency: Record<string, any[]> = {};
  for (const pm of paymentMethodTemplates.value) {
    if (!pm.is_active) continue;
    const curCode = pm.currency?.code || pm.currency_code || '__';
    if (!pmByCurrency[curCode]) pmByCurrency[curCode] = [];
    pmByCurrency[curCode].push(pm);
  }
  const ids = new Set<string>();
  for (const code of codes) {
    for (const pm of (pmByCurrency[code] || [])) ids.add(pm.id);
  }
  return paymentMethodTemplates.value.filter((pm: any) => ids.has(pm.id));
});

const addableMethods = computed(() =>
  availableMethods.value.filter((m: any) => !fin.value.paymentMethods.some((p: any) => p.slug === m.slug))
);

const selectedPlan = ref('pro');
const plans = [
  { id: 'basic', name: 'Básico', price: 'Gratis', period: 'Siempre', features: ['1 Gavetero', 'Reportes básicos', '50 ventas/mes', 'Soporte email'], popular: false },
  { id: 'pro', name: 'Pro', price: '$29', period: '/mes', features: ['5 Gaveteros', 'Reportes avanzados', 'Multimoneda', 'API básica', 'Soporte prioritario'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: '$99', period: '/mes', features: ['Ilimitado', 'API personalizada', 'Multi-sucursal', 'Soporte 24/7', 'Onboarding dedicado'], popular: false },
];

function onLogoDrop(e: DragEvent) { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f && f.type.startsWith('image/')) setLogo(f); }
function onLogoSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) setLogo(f); }
function setLogo(file: File) { biz.value.logo = file; biz.value.logoPreview = URL.createObjectURL(file); }

onMounted(async () => {
  restoreForm();
  try {
    const [bps, _countries] = await Promise.all([
      fetchApi('/api/v1/industry-blueprints/') as Promise<any>,
      geography.fetchCountries(),
    ]);
    blueprints.value = bps?.results || bps || [];
    const [vaultsRes, paymentsRes] = await Promise.all([
      fetchApi('/api/v1/treasury/vaults/') as Promise<any>,
      fetchApi('/api/staff/payment-templates/') as Promise<any>,
    ]);
    vaultTemplates.value = vaultsRes?.vaults || vaultsRes?.results || [];
    paymentMethodTemplates.value = paymentsRes?.results || paymentsRes || [];
    if (blueprintRestoreId.value && blueprints.value.length) {
      const bp = blueprints.value.find((b: any) => b.id === blueprintRestoreId.value);
      if (bp) selectedBlueprint.value = bp;
    }
    if (!loc.value.countryId) {
      const ve = geography.activeCountries.find((c: any) => c.code === 'VE');
      if (ve) {
        loc.value.countryId = ve.ulid;
        loc.value.country = ve.name;
      }
    }
  } catch { /* silent */ }
});

const STORAGE_KEY = 'efectivo360_wizard';
function saveForm() {
  const data = JSON.stringify({
    step: step.value,
    biz: { legalName: biz.value.legalName, rifType: biz.value.rifType, rifNumber: biz.value.rifNumber, phoneCountry: biz.value.phoneCountry, phoneNumber: biz.value.phoneNumber, address: biz.value.address, logoPreview: biz.value.logoPreview },
    loc: { countryId: loc.value.countryId, stateId: loc.value.stateId, cityId: loc.value.cityId, country: loc.value.country, state: loc.value.state, city: loc.value.city },
    blueprintId: selectedBlueprint.value?.id || null,
    fin: { currencyIds: fin.value.currencyIds, vaults: fin.value.vaults, paymentMethods: fin.value.paymentMethods, initialRate: fin.value.initialRate },
    selectedPlan: selectedPlan.value,
    localStates: localStates.value,
    localCities: localCities.value,
  });
  try { localStorage.setItem(STORAGE_KEY, data); } catch { /* silent */ }
}
function restoreForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.step) step.value = data.step;
    if (data.biz) { biz.value.legalName = data.biz.legalName || ''; biz.value.rifType = data.biz.rifType || 'J'; biz.value.rifNumber = data.biz.rifNumber || ''; biz.value.phoneCountry = data.biz.phoneCountry || 'VE'; biz.value.phoneNumber = data.biz.phoneNumber || ''; biz.value.address = data.biz.address || ''; biz.value.logoPreview = data.biz.logoPreview || ''; }
    if (data.loc) { loc.value.countryId = data.loc.countryId || ''; loc.value.stateId = data.loc.stateId || ''; loc.value.cityId = data.loc.cityId || ''; loc.value.country = data.loc.country || ''; loc.value.state = data.loc.state || ''; loc.value.city = data.loc.city || ''; }
    if (data.fin) { fin.value.currencyIds = data.fin.currencyIds || []; fin.value.vaults = data.fin.vaults || []; fin.value.paymentMethods = data.fin.paymentMethods || []; fin.value.initialRate = data.fin.initialRate || 0; }
    if (data.selectedPlan) selectedPlan.value = data.selectedPlan;
    if (data.localStates) localStates.value = data.localStates;
    if (data.localCities) localCities.value = data.localCities;
    if (data.blueprintId) blueprintRestoreId.value = data.blueprintId;
  } catch { /* silent */ }
}
function clearForm() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* silent */ } }

const blueprintRestoreId = ref<number | null>(null);

watch(() => step.value, () => { setTimeout(saveForm, 0); });
watch(() => biz.value.legalName, () => { setTimeout(saveForm, 0); });
watch(() => biz.value.rifType, () => { setTimeout(saveForm, 0); });
watch(() => biz.value.rifNumber, () => { setTimeout(saveForm, 0); });
watch(() => (biz.value as any).phone, () => { setTimeout(saveForm, 0); });
watch(() => biz.value.phoneCountry, () => { biz.value.phoneNumber = ''; setTimeout(saveForm, 0); });
watch(() => biz.value.phoneNumber, () => { setTimeout(saveForm, 0); });
watch(() => biz.value.address, () => { setTimeout(saveForm, 0); });
watch(() => loc.value.countryId, () => { setTimeout(saveForm, 0); });
watch(() => loc.value.stateId, () => { setTimeout(saveForm, 0); });
watch(() => loc.value.cityId, () => { setTimeout(saveForm, 0); });
watch(() => fin.value.currencyIds?.length, () => { setTimeout(saveForm, 0); });
watch(() => fin.value.vaults?.length, () => { setTimeout(saveForm, 0); });
watch(() => fin.value.paymentMethods?.length, () => { setTimeout(saveForm, 0); });
watch(() => fin.value.initialRate, () => { setTimeout(saveForm, 0); });
watch(selectedPlan, () => { setTimeout(saveForm, 0); });
watch(selectedBlueprint, () => { setTimeout(saveForm, 0); });
window.addEventListener('beforeunload', saveForm);

function canGoNext(): boolean {
  if (step.value === 1) return step1Valid.value;
  if (step.value === 2) return step2Valid.value;
  if (step.value === 3) return step3Valid.value;
  if (step.value === 4) return step4Valid.value;
  return true;
}

async function handleNext() {
  if (!canGoNext()) return;
  loadingNext.value = true;
  saveForm();
  setTimeout(() => {
    loadingNext.value = false;
    step.value++;
  }, 400);
}

async function finishSetup() {
  submitting.value = true;
  try {
    const body: any = {
      legalName: biz.value.legalName,
      storeName: biz.value.legalName,
      rif: rifClean.value,
      phone: phoneClean.value,
      address: biz.value.address,
      country: loc.value.country,
      state: loc.value.state,
      city: loc.value.city,
      blueprintCode: selectedBlueprint.value?.code || '',
      currencyIds: fin.value.currencyIds,
      vaults: fin.value.vaults,
      paymentMethods: fin.value.paymentMethods,
      mainCurrency: fin.value.currencyIds[0] || 'VES',
      plan: selectedPlan.value,
      initialRate: fin.value.initialRate || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const fd = new FormData();
    fd.append('data', JSON.stringify(body));
    if (biz.value.logo) fd.append('logo', biz.value.logo);
    showLoader.value = true;
    const res: any = await fetchApi('/api/v1/tenant/create/', { method: 'POST', data: fd });
    await authStore.fetchUser();
    toast.success(res?.message || 'Tienda creada con éxito');
    clearForm();
    setTimeout(() => { showLoader.value = false; router.push('/admin/dashboard'); }, 2000);
  } catch (e: any) {
    showLoader.value = false;
    toast.error(e?.message || 'Error al crear la tienda');
  } finally { submitting.value = false; }
}

const progressPct = computed(() => Math.round((step.value / totalSteps) * 100));
</script>

<template>
  <Teleport to="body">
    <div v-if="showLoader"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style="background: #f8fafc;">
      <div class="relative">
        <svg class="w-12 h-12" style="animation: spin 1.2s linear infinite">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" stroke-width="2.5" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="#06b6d4" stroke-width="2.5"
            stroke-dasharray="126" stroke-dashoffset="32" stroke-linecap="round" />
        </svg>
      </div>
      <p class="mt-5 text-sm font-semibold text-slate-900">Configurando tu tienda...</p>
      <p class="mt-1 text-xs text-slate-400">Esto tomará un momento</p>
    </div>
  </Teleport>

  <div class="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none"
      style="background-image: radial-gradient(#E2E8F0 1px, transparent 1px); background-size: 20px 20px;" />
    <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%);" />

    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div class="mb-6 text-center">
        <img src="/assets/efectivo360/logo.svg" alt="Efectivo 360" class="h-10 mx-auto" />
        <p class="text-xs text-slate-400 mt-2">Configuración inicial</p>
      </div>

      <!-- Stepper -->
      <div class="w-full max-w-2xl mb-8">
        <div class="flex items-center justify-between">
          <template v-for="s in totalSteps" :key="s">
            <div class="flex items-center">
              <div class="flex flex-col items-center">
                <div v-if="s < step"
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-500 shadow-sm transition-all duration-300">
                  <Check class="w-5 h-5 text-white" />
                </div>
                <div v-else-if="s === step"
                  class="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white shadow-sm transition-all duration-300"
                  style="border-color: #06b6d4;">
                  <Store v-if="s === 1" class="w-5 h-5" style="color: #06b6d4;" />
                  <MapPin v-else-if="s === 2" class="w-5 h-5" style="color: #06b6d4;" />
                  <Dna v-else-if="s === 3" class="w-5 h-5" style="color: #06b6d4;" />
                  <Wallet v-else-if="s === 4" class="w-5 h-5" style="color: #06b6d4;" />
                  <Zap v-else class="w-5 h-5" style="color: #06b6d4;" />
                </div>
                <div v-else
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 transition-all duration-300">
                  <Store v-if="s === 1" class="w-5 h-5 text-slate-300" />
                  <MapPin v-else-if="s === 2" class="w-5 h-5 text-slate-300" />
                  <Dna v-else-if="s === 3" class="w-5 h-5 text-slate-300" />
                  <Wallet v-else-if="s === 4" class="w-5 h-5 text-slate-300" />
                  <Zap v-else class="w-5 h-5 text-slate-300" />
                </div>
                <span class="mt-2 text-xs font-medium"
                  :class="s <= step ? 'text-slate-700' : 'text-slate-400'">
                  {{ s === 1 ? 'Negocio' : s === 2 ? 'Ubicación' : s === 3 ? 'Rubro' : s === 4 ? 'Finanzas' : 'Plan' }}
                </span>
              </div>
              <div v-if="s < totalSteps" class="w-16 sm:w-20 h-0.5 mx-3 -mt-6 rounded-full transition-all duration-500"
                :style="s < step ? 'background: #06b6d4;' : 'background: #e2e8f0;'" />
            </div>
          </template>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full max-w-2xl mb-6">
        <div class="flex items-center gap-3">
          <div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ease-out"
              :style="{ width: progressPct + '%', background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }" />
          </div>
          <span class="text-xs font-medium text-slate-400 min-w-[2.5rem] text-right">{{ progressPct }}%</span>
        </div>
      </div>

      <!-- Card -->
      <div class="w-full max-w-2xl rounded-2xl transition-all duration-500 relative overflow-hidden"
        style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);"
        :key="step">
        <!-- Top gradient bar -->
        <div class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 opacity-80" />

        <div class="p-8 sm:p-10">

        <!-- Step 1 -->
        <div v-if="step === 1" class="space-y-4">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <Store class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Identidad del Negocio</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">Ingresa los datos de tu empresa</p>
          </div>
          <div class="space-y-4">
            <div class="relative">
              <Building2 class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input v-model="biz.legalName" placeholder="Razón Social"
                class="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200" />
            </div>
            <div class="relative flex gap-2">
              <div class="relative shrink-0">
                <FileBadge class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <select v-model="biz.rifType" @change="biz.rifNumber = ''"
                  class="w-16 h-12 pl-9 pr-1 rounded-xl border text-sm font-bold text-slate-900 appearance-none outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200"
                  style="border-color: #e2e8f0;">
                  <option v-for="t in ['V', 'E', 'J', 'G']" :key="t" :value="t" class="bg-white">{{ t }}</option>
                </select>
              </div>
              <div class="relative flex-1">
                <input :value="biz.rifNumber" @input="maskRif(($event.target as HTMLInputElement).value)" :placeholder="biz.rifType === 'V' || biz.rifType === 'E' ? '26.789.123' : '40.123.456-7'" :maxlength="rifMaxLen"
                  class="w-full h-12 pl-4 pr-4 rounded-xl border text-sm uppercase font-mono outline-none transition-all duration-200 bg-white"
                  :class="biz.rifNumber && !rifRegex.test(rifClean) ? 'border-red-300 bg-red-50 text-slate-900' : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200'" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex gap-2 col-span-2">
                <div class="relative shrink-0">
                  <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <select v-model="biz.phoneCountry" @change="biz.phoneNumber = ''"
                    class="w-[6.5rem] h-12 pl-9 pr-2 rounded-xl border text-sm font-medium text-slate-900 appearance-none outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200"
                    style="border-color: #e2e8f0;">
                    <option v-for="(cfg, code) in phoneConfig" :key="code" :value="code" class="bg-white">{{ cfg.flag }} {{ cfg.prefix }}</option>
                  </select>
                </div>
                <div class="relative flex-1">
                  <input :value="biz.phoneNumber" @input="maskPhone(($event.target as HTMLInputElement).value)" :placeholder="phoneConfig[biz.phoneCountry]?.mask || '(+XX) Número'" :maxlength="phoneConfig[biz.phoneCountry]?.mask?.length || 20"
                    class="w-full h-12 pl-4 pr-4 rounded-xl border text-sm outline-none transition-all duration-200 bg-white"
                    :class="biz.phoneNumber && !phoneValid ? 'border-red-300 bg-red-50 text-slate-900' : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200'" />
                </div>
              </div>
              <div v-if="veCodeError" class="text-xs text-red-500 -mt-2 col-span-2">{{ veCodeError }}</div>
              <div v-else-if="veCodeInfo" class="text-xs text-slate-500 -mt-2 col-span-2">{{ veCodeInfo.tipo === 'móvil' ? '📱' : '🏢' }} {{ veCodeInfo.empresa || veCodeInfo.estado }}</div>
              <div class="relative col-span-2 sm:col-span-1">
                <MapPinned class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="biz.address" placeholder="Dirección"
                  class="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200" />
              </div>
            </div>
          </div>
          <div class="flex justify-center pt-4">
            <div @dragover.prevent @drop.prevent="onLogoDrop" @click="logoInput?.click()"
              class="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              :class="biz.logoPreview ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'">
              <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoSelected" />
              <img v-if="biz.logoPreview" :src="biz.logoPreview" class="w-full h-full rounded-md object-cover p-1" />
              <template v-else>
                <Camera class="w-5 h-5 text-slate-300" />
                <span class="text-[9px] mt-1 text-slate-400">Logo</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div v-if="step === 2" class="space-y-4">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <MapPin class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Ubicación</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">¿Dónde está tu negocio?</p>
          </div>
          <div class="space-y-4">
            <div class="relative">
              <Globe class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10 text-slate-400" />
              <select :value="loc.countryId" @change="onCountryChange(($event.target as HTMLSelectElement).value)"
                class="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 appearance-none outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200">
                <option value="" class="bg-white">País</option>
                <option v-for="c in geography.activeCountries" :key="c.id" :value="c.id" class="bg-white">{{ c.name }}</option>
              </select>
            </div>
            <div class="relative">
              <MapPin class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10 text-slate-400" />
              <select :value="loc.stateId" @change="onStateChange(($event.target as HTMLSelectElement).value)" :disabled="!loc.countryId || loadingStates"
                class="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 appearance-none outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200 disabled:opacity-40">
                <option value="" class="bg-white">Estado / Provincia</option>
                <option v-for="s in localStates" :key="s.id" :value="s.id" class="bg-white">{{ s.name }}</option>
              </select>
              <Loader2 v-if="loadingStates" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
            </div>
            <div class="relative">
              <Landmark class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10 text-slate-400" />
              <select :value="loc.cityId" @change="onCityChange(($event.target as HTMLSelectElement).value)" :disabled="!loc.stateId || loadingCities"
                class="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 appearance-none outline-none transition-all duration-200 bg-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200 disabled:opacity-40">
                <option value="" class="bg-white">Ciudad</option>
                <option v-for="c in localCities" :key="c.id" :value="c.id" class="bg-white">{{ c.name }}</option>
              </select>
              <Loader2 v-if="loadingCities" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div v-if="step === 3" class="space-y-4">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <Dna class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Tipo de Negocio</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">Selecciona tu rubro</p>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <button v-for="bp in blueprints" :key="bp.id" @click="selectedBlueprint = bp"
              class="p-4 rounded-xl border text-center transition-all duration-200"
              :class="selectedBlueprint?.id === bp.id ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'">
              <LucideIcon :name="bp.icon" :size="20"
                :class="selectedBlueprint?.id === bp.id ? 'text-cyan-600' : 'text-slate-400'" />
              <p class="text-xs font-semibold leading-tight"
                :class="selectedBlueprint?.id === bp.id ? 'text-cyan-700' : 'text-slate-600'">
                {{ bp.name }}
              </p>
            </button>
          </div>
          <div v-if="selectedBlueprint"
            class="rounded-lg p-4 border bg-slate-50 border-slate-200">
            <p class="text-xs font-semibold text-slate-600 mb-2">
              Funciones activadas para {{ selectedBlueprint.name }}:
            </p>
            <div v-for="f in blueprintFeatures" :key="f" class="flex items-center gap-2 text-xs text-slate-500">
              <Check class="w-3.5 h-3.5 flex-shrink-0 text-cyan-600" /> {{ f }}
            </div>
          </div>
        </div>

        <!-- Step 4 -->
        <div v-if="step === 4" class="space-y-5">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <Wallet class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Tesorería</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">Monedas, gaveteros y métodos de pago</p>
          </div>

          <!-- Monedas -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Monedas Activas</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="c in activeCurrencies" :key="c.id"
                @click="fin.currencyIds.includes(String(c.id)) ? fin.currencyIds = fin.currencyIds.filter(x => x !== String(c.id)) : fin.currencyIds.push(String(c.id))"
                class="px-3 py-2 rounded-lg border text-xs font-semibold transition-all"
                :class="fin.currencyIds.includes(String(c.id)) ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-500'">
                {{ c.symbol }} {{ c.code }}
              </button>
            </div>
          </div>

          <!-- Gaveteros -->
          <div v-if="templatesForSelectedCurrencies.length && fin.currencyIds.length">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Gaveteros</p>
              <span class="text-xs text-slate-400">{{ fin.vaults.length }} configurado(s)</span>
            </div>

            <div v-if="fin.vaults.length" class="space-y-2 mb-3">
              <div v-for="(v, i) in fin.vaults" :key="i"
                class="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-center gap-3">
                  <Banknote class="w-5 h-5 text-cyan-600 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <input v-model="v.alias" :placeholder="'Alias: ' + v.name"
                      class="w-full text-xs font-medium text-slate-900 outline-none bg-transparent" />
                    <p class="text-[10px] text-slate-400 mt-0.5">{{ v.name }} · {{ v.currency }}</p>
                  </div>
                  <button @click="removeVault(i)" class="shrink-0 text-slate-400 hover:text-red-500 transition-colors">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button @click="openVaultModal"
              class="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors">
              <Plus class="w-4 h-4" /> Agregar Gavetero
            </button>
          </div>

          <!-- Métodos de Pago (solo si hay gaveteros) -->
          <div v-if="fin.vaults.length && availableMethods.length">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Métodos de Pago</p>
              <span class="text-xs text-slate-400">{{ fin.paymentMethods.length }} configurado(s)</span>
            </div>

            <div v-if="fin.paymentMethods.length" class="space-y-2 mb-3">
              <div v-for="(pm, i) in fin.paymentMethods" :key="i"
                class="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-center gap-3">
                  <CreditCard class="w-5 h-5 text-cyan-600 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <input v-model="pm.alias" :placeholder="'Alias: ' + pm.name"
                      class="w-full text-xs font-medium text-slate-900 outline-none bg-transparent" />
                    <div class="flex gap-2 mt-1">
                      <select v-model="pm.vaultCode"
                        class="text-[10px] rounded border border-slate-200 bg-white text-slate-600">
                        <option value="">Sin gavetero</option>
                        <option v-for="v in fin.vaults" :key="v.code" :value="v.code">{{ v.alias || v.name }} ({{ v.currency }})</option>
                      </select>
                    </div>
                  </div>
                  <button @click="removePaymentMethod(i)" class="shrink-0 text-slate-400 hover:text-red-500 transition-colors">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <p class="text-[10px] text-slate-400 mb-1">Agregar plantilla:</p>
              <button v-for="method of addableMethods" :key="(method as any).id"
                @click="addPaymentMethod(method)"
                class="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-left">
                <CreditCard class="w-4 h-4 text-slate-400" />
                <span class="text-xs font-semibold text-slate-700">{{ (method as any).name }}</span>
                <span class="text-xs text-slate-400">({{ (method as any).currency?.code || '' }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 5 -->
        <div v-if="step === 5" class="space-y-4">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <Zap class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Tu Plan</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">Selecciona el plan ideal</p>
          </div>
          <div class="space-y-2.5">
            <button v-for="plan in plans" :key="plan.id" @click="selectedPlan = plan.id"
              class="w-full p-4 rounded-lg border text-left transition-all relative"
              :class="selectedPlan === plan.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white'">
              <div v-if="plan.popular"
                class="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-cyan-600">
                Popular
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold"
                    :class="selectedPlan === plan.id ? 'text-cyan-700' : 'text-slate-900'">
                    {{ plan.name }}
                  </p>
                  <p class="text-xs mt-0.5 text-slate-400">{{ plan.features.slice(0, 2).join(' · ') }}</p>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold"
                    :class="selectedPlan === plan.id ? 'text-cyan-700' : 'text-slate-900'">
                    {{ plan.price }}
                  </span>
                  <span class="text-[10px] text-slate-400">{{ plan.period }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
          <button v-if="step > 1" @click="step--"
            class="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all">
            <ArrowLeft class="w-4 h-4" /> Atrás
          </button>
          <div v-else />

          <button v-if="step < totalSteps" @click="handleNext"
            :disabled="!canGoNext() || loadingNext"
            class="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 bg-cyan-600 hover:bg-cyan-700">
            <template v-if="loadingNext">
              <Loader2 class="w-4 h-4 animate-spin" />
              Cargando
            </template>
            <template v-else>
              Siguiente <ArrowRight class="w-4 h-4" />
            </template>
          </button>

          <button v-else @click="finishSetup" :disabled="submitting"
            class="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
            <template v-if="submitting">
              <Loader2 class="w-4 h-4 animate-spin" />
              Creando
            </template>
            <template v-else>
              <Sparkles class="w-4 h-4" />
              Finalizar
            </template>
          </button>
        </div>
      </div>
      </div>

      <!-- MODAL: Seleccionar Gavetero -->
      <Teleport to="body">
        <div v-if="showVaultModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closeVaultModal">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2 class="text-base font-semibold text-slate-900">Seleccionar Gavetero</h2>
              <button @click="closeVaultModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X class="h-5 w-5" /></button>
            </div>
            <div class="p-5">
              <p class="text-xs text-slate-500 mb-3">Elige una plantilla de Bóveda del Blueprint</p>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="vt in templatesForSelectedCurrencies" :key="vt.code"
                  @click="selectVaultTemplate(vt)"
                  class="w-full text-left flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all">
                  <Banknote class="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-slate-900">{{ vt.name }}</span>
                      <span class="text-[10px] text-slate-400">{{ vt.code }}</span>
                    </div>
                    <p v-if="vt.description" class="text-xs text-slate-500 mt-0.5">{{ vt.description }}</p>
                    <span class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 mt-1.5">{{ vt.vault_type }} · {{ vt.default_currency }}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- MODAL: Configurar Gavetero -->
      <Teleport to="body">
        <div v-if="showVaultConfig" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showVaultConfig = false">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 class="text-base font-semibold text-slate-900">Configurar {{ vaultConfig.name }}</h2>
              <button @click="showVaultConfig = false" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X class="h-5 w-5" /></button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Alias</label>
                <input v-model="vaultConfig.alias" type="text" :placeholder="'Ej: ' + vaultConfig.name"
                  class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200" />
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="inline-flex items-center rounded px-1.5 py-0.5 bg-slate-100 text-slate-600">{{ vaultConfig.vault_type }}</span>
                <span>{{ vaultConfig.currency }}</span>
              </div>
            </div>
            <div class="border-t border-slate-100 px-5 py-4 flex items-center justify-end gap-3">
              <button @click="showVaultConfig = false"
                class="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button @click="confirmVault"
                class="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                Agregar Gavetero
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <p class="mt-5 text-[11px] text-slate-300">Efectivo 360 · Cifrado de grado bancario</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
