<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGeographyStore } from '@/stores/geography';
import { useAuthStore } from '@/stores/auth';
import { fetchApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import {
  Store, MapPin, Dna, Wallet, Zap, ArrowRight, ArrowLeft, Check, Plus, ChevronRight, ChevronLeft, ChevronDown,
  Camera, Building2, FileBadge, Phone, MapPinned, Globe, Landmark,
  Sparkles, Banknote, Loader2, CreditCard, Pencil,
} from 'lucide-vue-next';
import LucideIcon from '@/components/lucide/LucideIcon.vue';

const router = useRouter();
const geography = useGeographyStore();
const authStore = useAuthStore();
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
  return bp?.features || bp?.description ? [(bp?.description || ''), ...(bp?.features || [])].filter(Boolean).slice(0, 4) : [];
});

const fin = ref({
  currencyIds: ['USD', 'VES'] as string[],
  initialRate: 0,
});

// Step 4 — Treasury: Cargar del Blueprint (API) + configurar instancias
const bpMethods = ref<any[]>([]);
const bpVaults = ref<any[]>([]);
const configVaults = ref<{ code: string; name: string; vault_type: string; alias: string; currency: string }[]>([]);
const enabledMethods = ref<{ code: string; name: string; alias: string; vaultCode: string; configData?: Record<string, any> }[]>([]);
const loadingStep4 = ref(true);

// Unified Stepped Modal
const showSteppedModal = ref(false);
const modalContext = ref<'vault' | 'payment'>('vault');
const modalStep = ref(1);  // 1 = Select Blueprint, 2 = Customize Instance
const selectedTpl = ref<any>(null);
const customInstance = ref({ alias: '', currency: 'USD', configData: {} as Record<string, any>, bankCode: '', bankName: '', holderName: '', accountNumber: '', accountType: 'ahorros' });
const availableBanks = ref<any[]>([]);
const modalError = ref('');
const editingIndex = ref(-1); // -1 = new, >= 0 = editing existing

async function loadStep4Data() {
  try {
    const [vaultsRes, methodsRes] = await Promise.all([
      fetchApi('/api/v1/treasury/vaults/') as Promise<any>,
      fetchApi('/api/v1/treasury/payment-methods/') as Promise<any>,
    ]);
    bpVaults.value = vaultsRes?.vaults || [];
    bpMethods.value = methodsRes?.payment_methods || [];
  } catch {
    // fallback: leave empty
  } finally {
    loadingStep4.value = false;
  }
}

function openSteppedModal(context: 'vault' | 'payment', editIdx = -1) {
  modalContext.value = context;
  modalStep.value = 1;
  selectedTpl.value = null;
  modalError.value = '';
  editingIndex.value = editIdx;

  // If editing, jump to step 2 with pre-filled data
  if (editIdx >= 0) {
    const list = context === 'vault' ? configVaults.value : enabledMethods.value;
    const item = list[editIdx];
    if (item) {
      // Find matching blueprint
      const bps = context === 'vault' ? bpVaults.value : bpMethods.value;
      const tpl = bps.find((b: any) => b.code === item.code);
      if (tpl) selectedTpl.value = tpl;
      // Restore configData from existing entry, merging with schema defaults
      const restoredConfig: Record<string, any> = { ...((item as any).configData || {}) };
      for (const f of (tpl?.config_schema?.fields || [])) {
        if (!(f.key in restoredConfig) && f.default !== undefined) {
          restoredConfig[f.key] = f.default;
        }
      }
      customInstance.value = {
        alias: item.alias || '',
        currency: (item as any).currency || 'USD',
        configData: restoredConfig,
        bankCode: (item as any).vaultCode || '',
        bankName: (item as any).bankName || '',
        holderName: (item as any).holderName || '',
        accountNumber: (item as any).accountNumber || '',
        accountType: (item as any).accountType || 'ahorros',
      };
      // Load banks if the blueprint has bank/bank_code field
      if (tpl) loadBanksForBlueprint(tpl);
      modalStep.value = 2;
    }
  }

  showSteppedModal.value = true;
}

