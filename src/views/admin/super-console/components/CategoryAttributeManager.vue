<template>
  <div v-if="categoryId" class="grid grid-cols-12 gap-5 animate-fade-in">
    <!-- ─── Left: Attribute Catalog ─── -->
    <div class="col-span-4">
      <div class="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">Catálogo de Atributos</h3>
          <span class="text-[10px] text-slate-400 font-mono">{{ availableAttrs.length }}</span>
        </div>
        <div class="p-2 border-b border-slate-100">
          <input
            v-model="attrSearch"
            type="text"
            placeholder="Buscar atributo..."
            class="w-full h-8 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
          <div
            v-for="attr in filteredAvailableAttrs"
            :key="attr.id"
            class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-700 truncate">{{ attr.label }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[10px] text-slate-400 font-mono">{{ attr.id }}</span>
                <span
                  class="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  :class="typeBadge(attr.attr_type)"
                >{{ attr.type_display || attr.attr_type }}</span>
              </div>
            </div>
            <button
              @click="assignAttribute(attr)"
              :disabled="isAssignedOrInherited(attr.id)"
              class="shrink-0 text-[10px] font-medium transition-colors flex items-center gap-1"
              :class="isAssignedOrInherited(attr.id)
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700 cursor-pointer'"
            >
              <Check v-if="isAssignedOrInherited(attr.id)" class="w-3 h-3" />
              <Plus v-else class="w-3 h-3" />
              {{ isAssignedOrInherited(attr.id) ? 'Asignado' : 'Asignar' }}
            </button>
          </div>
          <div v-if="filteredAvailableAttrs.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 italic">
            {{ attrSearch ? 'Sin resultados' : 'Todos los atributos asignados' }}
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Right: Inheritance Matrix ─── -->
    <div class="col-span-8 space-y-4">
      <template v-if="loadingAttrs" class="flex justify-center py-12">
        <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
      </template>
      <template v-else>
        <!-- Zone A: Inherited Attributes -->
        <div v-if="inheritedAttrs.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="h-px flex-1 bg-slate-100" />
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock class="w-3 h-3" /> Heredados
            </span>
            <div class="h-px flex-1 bg-slate-100" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="attr in inheritedAttrs"
              :key="attr.key"
              class="bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-3 flex items-center gap-3"
            >
              <Lock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-600">{{ attr.name }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  Heredado de: <span class="font-medium text-slate-500">{{ attr.inherited_from }}</span>
                </p>
              </div>
              <span
                class="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium"
                :class="typeBadge(attr.type)"
              >{{ attr.type }}</span>
            </div>
          </div>
        </div>

        <!-- Zone B: Own Attributes -->
        <div v-if="ownAttrs.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="h-px flex-1 bg-slate-100" />
            <span class="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Propios</span>
            <div class="h-px flex-1 bg-slate-100" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="attr in ownAttrs"
              :key="attr.key"
              class="bg-blue-50/50 border border-blue-100 rounded-xl px-3.5 py-3 flex items-center gap-3 group hover:shadow-sm transition-shadow"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-blue-800">{{ attr.name }}</p>
                <p class="text-[10px] text-blue-500 font-mono mt-0.5">{{ attr.key }}</p>
              </div>
              <span
                class="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700"
              >{{ attr.type }}</span>
              <button
                @click="removeAttribute(attr.key)"
                class="shrink-0 p-1 rounded-md text-blue-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Remover"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="inheritedAttrs.length === 0 && ownAttrs.length === 0" class="text-center py-12 text-sm text-slate-400 italic">
          Esta categoría no tiene atributos. Asigna desde el catálogo.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus, Check, Lock, Loader2, X } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface MasterAttr {
  id: string; label: string; attr_type: string;
  type_display?: string; unit?: string; is_active: boolean;
}
interface InheritedAttr {
  key: string; name: string; type: string;
  inherited_from: string; is_required: boolean;
}

