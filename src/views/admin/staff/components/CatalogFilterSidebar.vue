<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[70]">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="$emit('close')" />
      <div class="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <!-- Header -->
        <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-slate-500" />
            <h3 class="text-sm font-bold text-slate-800">Filtros</h3>
            <span v-if="activeCount > 0" class="w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">{{ activeCount }}</span>
          </div>
          <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <!-- Search -->
        <div class="shrink-0 px-4 py-3 border-b border-slate-100">
          <div class="relative">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input v-model="searchQuery" type="text" placeholder="Buscar categoría o marca..."
              class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-400" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12 text-slate-400">
            <Loader2 class="w-4 h-4 animate-spin mr-2" /> Cargando filtros...
          </div>

          <template v-else>
            <!-- Categories -->
            <div class="px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Categorías <span class="text-slate-400 font-normal">({{ allCategories.length }})</span>
                </h4>
                <button v-if="selectedCategories.size > 0" @click="selectedCategories.clear(); selectedBrands.clear(); emitUpdate()" class="text-[10px] text-cyan-600 hover:text-cyan-700 font-medium">Limpiar</button>
              </div>
              <div class="space-y-0.5 max-h-60 overflow-y-auto">
                <div v-for="cat in filteredCategories" :key="cat.id"
                  class="flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group"
                  :style="{ paddingLeft: 8 + (cat.depth || 0) * 16 + 'px' }"
                  :class="selectedCategories.has(cat.id) ? 'bg-cyan-50' : 'hover:bg-slate-50'">
                  <button v-if="cat.hasChildren" @click.stop="toggleExpand(cat.id)"
                    class="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 transition-colors">
                    <ChevronRight class="w-3 h-3 text-slate-400 transition-transform"
                      :class="expandedIds.has(cat.id) ? 'rotate-90' : ''" />
                  </button>
                  <span v-else class="shrink-0 w-4" />
                  <label class="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                    <input type="checkbox" :checked="selectedCategories.has(cat.id)" @change="toggleCategory(cat.id)"
                      class="w-3.5 h-3.5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500/30" />
                    <span v-if="cat.icon" class="text-sm leading-none shrink-0">{{ cat.icon }}</span>
                    <span class="text-xs text-slate-700 truncate">{{ cat.name }}</span>
                  </label>
                </div>
                <p v-if="filteredCategories.length === 0" class="text-[11px] text-slate-400 py-2 text-center">Sin resultados</p>
              </div>
            </div>

            <div class="h-px bg-slate-100 mx-4" />

            <!-- Brands (filtered by selected categories) -->
            <div class="px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Marcas <span class="text-slate-400 font-normal">({{ visibleBrands.length }})</span>
                </h4>
                <button v-if="selectedBrands.size > 0" @click="selectedBrands.clear(); emitUpdate()" class="text-[10px] text-cyan-600 hover:text-cyan-700 font-medium">Limpiar</button>
              </div>
              <div v-if="selectedCategories.size > 0 && visibleBrands.length === 0" class="text-[11px] text-slate-400 py-2 text-center">
                No hay marcas para estas categorías
              </div>
              <div v-else class="space-y-0.5 max-h-60 overflow-y-auto">
                <label v-for="brand in filteredBrands" :key="brand.id"
                  class="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                  :class="selectedBrands.has(brand.id) ? 'bg-cyan-50' : 'hover:bg-slate-50'">
                  <input type="checkbox" :checked="selectedBrands.has(brand.id)" @change="toggleBrand(brand.id)"
                    class="w-3.5 h-3.5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500/30" />
                  <span class="text-xs text-slate-700 truncate">{{ brand.name }}</span>
                </label>
                <p v-if="filteredBrands.length === 0 && selectedCategories.size === 0" class="text-[11px] text-slate-400 py-2 text-center">
                  Selecciona categorías para ver marcas
                </p>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="shrink-0 px-4 py-3 border-t border-slate-200 flex gap-2">
          <button @click="clearAll" class="flex-1 h-9 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Limpiar todo
          </button>
          <button @click="$emit('close')" class="flex-1 h-9 text-xs font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { X, Search, SlidersHorizontal, Loader2, ChevronRight } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useCatalogCache } from '@/composables/useCatalogCache';

interface CategoryItem { id: number; name: string; icon?: string; code?: string; depth?: number; parentId?: number | null; hasChildren?: boolean; }
interface BrandItem { id: string; name: string; smart_categories?: { id: number; name: string; code: string }[]; }

interface Props {
  visible: boolean;
  initialCategories?: number[];
  initialBrands?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  initialCategories: () => [],
  initialBrands: () => [],
});