function removeEnabledMethod(idx: number) {
  enabledMethods.value.splice(idx, 1);
}

function removeConfigVault(idx: number) {
  configVaults.value.splice(idx, 1);
}

function goBackToStep1() {
  modalStep.value = 1;
  selectedTpl.value = null;
  modalError.value = '';
  editingIndex.value = -1;
}

function confirmAndSave() {
  modalError.value = '';
  if (!customInstance.value.alias.trim() && modalContext.value === 'payment') {
    modalError.value = 'El nombre personalizado es requerido';
    return;
  }

  if (modalContext.value === 'vault') {
    const entry = {
      code: selectedTpl.value.code,
      name: selectedTpl.value.name,
      vault_type: selectedTpl.value.vault_type,
      alias: customInstance.value.alias || selectedTpl.value.name,
      currency: customInstance.value.currency,
    };
    if (editingIndex.value >= 0) {
      configVaults.value[editingIndex.value] = entry;
    } else {
      configVaults.value.push(entry);
    }
  } else {
    const bankCode = customInstance.value.configData?.bank || customInstance.value.configData?.bank_code || customInstance.value.bankCode;
    const entry = {
      code: selectedTpl.value.code,
      name: selectedTpl.value.name,
      alias: customInstance.value.alias || selectedTpl.value.name,
      vaultCode: bankCode || configVaults.value[0]?.code || '',
      configData: { ...customInstance.value.configData },
    };
    if (editingIndex.value >= 0) {
      enabledMethods.value[editingIndex.value] = entry;
    } else {
      enabledMethods.value.push(entry);
    }
  }

  showSteppedModal.value = false;
  selectedTpl.value = null;
  modalStep.value = 1;
  editingIndex.value = -1;
}

// Load banks for a blueprint's country
async function loadBanksForBlueprint(bp: any) {
  availableBanks.value = [];
  const bankField = bp.config_schema?.fields?.find((f: any) => ['bank', 'bank_code'].includes(f.key));
  if (!bankField) return;
  const countries = bankField.countries || ['VE'];
  try {
    for (const cc of countries.slice(0, 1)) { // Load first country's banks
      const data = await fetchApi(`/api/v1/public/financial-entities/?country_code=${cc}&is_active=true`) as any;
      if (Array.isArray(data)) availableBanks.value = [...availableBanks.value, ...data];
    }
  } catch (_) { availableBanks.value = []; }
}

function selectTpl(bp: any) {
  selectedTpl.value = bp;
  customInstance.value = {
    alias: bp.name,
    currency: (bp.financial_rules?.allowed_currencies || ['USD'])[0],
    configData: {},
    bankCode: '',
    bankName: '',
    holderName: '',
    accountNumber: '',
    accountType: 'ahorros',
  };
  // Pre-fill config data from schema defaults
  for (const f of bp.config_schema?.fields || []) {
    if (f.default !== undefined) customInstance.value.configData[f.key] = f.default;
  }
  loadBanksForBlueprint(bp);
  modalStep.value = 2;
}

const step4Valid = computed(() =>
  enabledMethods.value.length > 0 &&
  configVaults.value.length > 0 &&
  configVaults.value.every(v => v.alias.trim())
);

const selectedPlanId = ref('');
const planOptions = ref<any[]>([]);

const filteredPlans = computed(() => {
  const bpCode = selectedBlueprint.value?.code || '';
  return planOptions.value.filter(p => {
    const industries: string[] = p.config?.only_for_industries;
    // Empty or missing → show to everyone
    if (!industries || !Array.isArray(industries) || industries.length === 0) return true;
    // Has specific industries → only show if blueprint matches
    return industries.includes(bpCode);
  }).filter(p => {
    // Hide free plans
    return p.prices?.monthly?.amount !== '0.00';
  });
});

