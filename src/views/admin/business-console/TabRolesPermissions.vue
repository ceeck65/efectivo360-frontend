<template>
  <div class="space-y-5">
    <!-- Tab Switcher -->
    <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      <button @click="activeTab = 'equipo'"
        class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
        :class="activeTab === 'equipo' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
        <Users class="w-3.5 h-3.5 inline mr-1.5" />
        Equipo
      </button>
      <button @click="activeTab = 'cajas'"
        class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
        :class="activeTab === 'cajas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
        <Monitor class="w-3.5 h-3.5 inline mr-1.5" />
        Cajas
      </button>
    </div>

    <!-- ============ TAB EQUIPO ============ -->
    <template v-if="activeTab === 'equipo'">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-slate-800">Gestión de Equipo</h3>
          <p class="text-xs text-slate-500 mt-0.5">Administra los accesos de tus empleados, asigna roles y gestiona sus permisos de caja</p>
        </div>
        <button @click="openAddModal"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm">
          <Plus class="w-4 h-4" />
          Agregar Miembro
        </button>
      </div>

      <!-- Loading -->
      <div v-if="fetching" class="flex items-center justify-center py-12">
        <Loader2 class="w-6 h-6 animate-spin text-slate-300" />
      </div>

      <!-- Empty -->
      <div v-else-if="members.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <Users class="w-10 h-10 mb-3 text-slate-300" />
        <p class="text-sm font-medium">No hay miembros en el equipo</p>
        <p class="text-xs mt-1">Agrega miembros para comenzar a gestionar tu equipo</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo Electrónico</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="member in members" :key="member.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0">
                    {{ initials(member.first_name, member.last_name) }}
                  </div>
                  <span class="text-slate-800 font-medium">{{ member.first_name }} {{ member.last_name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-500">{{ member.email }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="roleBadgeClass(member.role)">
                  {{ roleLabel(member.role) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="confirmRemove(member)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar de la tienda">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ============ TAB CAJAS ============ -->
    <template v-if="activeTab === 'cajas'">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-slate-800">Gestión de Cajas</h3>
          <p class="text-xs text-slate-500 mt-0.5">Administra las cajas registradoras de tu tienda</p>
        </div>
        <button @click="openAddCajaModal"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm">
          <Plus class="w-4 h-4" />
          Nueva Caja
        </button>
      </div>

      <!-- Loading -->
      <div v-if="fetchingCajas" class="flex items-center justify-center py-12">
        <Loader2 class="w-6 h-6 animate-spin text-slate-300" />
      </div>

      <!-- Empty -->
      <div v-else-if="cajas.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <Monitor class="w-10 h-10 mb-3 text-slate-300" />
        <p class="text-sm font-medium">No hay cajas registradas</p>
        <p class="text-xs mt-1">Crea una nueva caja para comenzar</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="caja in cajas" :key="caja.id"
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Monitor class="w-5 h-5 text-blue-600" />
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
              :class="caja.status === 'OPEN'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'">
              <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                :class="caja.status === 'OPEN' ? 'bg-amber-500' : 'bg-emerald-500'" />
              {{ caja.status === 'OPEN' ? 'Ocupada' : 'Disponible' }}
            </span>
          </div>
          <h4 class="text-sm font-semibold text-slate-800">{{ caja.name }}</h4>
        </div>
      </div>
    </template>

    <!-- ============ MODAL: Add Member ============ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeAddModal" />
        <div class="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div class="shrink-0 px-6 py-4 border-b border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">
              {{ formStep === 'form' ? 'Agregar Miembro al Equipo' : 'Credenciales de Acceso' }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ formStep === 'form' ? 'Completa los datos del nuevo miembro' : 'Comparte estas credenciales con el nuevo miembro' }}
            </p>
          </div>

          <!-- Step 1: Form -->
          <div v-if="formStep === 'form'" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5">Nombre Completo</label>
              <input v-model="form.full_name" type="text" placeholder="Ej: María Pérez"
                class="w-full h-10 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
              <input v-model="form.email" type="email" placeholder="Ej: maria@ejemplo.com"
                class="w-full h-10 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-2">Rol</label>
              <div class="grid grid-cols-3 gap-2.5">
                <button v-for="role in roleOptions" :key="role.value" type="button"
                  @click="form.role = role.value"
                  class="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150"
                  :class="form.role === role.value
                    ? role.selectedBorder
                    : 'border-slate-200 bg-white hover:border-slate-300'">
                  <div v-html="role.icon" class="w-8 h-8" />
                  <span class="text-xs font-medium text-slate-700">{{ role.label }}</span>
                  <div v-if="form.role === role.value"
                    class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    :class="role.checkBg">
                    <Check class="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-2">
                Asignación de Cajas <span class="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div v-if="fetchingRegisters" class="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                Cargando cajas...
              </div>
              <div v-else-if="registers.length === 0" class="text-xs text-slate-400 py-2">
                No hay cajas disponibles
              </div>
              <div v-else class="flex flex-wrap gap-2">
                <button v-for="reg in registers" :key="reg.id" type="button"
                  @click="toggleRegister(reg.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  :class="selectedRegisters.has(reg.id)
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">
                  <Check v-if="selectedRegisters.has(reg.id)" class="w-3 h-3" />
                  <Monitor class="w-3.5 h-3.5" />
                  {{ reg.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Credentials -->
          <div v-else class="flex-1 overflow-y-auto px-6 py-8 space-y-5">
            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle class="w-7 h-7 text-emerald-600" />
              </div>
              <h3 class="text-base font-semibold text-slate-800">Miembro Agregado</h3>
              <p class="text-xs text-slate-500 mt-1 max-w-xs">
                El usuario ha sido creado exitosamente. Comparte las siguientes credenciales con
                <strong class="text-slate-700">{{ form.full_name }}</strong>
              </p>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Usuario</label>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-mono font-semibold text-slate-800">{{ credentials.email || form.email }}</span>
                  <button @click="copyText(credentials.email || form.email)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copiar">
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="border-t border-slate-200 pt-3">
                <label class="block text-xs font-medium text-slate-500 mb-1">Contraseña Temporal</label>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-mono font-semibold text-slate-800 tracking-wider">{{ credentials.password }}</span>
                  <button @click="copyText(credentials.password)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copiar">
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <button @click="copyAllCredentials"
              class="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm">
              <Copy class="w-4 h-4" />
              Copiar Credenciales
            </button>
            <p class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Asegúrate de copiar la contraseña ahora. No podrás verla nuevamente.
            </p>
          </div>

          <div class="shrink-0 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button v-if="formStep === 'form'" @click="closeAddModal"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button v-if="formStep === 'form'" @click="submitMember" :disabled="!isFormValid || saving"
              class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl flex items-center gap-2 transition-colors shadow-sm">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              {{ saving ? 'Agregando...' : 'Agregar Miembro' }}
            </button>
            <button v-else @click="closeAddModal"
              class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm">
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============ MODAL: Nueva Caja ============ -->
    <Teleport to="body">
      <div v-if="showAddCajaModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeAddCajaModal" />
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">Nueva Caja</h2>
            <p class="text-xs text-slate-500 mt-0.5">Ingresa el nombre de la nueva caja registradora</p>
          </div>
          <div class="px-6 py-5">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Nombre de la Caja</label>
            <input v-model="cajaName" type="text" placeholder="Ej: Caja Principal"
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              @keyup.enter="submitCaja" />
          </div>
          <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button @click="closeAddCajaModal"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button @click="submitCaja" :disabled="!cajaName.trim() || savingCaja"
              class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl flex items-center gap-2 transition-colors shadow-sm">
              <Loader2 v-if="savingCaja" class="w-4 h-4 animate-spin" />
              {{ savingCaja ? 'Creando...' : 'Crear Caja' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, Loader2, Users, Check, CheckCircle, Trash2, Copy, Monitor } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useAlert } from '@/composables/useAlert';
import { useNotify } from '@/composables/useNotify';

interface TeamMember {
  id: number;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'CAJERO';
  is_active: boolean;
}

interface CashRegisterOption {
  id: string;
  name: string;
  is_locked_by_user: boolean;
}

interface CashRegisterItem {
  id: string;
  name: string;
  status: string;
}

interface CreateMemberResponse {
  id: number;
  user_id: number;
  role: string;
  user_created: boolean;
  password?: string;
  email?: string;
}

const { fetchApi } = useApi();
const { showConfirm } = useAlert();
const { success, error: notifyError } = useNotify();

const activeTab = ref<'equipo' | 'cajas'>('equipo');

// --- Equipo ---
const members = ref<TeamMember[]>([]);
const fetching = ref(true);

const showAddModal = ref(false);
const saving = ref(false);
const formStep = ref<'form' | 'credentials'>('form');

const form = reactive({
  full_name: '',
  email: '',
  role: 'CAJERO' as 'ADMIN' | 'SUPERVISOR' | 'CAJERO',
});

const credentials = reactive({
  email: '',
  password: '',
});

const isFormValid = computed(() =>
  form.full_name.trim().length > 0
  && form.email.trim().length > 0
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  && form.role
);

const registers = ref<CashRegisterOption[]>([]);
const fetchingRegisters = ref(false);
const selectedRegisters = ref(new Set<string>());

// --- Cajas ---
const cajas = ref<CashRegisterItem[]>([]);
const fetchingCajas = ref(true);

const showAddCajaModal = ref(false);
const savingCaja = ref(false);
const cajaName = ref('');

const roleOptions = [
  {
    value: 'CAJERO' as const,
    label: 'Cajero',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-purple-600"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    selectedBorder: 'border-purple-500 bg-purple-50/40',
    checkBg: 'bg-purple-500',
  },
  {
    value: 'SUPERVISOR' as const,
    label: 'Supervisor',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-blue-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    selectedBorder: 'border-blue-500 bg-blue-50/40',
    checkBg: 'bg-blue-500',
  },
  {
    value: 'ADMIN' as const,
    label: 'Administrador',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-emerald-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    selectedBorder: 'border-emerald-500 bg-emerald-50/40',
    checkBg: 'bg-emerald-500',
  },
];

function initials(first: string, last: string): string {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
}

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    SUPERVISOR: 'bg-blue-100 text-blue-700 border-blue-200',
    CAJERO: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return map[role] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    CAJERO: 'Cajero',
  };
  return labels[role] || role;
}

function toggleRegister(id: string) {
  if (selectedRegisters.value.has(id)) {
    selectedRegisters.value.delete(id);
  } else {
    selectedRegisters.value.add(id);
  }
}

// --- Fetch: Members ---
async function fetchMembers() {
  fetching.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/team/manage/', { method: 'GET' });
    members.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    members.value = [];
  } finally {
    fetching.value = false;
  }
}

// --- Fetch: Registers for assignment ---
async function fetchRegisters() {
  fetchingRegisters.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/pos-terminals/', { method: 'GET' });
    registers.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    registers.value = [];
  } finally {
    fetchingRegisters.value = false;
  }
}

// --- Fetch: Cajas for grid ---
async function fetchCajas() {
  fetchingCajas.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/pos-terminals/', { method: 'GET' });
    cajas.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    cajas.value = [];
  } finally {
    fetchingCajas.value = false;
  }
}