const props = defineProps<{
  categoryId: number | null;
}>();

const emit = defineEmits<{
  attributesChanged: [];
}>();

const { fetchApi } = useApi();
const { error: notifyError } = useNotify();

const masterAttrs = ref<MasterAttr[]>([]);
const inheritedAttrs = ref<InheritedAttr[]>([]);
const ownAttrs = ref<InheritedAttr[]>([]);
const loadingAttrs = ref(false);
const attrSearch = ref('');
const busyKeys = ref(new Set<string>());

const availableAttrs = computed(() =>
  masterAttrs.value.filter(a => a.is_active !== false)
);

const filteredAvailableAttrs = computed(() => {
  if (!attrSearch.value.trim()) return availableAttrs.value;
  const q = attrSearch.value.toLowerCase();
  return availableAttrs.value.filter(a => a.id.includes(q) || a.label.toLowerCase().includes(q));
});

function isAssignedOrInherited(attrId: string): boolean {
  return inheritedAttrs.value.some(a => a.key === attrId) ||
         ownAttrs.value.some(a => a.key === attrId) ||
         busyKeys.value.has(attrId);
}

function typeBadge(type: string): string {
  const m: Record<string, string> = {
    text: 'text-blue-600 bg-blue-50',
    number: 'text-purple-600 bg-purple-50',
    decimal: 'text-purple-600 bg-purple-50',
    select: 'text-cyan-600 bg-cyan-50',
    boolean: 'text-amber-600 bg-amber-50',
    string: 'text-blue-600 bg-blue-50',
  };
  return m[type] || 'text-slate-500 bg-slate-100';
}

async function loadMasterAttrs() {
  try {
    const res = await fetchApi<any>('/api/v1/admin/master-attributes/?page_size=200');
    masterAttrs.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch { masterAttrs.value = []; }
}

async function loadCategoryAttrs() {
  if (!props.categoryId) return;
  loadingAttrs.value = true;
  try {
    const res = await fetchApi<any>(`/api/v1/catalog/smart-categories/${props.categoryId}/attributes/`);
    const all = Array.isArray(res) ? res : [];
    const mapped = all.map((a: any) => ({
      key: a.id,
      name: a.label,
      type: a.attr_type,
      inherited_from: 'self',
    }));
    inheritedAttrs.value = mapped.filter((a: any) => a.inherited_from !== 'self');
    ownAttrs.value = mapped.filter((a: any) => a.inherited_from === 'self');
  } catch {
    inheritedAttrs.value = [];
    ownAttrs.value = [];
  } finally { loadingAttrs.value = false; }
}

async function assignAttribute(attr: MasterAttr) {
  if (isAssignedOrInherited(attr.id)) return;
  busyKeys.value.add(attr.id);
  try {
    await fetchApi(`/api/v1/catalog/smart-categories/${props.categoryId}/assign-attribute/`, {
      method: 'POST',
      data: { id: attr.id },
    });
    await loadCategoryAttrs();
    emit('attributesChanged');
  } catch (e: any) {
    notifyError(e?.response?.data?.error || 'Error');
  } finally { busyKeys.value.delete(attr.id); }
}

async function removeAttribute(key: string) {
  busyKeys.value.add(key);
  try {
    await fetchApi(`/api/v1/catalog/smart-categories/${props.categoryId}/unassign-attribute/`, {
      method: 'POST',
      data: { id: key },
    });
    await loadCategoryAttrs();
    emit('attributesChanged');
  } catch (e: any) {
    notifyError(e?.response?.data?.error || 'Error');
  } finally { busyKeys.value.delete(key); }
}

watch(() => props.categoryId, (id) => {
  if (id) {
    loadCategoryAttrs();
    if (masterAttrs.value.length === 0) loadMasterAttrs();
  } else {
    inheritedAttrs.value = [];
    ownAttrs.value = [];
  }
}, { immediate: true });
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.2s ease-out; }
</style>