const expandedPlans = ref<Set<string>>(new Set());

function togglePlanDetails(planUlid: string, event: Event) {
  event.stopPropagation(); // don't select the plan
  const next = new Set(expandedPlans.value);
  if (next.has(planUlid)) next.delete(planUlid);
  else next.add(planUlid);
  expandedPlans.value = next;
}

function onLogoDrop(e: DragEvent) { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f && f.type.startsWith('image/')) setLogo(f); }
function onLogoSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) setLogo(f); }
function setLogo(file: File) { biz.value.logo = file; biz.value.logoPreview = URL.createObjectURL(file); }

onMounted(async () => {
  restoreForm();
  if (step.value >= 4) loadStep4Data();
  try {
    const [bps, _countries] = await Promise.all([
      fetchApi('/api/v1/industry-blueprints/') as Promise<any>,
      geography.fetchCountries(),
    ]);
    blueprints.value = bps?.results || bps || [];
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
    // Fetch subscription plans
    const plansRes = await fetchApi('/api/v1/subscription-plans/?is_active=true') as any;
    planOptions.value = plansRes?.results || plansRes || [];
    if (!selectedPlanId.value && planOptions.value.length) {
      selectedPlanId.value = planOptions.value[0].ulid || '';
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
    fin: { currencyIds: fin.value.currencyIds, enabledMethods: enabledMethods.value, configVaults: configVaults.value, initialRate: fin.value.initialRate },
    selectedPlanId: selectedPlanId.value,
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
    if (data.fin) { fin.value.currencyIds = data.fin.currencyIds || []; enabledMethods.value = data.fin.enabledMethods || []; configVaults.value = data.fin.configVaults || []; fin.value.initialRate = data.fin.initialRate || 0; }
    if (data.selectedPlanId) selectedPlanId.value = data.selectedPlanId;
    if (data.localStates) localStates.value = data.localStates;
    if (data.localCities) localCities.value = data.localCities;
    if (data.blueprintId) blueprintRestoreId.value = data.blueprintId;
  } catch { /* silent */ }
}
function clearForm() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* silent */ } }

const blueprintRestoreId = ref<number | null>(null);