// --- Add Member ---
function openAddModal() {
  form.full_name = '';
  form.email = '';
  form.role = 'CAJERO';
  formStep.value = 'form';
  selectedRegisters.value = new Set();
  credentials.email = '';
  credentials.password = '';
  showAddModal.value = true;
  fetchRegisters();
}

function closeAddModal() {
  showAddModal.value = false;
  formStep.value = 'form';
}

async function submitMember() {
  if (!isFormValid.value) return;
  saving.value = true;
  try {
    const parts = form.full_name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || firstName;
    const payload: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      email: form.email.trim(),
      role: form.role,
    };
    if (selectedRegisters.value.size > 0) {
      payload.terminals = Array.from(selectedRegisters.value);
    }
    const res = await fetchApi<CreateMemberResponse>('/api/v1/team/manage/', {
      method: 'POST',
      data: payload,
    });
    if (res.user_created && res.password) {
      credentials.email = res.email || form.email;
      credentials.password = res.password;
      formStep.value = 'credentials';
    } else {
      success('Miembro agregado exitosamente');
      closeAddModal();
      await fetchMembers();
    }
  } catch (e: any) {
    notifyError(e?.message || 'Error al agregar miembro');
  } finally {
    saving.value = false;
  }
}

async function confirmRemove(member: TeamMember) {
  const confirmed = await showConfirm(
    `Eliminar a ${member.first_name} ${member.last_name}`,
    `El usuario ${member.email} será desactivado de la tienda. Podrás reactivarlo después.`,
    'Sí, eliminar',
  );
  if (!confirmed) return;
  try {
    await fetchApi(`/api/v1/team/manage/${member.id}/`, { method: 'DELETE' });
    success(`${member.first_name} ${member.last_name} fue eliminado del equipo`);
    members.value = members.value.filter(m => m.id !== member.id);
  } catch (e: any) {
    if (e.status === 409) {
      notifyError(`No se puede eliminar a ${member.first_name} porque tiene un turno de caja abierto. Debe cerrar su turno primero.`);
    } else {
      notifyError(e?.message || 'Error al eliminar miembro');
    }
  }
}

// --- Add Caja ---
function openAddCajaModal() {
  cajaName.value = '';
  showAddCajaModal.value = true;
}

function closeAddCajaModal() {
  showAddCajaModal.value = false;
}

async function submitCaja() {
  if (!cajaName.value.trim() || savingCaja.value) return;
  savingCaja.value = true;
  try {
    await fetchApi('/api/v1/pos-terminals/', {
      method: 'POST',
      data: { name: cajaName.value.trim() },
    });
    success('Caja creada exitosamente');
    closeAddCajaModal();
    await fetchCajas();
  } catch (e: any) {
    notifyError(e?.message || 'Error al crear la caja');
  } finally {
    savingCaja.value = false;
  }
}

// --- Clipboard ---
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    success('Copiado al portapapeles');
  } catch {
    notifyError('No se pudo copiar automáticamente');
  }
}

async function copyAllCredentials() {
  const text = `Usuario: ${credentials.email || form.email}\nContraseña: ${credentials.password}`;
  try {
    await navigator.clipboard.writeText(text);
    success('Credenciales copiadas al portapapeles');
  } catch {
    notifyError('No se pudo copiar automáticamente');
  }
}

onMounted(() => {
  fetchMembers();
  fetchCajas();
});
</script>
