<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Proveedores</h2>
        <p class="text-xs text-slate-500 mt-0.5">Gestión de proveedores de la tienda</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
        <Plus class="w-4 h-4" /> Nuevo Proveedor
      </button>
    </div>

    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input v-model="search" type="text" placeholder="Buscar por nombre o RIF..."
        class="w-full h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>

    <div v-if="loading" class="text-center py-16 text-slate-400"><Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando...</div>

    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre / Contacto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">RIF</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Teléfono</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Email</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Estado</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in filteredSuppliers" :key="s.id" class="hover:bg-slate-50/50" :class="{ 'opacity-50': !s.is_active }">
              <td class="px-4 py-3">
                <p class="font-medium text-slate-800">{{ s.name }}</p>
                <p v-if="s.contact_person" class="text-xs text-slate-400">{{ s.contact_person }}</p>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ s.rif }}</td>
              <td class="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{{ s.phone || '—' }}</td>
              <td class="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{{ s.email || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 text-xs" :class="s.is_active ? 'text-emerald-600' : 'text-slate-400'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="s.is_active ? 'bg-emerald-400' : 'bg-slate-300'" />
                  {{ s.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(s)" class="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Editar"><Pencil class="w-3.5 h-3.5" /></button>
                  <button @click="toggleActive(s)" class="p-1.5 rounded-md" :title="s.is_active ? 'Desactivar' : 'Activar'"
                    :class="s.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'">
                    <EyeOff v-if="s.is_active" class="w-3.5 h-3.5" />
                    <Eye v-else class="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredSuppliers.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400 italic">{{ search ? 'Sin resultados' : 'No hay proveedores' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-base font-semibold text-slate-800">{{ editing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h3>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100"><X class="w-4 h-4 text-slate-400" /></button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">RIF <span class="text-red-400">*</span></label>
              <RifInput v-model="form.rif" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Razón Social <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Nombre de la empresa"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Persona de Contacto</label>
              <input v-model="form.contact_person" type="text" placeholder="Vendedor o encargado"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <PhoneInput v-model="form.phone" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input v-model="form.email" type="email" placeholder="correo@..." class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.is_active" class="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/30" />
              <span class="text-xs text-slate-600">Proveedor activo</span>
            </label>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">Cancelar</button>
            <button @click="save" :disabled="saving || !form.rif.trim() || !form.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
              <Save v-if="!saving" class="w-4 h-4" /> <Loader2 v-else class="w-4 h-4 animate-spin" />
              {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, Search, Loader2, Pencil, Eye, EyeOff, Save, X } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import RifInput from '@/components/shared/RifInput.vue';
import PhoneInput from '@/components/shared/PhoneInput.vue';

interface Supplier { id: string; tenant_id: string; rif: string; name: string; contact_person: string; phone: string; email: string; is_active: boolean; }

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

const suppliers = ref<Supplier[]>([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const editing = ref<Supplier | null>(null);
const saving = ref(false);
const form = reactive({ rif: '', name: '', contact_person: '', phone: '', email: '', is_active: true });

const filteredSuppliers = computed(() => {
  if (!search.value.trim()) return suppliers.value;
  const q = search.value.toLowerCase();
  return suppliers.value.filter(s => s.name.toLowerCase().includes(q) || s.rif.toLowerCase().includes(q));
});

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/purchases/suppliers/?page_size=200');
    suppliers.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch { suppliers.value = []; }
  finally { loading.value = false; }
}

function openCreate() { editing.value = null; form.rif = ''; form.name = ''; form.contact_person = ''; form.phone = ''; form.email = ''; form.is_active = true; showModal.value = true; }
function openEdit(s: Supplier) { editing.value = s; form.rif = s.rif; form.name = s.name; form.contact_person = s.contact_person; form.phone = s.phone; form.email = s.email; form.is_active = s.is_active; showModal.value = true; }

async function save() {
  saving.value = true;
  try {
    const data = { rif: form.rif.trim(), name: form.name.trim(), contact_person: form.contact_person.trim(), phone: form.phone.trim(), email: form.email.trim(), is_active: form.is_active };
    if (editing.value) {
      await fetchApi(`/api/v1/purchases/suppliers/${editing.value.id}/`, { method: 'PATCH', data });
      success('Proveedor actualizado');
    } else {
      await fetchApi('/api/v1/purchases/suppliers/', { method: 'POST', data });
      success('Proveedor creado');
    }
    showModal.value = false; await loadData();
  } catch (e: any) { notifyError(e?.response?.data?.detail || e?.response?.data?.rif?.[0] || 'Error al guardar'); }
  finally { saving.value = false; }
}

async function toggleActive(s: Supplier) {
  await fetchApi(`/api/v1/purchases/suppliers/${s.id}/`, { method: 'PATCH', data: { is_active: !s.is_active } });
  s.is_active = !s.is_active; success(s.is_active ? 'Proveedor activado' : 'Proveedor desactivado');
}

onMounted(loadData);
</script>