const emit = defineEmits<{
  close: [];
  update: [filters: { categoryIds: number[]; brandIds: string[] }];
}>();

const { fetchApi } = useApi();
const { fetchWithCache } = useCatalogCache();

const searchQuery = ref('');
const loading = ref(false);
const allCategories = ref<CategoryItem[]>([]);
const allBrands = ref<BrandItem[]>([]);
const selectedCategories = ref(new Set<number>(props.initialCategories));
const selectedBrands = ref(new Set<string>(props.initialBrands));
const expandedIds = ref(new Set<number>());

watch(() => props.visible, (v) => {
  if (v) {
    selectedCategories.value = new Set(props.initialCategories);
    selectedBrands.value = new Set(props.initialBrands);
    searchQuery.value = '';
    expandedIds.value = new Set();
  }
});

const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (q) {
    return allCategories.value.filter(c => c.name.toLowerCase().includes(q));
  }
  return allCategories.value.filter(c => {
    if (!c.depth || c.depth === 0) return true;
    let parentId = c.parentId;
    while (parentId) {
      if (!expandedIds.value.has(parentId)) return false;
      const parent = allCategories.value.find(p => p.id === parentId);
      parentId = parent?.parentId ?? null;
    }
    return true;
  });
});

function toggleExpand(id: number) {
  const s = new Set(expandedIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedIds.value = s;
}

const visibleBrands = computed(() => {
  if (selectedCategories.value.size === 0) return allBrands.value;
  return allBrands.value.filter(b => {
    if (!b.smart_categories?.length) return false;
    return b.smart_categories.some(sc => selectedCategories.value.has(sc.id));
  });
});

const filteredBrands = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return visibleBrands.value.filter(b => !q || b.name.toLowerCase().includes(q));
});

const activeCount = computed(() => selectedCategories.value.size + selectedBrands.value.size);

watch(searchQuery, (q) => {
  if (!q) return;
  const lower = q.toLowerCase();
  const toExpand = new Set<number>();
  for (const cat of allCategories.value) {
    if (cat.name.toLowerCase().includes(lower) && cat.parentId) {
      let pid: number | undefined = cat.parentId;
      while (pid) {
        toExpand.add(pid);
        const parent = allCategories.value.find(p => p.id === pid);
        pid = parent?.parentId ?? undefined;
      }
    }
  }
  if (toExpand.size) {
    const s = new Set(expandedIds.value);
    toExpand.forEach(id => s.add(id));
    expandedIds.value = s;
  }
});

function toggleCategory(id: number) {
  const s = new Set(selectedCategories.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedCategories.value = s;
  selectedBrands.value = new Set();
  emitUpdate();
}

function toggleBrand(id: string) {
  const s = new Set(selectedBrands.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedBrands.value = s;
  emitUpdate();
}

function clearAll() {
  selectedCategories.value = new Set();
  selectedBrands.value = new Set();
  emitUpdate();
}

function emitUpdate() {
  emit('update', {
    categoryIds: Array.from(selectedCategories.value),
    brandIds: Array.from(selectedBrands.value),
  });
}

async function loadFilters() {
  loading.value = true;
  try {
    const [catRes, brandRes] = await Promise.all([
      fetchWithCache('catalog:categories', () => fetchApi<any>('/api/v1/catalog/categories/?page_size=500')),
      fetchWithCache('catalog:brands:all', () => fetchApi<any>('/api/v1/catalog/brands/all/')),
    ]);
    const catList = catRes?.results || (Array.isArray(catRes) ? catRes : []);
    const flat: CategoryItem[] = [];
    function walk(nodes: any[], depth: number, parentId: number | null) {
      for (const n of nodes) {
        const hasChildren = !!(n.children?.length);
        flat.push({ id: n.id, name: n.name, icon: n.icon || '', code: n.code || '', depth, parentId, hasChildren });
        if (hasChildren) walk(n.children, depth + 1, n.id);
      }
    }
    walk(catList, 0, null);
    allCategories.value = flat;
    const brandList = Array.isArray(brandRes) ? brandRes : [];
    allBrands.value = brandList.map((b: any) => ({ id: b.id || b.pk, name: b.name, smart_categories: b.smart_categories || [] }));
  } catch {
    allCategories.value = [];
    allBrands.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => { if (props.visible) loadFilters(); });
watch(() => props.visible, (v) => { if (v && allCategories.value.length === 0) loadFilters(); });
</script>

<style scoped>
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-right { animation: slide-in-right 0.2s ease-out; }
</style>