watch(() => step.value, (newStep) => {
  setTimeout(saveForm, 0);
  if (newStep === 4 && loadingStep4.value) {
    loadStep4Data();
  }
});
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
watch(() => configVaults.value?.length, () => { setTimeout(saveForm, 0); });
watch(() => enabledMethods.value?.length, () => { setTimeout(saveForm, 0); });
watch(selectedPlanId, () => { setTimeout(saveForm, 0); });
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
      selectedMethods: enabledMethods.value.map(m => ({ code: m.code, alias: m.alias, vaultCode: m.vaultCode, configData: m.configData || {} })),
      vaults: configVaults.value.map(v => ({ name: v.alias.trim(), currency: v.currency, blueprint_code: v.code })),
      mainCurrency: fin.value.currencyIds[0] || 'VES',
      plan: selectedPlanId.value,
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
      <div class="w-full max-w-2xl mb-8 overflow-x-auto">
        <div class="flex items-center justify-between min-w-[480px] sm:min-w-0">
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col sm:flex-row gap-2 sm:col-span-2">
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
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <p class="text-sm mt-1 text-slate-500">Configura tus métodos de pago y gaveteros desde el Blueprint Global</p>
          </div>

          <div v-if="loadingStep4" class="text-center py-6 text-sm text-slate-400">Cargando blueprint...</div>

          <template v-else>
            <!-- Monedas (fixed for VE) -->
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Monedas</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl border-2 border-cyan-500 bg-cyan-50 text-center"><p class="text-sm font-bold text-cyan-700">$ USD</p><p class="text-[10px] text-cyan-600 mt-0.5">Dólares</p></div>
                <div class="p-3 rounded-xl border-2 border-cyan-500 bg-cyan-50 text-center"><p class="text-sm font-bold text-cyan-700">Bs VES</p><p class="text-[10px] text-cyan-600 mt-0.5">Bolívares</p></div>
              </div>
            </div>

            <!-- Métodos de Pago -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Métodos de Pago</p>
                <span class="text-[10px] text-slate-400">{{ enabledMethods.length }}</span>
              </div>
              <div v-if="enabledMethods.length" class="space-y-2 mb-3">
                <div v-for="(m, i) in enabledMethods" :key="i"
                  class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <CreditCard class="w-5 h-5 text-cyan-600 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-800">{{ m.alias }}</p>
                    <p class="text-[10px] text-slate-400">{{ m.name }}</p>
                  </div>
                  <button @click="openSteppedModal('payment', i)" class="shrink-0 text-slate-400 hover:text-cyan-600" title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="removeEnabledMethod(i)" class="shrink-0 text-slate-400 hover:text-red-500" title="Eliminar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              <button @click="openSteppedModal('payment')"
                class="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-medium text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                <Plus class="w-4 h-4" /> Agregar Método de Pago
              </button>
              <div v-if="modalError" class="text-xs text-red-500 mt-1.5">{{ modalError }}</div>
            </div>

            <!-- Gaveteros -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Gaveteros</p>
                <span class="text-[10px] text-slate-400">{{ configVaults.length }}</span>
              </div>
              <div v-if="configVaults.length" class="space-y-2 mb-3">
                <div v-for="(v, i) in configVaults" :key="i"
                  class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                  <Banknote class="w-5 h-5 text-cyan-600 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <input v-model="v.alias" :placeholder="v.name || 'Alias del gavetero'"
                      class="w-full text-xs font-medium text-slate-900 outline-none bg-transparent border-b border-transparent focus:border-cyan-300 transition-colors" />
                    <div class="flex gap-2 mt-1">
                      <span class="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-100">{{ v.vault_type }}</span>
                      <select v-model="v.currency" class="text-[10px] rounded border border-slate-200 px-1 text-slate-600">
                        <option value="USD">USD</option><option value="VES">VES</option>
                      </select>
                    </div>
                  </div>
                  <button @click="openSteppedModal('vault', i)" class="shrink-0 text-slate-400 hover:text-cyan-600" title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="removeConfigVault(i)" class="shrink-0 text-slate-400 hover:text-red-500" title="Eliminar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              <button @click="openSteppedModal('vault')"
                class="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-medium text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                <Plus class="w-4 h-4" /> Agregar Gavetero
              </button>
            </div>
          </template>
        </div>

        <!-- UNIFIED Stepped Modal: Payment Methods + Vault Templates -->
        <Teleport to="body">
          <div v-if="showSteppedModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showSteppedModal = false; editingIndex = -1">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm">
              <!-- Step 1: Select Blueprint -->
              <template v-if="modalStep === 1">
                <div class="flex items-center justify-between border-b px-5 py-3">
                  <h3 class="text-sm font-semibold text-slate-900">{{ modalContext === 'vault' ? 'Agregar Gavetero' : 'Agregar Método de Pago' }}</h3>
                  <button @click="showSteppedModal = false; editingIndex = -1" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                </div>
                <div class="p-5 space-y-2 max-h-80 overflow-y-auto">
                  <p class="text-xs text-slate-500 mb-2">Paso 1/2 — Selecciona una plantilla del Blueprint:</p>
                  <button v-for="bp in (modalContext === 'vault' ? bpVaults : bpMethods)" :key="bp.code"
                    @click="selectTpl(bp)"
                    class="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-cyan-300 transition-all">
                    <component :is="modalContext === 'vault' ? Banknote : CreditCard" class="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p class="text-xs font-semibold text-slate-800">{{ bp.name }}</p>
                      <p class="text-[10px] text-slate-400">
                        <template v-if="modalContext === 'vault'">{{ bp.vault_type }} · {{ (bp.financial_rules?.allowed_currencies || ['USD'])[0] }}</template>
                        <template v-else>{{ bp.config_schema?.fields?.map((f: any) => f.key).join(', ') || 'Sin campos' }}</template>
                      </p>
                    </div>
                    <ChevronRight class="w-4 h-4 text-slate-300 ml-auto shrink-0" />
                  </button>
                </div>
                <div class="border-t px-5 py-3 flex justify-end">
                  <button @click="showSteppedModal = false; editingIndex = -1" class="h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </template>

              <!-- Step 2: Customize Instance -->
              <template v-if="modalStep === 2 && selectedTpl">
                <div class="flex items-center justify-between border-b px-5 py-3">
                  <h3 class="text-sm font-semibold text-slate-900">{{ editingIndex >= 0 ? 'Editar' : 'Personalizar' }} {{ selectedTpl.name }}</h3>
                  <button @click="showSteppedModal = false; editingIndex = -1" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                </div>
                <div class="p-5 space-y-4">
                  <p class="text-xs text-slate-500">Paso 2/2 — Personaliza la instancia:</p>

                  <!-- Alias -->
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Nombre Personalizado <span class="text-red-500">*</span></label>
                    <input v-model="customInstance.alias" :placeholder="selectedTpl.name"
                      class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs" />
                  </div>

                  <!-- Vault context: simple type + currency -->
                  <template v-if="modalContext === 'vault'">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1.5">Nombre del Banco</label>
                        <input v-model="customInstance.bankName" placeholder="Ej. Banco Mercantil" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1.5">Titular</label>
                        <input v-model="customInstance.holderName" placeholder="Nombre del titular" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1.5">Nro. Cuenta / Cta. Contable</label>
                        <input v-model="customInstance.accountNumber" placeholder="0000-0000-00-0000000000" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1.5">Tipo de Cuenta</label>
                        <select v-model="customInstance.accountType" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs">
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                    <option value="contable">Contable</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Moneda</label>
                <select v-model="customInstance.currency" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs">
                  <option v-for="c in (selectedTpl.financial_rules?.allowed_currencies || ['USD','VES'])" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </template>

                  <!-- Payment context: credential fields + bank + vault -->
                  <template v-if="modalContext === 'payment'">
                    <!-- Credential fields from config_schema -->
                    <div v-for="f in (selectedTpl.config_schema?.fields || [])" :key="f.key" class="space-y-1">
                      <template v-if="['bank', 'bank_code'].includes(f.key) && availableBanks.length > 0">
                        <label class="block text-xs font-medium text-slate-600 mb-1">{{ f.label || 'Banco' }} <span v-if="f.required" class="text-red-500">*</span></label>
                        <select v-model="customInstance.configData[f.key]" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs">
                          <option value="">Seleccionar banco...</option>
                          <option v-for="b in availableBanks" :key="b.id" :value="b.name">{{ b.name }}</option>
                        </select>
                      </template>
                      <template v-else-if="f.type === 'boolean'">
                        <label class="block text-xs font-medium text-slate-600 mb-1.5">{{ f.label || f.key }}</label>
                        <div class="flex gap-4">
                          <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" :value="true" v-model="customInstance.configData[f.key]" class="w-3.5 h-3.5 text-cyan-600 focus:ring-cyan-500" />
                            <span class="text-xs text-slate-700">SI</span>
                          </label>
                          <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" :value="false" v-model="customInstance.configData[f.key]" class="w-3.5 h-3.5 text-cyan-600 focus:ring-cyan-500" />
                            <span class="text-xs text-slate-700">NO</span>
                          </label>
                        </div>
                      </template>
                      <template v-else-if="f.type === 'select' && f.options">
                        <label class="block text-xs font-medium text-slate-600 mb-1">{{ f.label || f.key }} <span v-if="f.required" class="text-red-500">*</span></label>
                        <select v-model="customInstance.configData[f.key]" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs">
                          <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                        </select>
                      </template>
                      <template v-else>
                        <label class="block text-xs font-medium text-slate-600 mb-1">{{ f.label || f.key }} <span v-if="f.required" class="text-red-500">*</span></label>
                        <input v-model="customInstance.configData[f.key]" :type="f.type === 'number' ? 'number' : 'text'"
                          :placeholder="f.placeholder || f.label || ''"
                          class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs" />
                      </template>
                    </div>
                    <!-- Vault selector -->
                    <div v-if="configVaults.length > 0">
                      <label class="block text-xs font-medium text-slate-600 mb-1">Gavetero asociado</label>
                      <select v-model="customInstance.bankCode" class="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs">
                        <option v-for="v in configVaults" :key="v.code" :value="v.code">{{ v.alias || v.name }}</option>
                      </select>
                    </div>
                  </template>
                </div>
                <div class="border-t px-5 py-3 flex items-center justify-between">
                  <button @click="goBackToStep1" class="h-8 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <ChevronLeft class="w-3.5 h-3.5" /> Regresar a Plantillas
                  </button>
                  <button @click="confirmAndSave" class="h-8 px-4 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700">{{ editingIndex >= 0 ? 'Guardar Cambios' : 'Confirmar y Guardar' }}</button>
                </div>
              </template>
            </div>
          </div>
        </Teleport>

        <!-- Step 5 -->
        <div v-if="step === 5" class="space-y-4">
          <div class="mb-4">
            <div class="flex items-center gap-2">
              <Zap class="w-7 h-7 text-cyan-600" />
              <h1 class="text-lg font-semibold text-slate-900">Tu Plan</h1>
            </div>
            <p class="text-sm mt-1 text-slate-500">Selecciona el plan ideal</p>
          </div>
          <div v-if="!filteredPlans.length && planOptions.length" class="text-center py-6 text-sm text-slate-400">
            No hay planes para el rubro seleccionado. Regresa y selecciona otro tipo de negocio.
          </div>
          <div class="space-y-2.5">
            <button v-for="plan in filteredPlans" :key="plan.ulid" @click="selectedPlanId = plan.ulid"
              class="w-full p-4 rounded-lg border text-left transition-all relative"
              :class="selectedPlanId === plan.ulid ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white'">
              <!-- Trial badge -->
              <div v-if="plan.config?.limits?.has_trial && plan.config?.limits?.trial_days"
                class="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-amber-500">
                {{ plan.config.limits.trial_days }} días gratis
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold"
                    :class="selectedPlanId === plan.ulid ? 'text-cyan-700' : 'text-slate-900'">
                    {{ plan.name }}
                  </p>
                  <p class="text-xs mt-0.5 text-slate-400">{{ plan.config?.module_slugs?.length || 0 }} módulos disponibles</p>
                  <!-- Toggle description -->
                  <button v-if="plan.description"
                    @click="(e) => togglePlanDetails(plan.ulid, e)"
                    class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                  >
                    <ChevronDown
                      class="w-3 h-3 transition-transform duration-200"
                      :style="{ transform: expandedPlans.has(plan.ulid) ? 'rotate(180deg)' : '' }"
                    />
                    {{ expandedPlans.has(plan.ulid) ? 'Ocultar detalles' : 'Ver detalles' }}
                  </button>
                  <div v-if="expandedPlans.has(plan.ulid) && plan.description"
                    class="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed"
                    v-html="plan.description">
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold"
                    :class="selectedPlanId === plan.ulid ? 'text-cyan-700' : 'text-slate-900'">
                    {{ plan.prices?.monthly?.amount === '0.00' ? 'Gratis' : '$' + plan.prices?.monthly?.amount }}
                  </span>
                  <span v-if="plan.prices?.monthly?.amount !== '0.00'" class="text-[10px] text-slate-400">/mes</span>
                  <span v-else class="text-[10px] text-slate-400">Siempre</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
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

    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
