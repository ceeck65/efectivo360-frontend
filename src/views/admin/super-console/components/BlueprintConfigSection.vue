<template>
  <div class="space-y-6">

    <!-- ── Stepper Header ── -->
    <div class="bg-white dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm px-6 py-4">
      <div class="flex items-center gap-0">
        <button @click="step = 1" class="flex items-center gap-3 group">
          <span :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300', step === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : step > 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700']">
            {{ step > 1 ? '✓' : '1' }}
          </span>
          <div class="text-left">
            <p class="text-[11px] font-semibold uppercase tracking-widest" :class="step === 1 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'">Paso 1</p>
            <p class="text-sm font-medium" :class="step === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'">Taller de Categorías</p>
          </div>
        </button>

        <div class="w-20 h-px mx-4" :class="step > 1 ? 'bg-emerald-400/50' : 'bg-slate-200 dark:bg-slate-700'" />

        <button @click="step = 2" class="flex items-center gap-3 group">
          <span :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300', step === 2 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700']">2</span>
          <div class="text-left">
            <p class="text-[11px] font-semibold uppercase tracking-widest" :class="step === 2 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'">Paso 2</p>
            <p class="text-sm font-medium" :class="step === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'">Ensamblaje de Negocios</p>
          </div>
        </button>

        <div class="flex-1" />
        <span class="text-xs text-slate-400 font-mono">{{ step }} / 2</span>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
      <RefreshCw class="w-5 h-5 animate-spin mr-2" /> Cargando datos del catálogo...
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- STEP 1                                       -->
    <!-- ════════════════════════════════════════════ -->
    <div v-show="step === 1 && !loading">
      <div class="grid grid-cols-12 gap-5">

        <!-- Left: categories from API -->
        <div class="col-span-4">
          <div class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Categorías</h3>
              <span class="text-[11px] text-slate-400 font-mono">{{ categories.length }}</span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[520px] overflow-y-auto">
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="selectedCategory = cat"
                class="w-full text-left px-4 py-3 transition-colors duration-150"
                :class="selectedCategory?.id === cat.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] border-l-2 border-transparent'"
              >
                <p class="text-sm font-medium" :class="selectedCategory?.id === cat.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-200'">{{ cat.name }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5 font-mono">{{ cat.code }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: MasterAttribute grid with selection -->
        <div class="col-span-8">
          <template v-if="selectedCategory">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedCategory.name }}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Selecciona los atributos que aplican a esta categoría</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 font-mono">{{ selectedCount }} / {{ masterAttributes.length }} seleccionados</span>
                <button
                  @click="attrSearch = ''"
                  class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >Limpiar filtro</button>
              </div>
            </div>

            <!-- Search -->
            <div class="relative mb-4">
              <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                v-model="attrSearch"
                type="text"
                placeholder="Buscar atributos..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
              />
            </div>

            <!-- Grid of attribute cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                v-for="attr in filteredMasterAttributes"
                :key="attr.id"
                @click="toggleAttributeSelection(attr.id)"
                class="relative text-left p-3 rounded-xl border transition-all duration-150"
                :class="isAttributeSelected(attr.id)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-white dark:bg-[#141824] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'"
              >
                <!-- Check indicator -->
                <div
                  class="absolute top-2 right-2 w-4 h-4 rounded-full transition-colors"
                  :class="isAttributeSelected(attr.id) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"
                >
                  <Check v-if="isAttributeSelected(attr.id)" class="w-3 h-3 text-white m-auto block" style="margin-top:2px" />
                </div>

                <span :class="['inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-2', typeBadgeClass(attr.attr_type)]">
                  {{ attr.type_display || attr.attr_type }}
                </span>

                <p class="text-sm font-medium text-slate-900 dark:text-slate-200 pr-5 truncate">{{ attr.label }}</p>
                <p class="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{{ attr.id }}</p>

                <div v-if="attr.unit" class="mt-1.5 inline-block text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                  {{ attr.unit }}
                </div>
              </button>
            </div>

            <div v-if="filteredMasterAttributes.length === 0" class="text-center py-16 text-sm text-slate-400 italic">
              {{ attrSearch ? 'Sin resultados para "' + attrSearch + '"' : 'No hay atributos maestros disponibles' }}
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-center h-64 text-sm text-slate-400">Selecciona una categoría para asignar atributos</div>
          </template>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          @click="saveStep1"
          :disabled="savingStep1"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          :class="savingStep1 ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
        >
          <RefreshCw v-if="savingStep1" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ savingStep1 ? 'Guardando...' : 'Guardar y continuar' }}
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- STEP 2                                       -->
    <!-- ════════════════════════════════════════════ -->
    <div v-show="step === 2 && !loading">
      <div class="grid grid-cols-12 gap-5">

        <div class="col-span-4">
          <div class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipos de Negocio</h3>
              <span class="text-[11px] text-slate-400 font-mono">{{ businessTypes.length }}</span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[520px] overflow-y-auto">
              <button
                v-for="bt in businessTypes"
                :key="bt.id"
                @click="selectedBusinessType = bt"
                class="w-full text-left px-4 py-3.5 transition-colors duration-150"
                :class="selectedBusinessType?.id === bt.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] border-l-2 border-transparent'"
              >
                <p class="text-sm font-medium" :class="selectedBusinessType?.id === bt.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-200'">{{ bt.name }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5 font-mono">{{ bt.code }}</p>
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-8">
          <template v-if="selectedBusinessType">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedBusinessType.name }}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Activa o desactiva categorías para este negocio</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 font-mono">{{ activeCategoryCount }} / {{ filteredCategoriesStep2.length }} activas</span>
                <button @click="catSearch = ''" class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">Limpiar filtro</button>
              </div>
            </div>

            <!-- Search -->
            <div class="relative mb-4">
              <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                v-model="catSearch"
                type="text"
                placeholder="Buscar categorías..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
              />
            </div>

            <!-- Grid of category cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                v-for="cat in filteredCategoriesStep2"
                :key="cat.id"
                @click="toggleCategory(cat.id)"
                class="relative text-left p-3.5 rounded-xl border transition-all duration-150"
                :class="isCategoryActive(cat.id)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-white dark:bg-[#141824] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'"
              >
                <!-- Check indicator -->
                <div
                  class="absolute top-2 right-2 w-4 h-4 rounded-full transition-colors"
                  :class="isCategoryActive(cat.id) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"
                >
                  <Check v-if="isCategoryActive(cat.id)" class="w-3 h-3 text-white m-auto block" style="margin-top:2px" />
                </div>

                <!-- Avatar initial -->
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-2"
                  :class="isCategoryActive(cat.id)
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
                >
                  {{ cat.name.charAt(0) }}
                </div>

                <p class="text-sm font-medium text-slate-900 dark:text-slate-200 pr-5 truncate">{{ cat.name }}</p>
                <p class="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{{ cat.code }}</p>
              </button>
            </div>

            <div v-if="filteredCategoriesStep2.length === 0" class="text-center py-16 text-sm text-slate-400 italic">
              {{ catSearch ? 'Sin resultados para "' + catSearch + '"' : 'No hay categorías disponibles' }}
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-center h-64 text-sm text-slate-400">Selecciona un tipo de negocio para gestionar su matriz de categorías</div>
          </template>
        </div>
      </div>

      <div class="flex items-center justify-between mt-6">
        <button @click="step = 1" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
          <ArrowLeft class="w-4 h-4" /> Anterior
        </button>
        <button
          v-if="selectedBusinessType"
          @click="saveMatrix"
          :disabled="savingStep2"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          :class="savingStep2 ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
        >
          <RefreshCw v-if="savingStep2" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ savingStep2 ? 'Guardando...' : 'Guardar Matriz de ' + selectedBusinessType.name }}
        </button>
      </div>
    </div>

    <!-- ── Modal shell ── -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ modalTitle }}</h3>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"><X class="w-4 h-4 text-slate-400" /></button>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ modalDescription }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">Cancelar</button>
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ArrowLeft, Save, X, RefreshCw, Search, Check } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ApiCategory {
  id: number;
  nombre: string;
  code: string;
  slug: string;
  icono: string;
  suggested_attributes: string[];
  dynamic_fields: any[];
  is_active: boolean;
  parent: { id: number; nombre: string } | null;
  children?: ApiCategory[];
}

interface MasterAttribute {
  id: string;
  label: string;
  attr_type: string;
  type_display: string;
  unit: string;
  options: string[];
  is_active: boolean;
  usage_count: number;
}

interface DisplayCategory {
  id: number;
  name: string;
  code: string;
}

interface BusinessType {
  id: number;
  name: string;
  code: string;
  icon?: string;
  description?: string;
  is_active?: boolean;
}

interface CategoryMapping {
  category_id: number;
  business_type_id: number;
  active: boolean;
}

// ─────────────────────────────────────────────
// Composables
// ─────────────────────────────────────────────
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const savingStep1 = ref(false);
const loading = ref(true);
const step = ref(1);
const attrSearch = ref('');
const catSearch = ref('');
const selectedCategory = ref<DisplayCategory | null>(null);
const selectedBusinessType = ref<BusinessType | null>(null);
const showModal = ref(false);
const modalTitle = ref('');
const modalDescription = ref('');

const categories = ref<DisplayCategory[]>([]);
const masterAttributes = ref<MasterAttribute[]>([]);

const businessTypes = ref<BusinessType[]>([]);

const categoryMappings = ref<CategoryMapping[]>([]);

// ─── Attribute-to-category selection state ───
// key = category_id, value = Set of MasterAttribute IDs
const categoryAttrSelections = ref<Record<number, Set<string>>>({});
const categorySuggestedAttrs = ref<Record<number, string[]>>({});

function getAttrSelection(catId: number): Set<string> {
  if (!categoryAttrSelections.value[catId]) {
    categoryAttrSelections.value[catId] = new Set<string>();
  }
  return categoryAttrSelections.value[catId];
}

function isAttributeSelected(attrId: string): boolean {
  if (!selectedCategory.value) return false;
  return getAttrSelection(selectedCategory.value.id).has(attrId);
}

function toggleAttributeSelection(attrId: string) {
  if (!selectedCategory.value) return;
  const s = getAttrSelection(selectedCategory.value.id);
  if (s.has(attrId)) s.delete(attrId);
  else s.add(attrId);
}

const selectedCount = computed(() => {
  if (!selectedCategory.value) return 0;
  return getAttrSelection(selectedCategory.value.id).size;
});

// ─────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────
const filteredMasterAttributes = computed(() => {
  if (!attrSearch.value.trim()) return masterAttributes.value;
  const q = attrSearch.value.toLowerCase();
  return masterAttributes.value.filter(a =>
    a.label.toLowerCase().includes(q) ||
    a.id.toLowerCase().includes(q) ||
    a.attr_type.toLowerCase().includes(q)
  );
});

const filteredCategoriesStep2 = computed(() => {
  if (!catSearch.value.trim()) return categories.value;
  const q = catSearch.value.toLowerCase();
  return categories.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q)
  );
});

const activeCategoryCount = computed(() => {
  if (!selectedBusinessType.value) return 0;
  return categoryMappings.value.filter(
    m => m.business_type_id === selectedBusinessType.value!.id && m.active
  ).length;
});

function isCategoryActive(categoryId: number): boolean {
  if (!selectedBusinessType.value) return false;
  const mapping = categoryMappings.value.find(
    m => m.category_id === categoryId && m.business_type_id === selectedBusinessType.value!.id
  );
  return mapping ? mapping.active : false;
}

// ─────────────────────────────────────────────
// Data loading
// ─────────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const [catRes, attrRes, bpRes] = await Promise.all([
      fetchApi<any>('/api/v1/categories/?page=1&page_size=100'),
      fetchApi<any>('/api/v1/admin/master-attributes/?page=1&page_size=100'),
      fetchApi<any>('/api/v1/industry-blueprints/?page=1&page_size=100'),
    ]);

    // Categories are paginated: { results: [...] }
    const catList: ApiCategory[] = catRes?.results || catRes || [];

    // Flatten hierarchy into a flat list (include children recursively)
    const flatCategories: DisplayCategory[] = [];
    const suggestions: Record<number, string[]> = {};
    const selections: Record<number, Set<string>> = {};

    function flatten(list: ApiCategory[]) {
      for (const item of list) {
        flatCategories.push({ id: item.id, name: item.nombre, code: item.code.toLowerCase() });

        // Pre-populate selections from suggested_attributes
        if (item.suggested_attributes?.length) {
          suggestions[item.id] = item.suggested_attributes;
          selections[item.id] = new Set(item.suggested_attributes);
        } else {
          suggestions[item.id] = [];
          selections[item.id] = new Set();
        }

        if (item.children && Array.isArray(item.children)) {
          flatten(item.children);
        }
      }
    }
    flatten(catList);

    categories.value = flatCategories;
    categorySuggestedAttrs.value = suggestions;
    categoryAttrSelections.value = selections;

    // Master attributes
    const attrList: MasterAttribute[] = attrRes?.results || attrRes || [];
    masterAttributes.value = attrList.filter(a => a.is_active !== false);

    // Business types from industry-blueprints
    const bpList: any[] = bpRes?.results || bpRes || [];
    businessTypes.value = bpList
      .filter((b: any) => b.is_active !== false)
      .map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        icon: b.icon || '',
        description: b.description || '',
      }));

    // Build categoryMappings from IndustryBlueprint.default_categories
    // default_categories stores category NAMES (case-insensitive match)
    const nameToId = new Map<string, number>();
    for (const cat of flatCategories) {
      nameToId.set(cat.name.toLowerCase(), cat.id);
    }

    const mappings: CategoryMapping[] = [];
    for (const bp of businessTypes.value) {
      const bpRaw = bpList.find((b: any) => b.id === bp.id);
      const savedNames: string[] = bpRaw?.default_categories || [];
      const matchedIds = new Set<number>();

      for (const savedName of savedNames) {
        const id = nameToId.get(savedName.toLowerCase());
        if (id != null) {
          matchedIds.add(id);
        }
      }

      for (const cat of flatCategories) {
        mappings.push({
          category_id: cat.id,
          business_type_id: bp.id,
          active: matchedIds.has(cat.id),
        });
      }
    }
    categoryMappings.value = mappings;
  } catch (e) {
    notifyError('Error al cargar datos del catálogo');
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// ─────────────────────────────────────────────
// Save Step 1 — attribute-to-category mapping
// ─────────────────────────────────────────────
async function saveStep1() {
  if (savingStep1.value) return;
  savingStep1.value = true;

  try {
    const promises = categories.value.map(async (cat) => {
      const selected = getAttrSelection(cat.id);
      const suggested = Array.from(selected);
      // TODO: Axios PATCH /api/v1/categories/{id}/
      await fetchApi(`/api/v1/categories/${cat.id}/`, {
        method: 'PATCH',
        data: { suggested_attributes: suggested },
      });
    });

    await Promise.all(promises);
    notifySuccess('Atributos guardados por categoría correctamente');
    step.value = 2;
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al guardar atributos');
    console.error(e);
  } finally {
    savingStep1.value = false;
  }
}

// ─────────────────────────────────────────────
// Toggle matrix
// ─────────────────────────────────────────────
function toggleCategory(categoryId: number) {
  if (!selectedBusinessType.value) return;
  const mapping = categoryMappings.value.find(
    m => m.category_id === categoryId && m.business_type_id === selectedBusinessType.value!.id
  );
  if (mapping) {
    mapping.active = !mapping.active;
  } else {
    categoryMappings.value.push({
      category_id: categoryId,
      business_type_id: selectedBusinessType.value!.id,
      active: true,
    });
  }
}

// ─────────────────────────────────────────────
// Save Step 2 — business-type-to-category mappings
// ─────────────────────────────────────────────
const savingStep2 = ref(false);

async function saveMatrix() {
  if (!selectedBusinessType.value || savingStep2.value) return;
  savingStep2.value = true;

  try {
    const activeMappings = categoryMappings.value.filter(
      m => m.business_type_id === selectedBusinessType.value!.id && m.active
    );
    const activeIds = new Set(activeMappings.map(m => m.category_id));

    // Map category IDs to names (IndustryBlueprint.default_categories stores names)
    const names = categories.value
      .filter(c => activeIds.has(c.id))
      .map(c => c.name);

    await fetchApi(`/api/v1/industry-blueprints/${selectedBusinessType.value.id}/`, {
      method: 'PATCH',
      data: { default_categories: names },
    });

    notifySuccess(`Matriz de ${selectedBusinessType.value.name} guardada correctamente`);
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al guardar matriz');
    console.error(e);
  } finally {
    savingStep2.value = false;
  }
}

// ─────────────────────────────────────────────
// Type badge styling
// ─────────────────────────────────────────────
function typeBadgeClass(type: string): string {
  const t = type.toLowerCase();
  const map: Record<string, string> = {
    text: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',
    number: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20',
    decimal: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20',
    select: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20',
    boolean: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20',
    date: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20',
    string: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',
  };
  return map[t] || 'text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
}

// Auto-select first category when data loads
watch(categories, (list) => {
  if (list.length > 0 && !selectedCategory.value) {
    selectedCategory.value = list[0];
  }
}, { immediate: false });

onMounted(loadData);
</script>
