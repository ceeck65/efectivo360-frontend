<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Gestión de Usuarios {{ isStaffUser ? 'ERP' : 'de Tienda' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ isStaffUser 
            ? 'Crear, editar y administrar usuarios del sistema ERP' 
            : 'Crear, editar y administrar usuarios de tu tienda' }}
        </p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Plus class="h-4 w-4" />
        Nuevo Usuario
      </button>
    </div>

    <!-- Card with Users Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Users class="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Usuarios ({{ users.length }})
            </h3>
          </div>
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar usuarios..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Usuario</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Rol</th>
              <th v-if="isStaffUser" class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <!-- Loading State -->
            <tr v-if="loading">
              <td :colspan="isStaffUser ? 6 : 5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                Cargando usuarios...
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredUsers.length === 0">
              <td :colspan="isStaffUser ? 6 : 5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                No se encontraron usuarios
              </td>
            </tr>

            <!-- Users List -->
            <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-slate-50/30 dark:hover:bg-[#1a1f2e]/30 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900 dark:text-white">{{ u.username }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ u.email }}</div>
              </td>
              <td class="px-6 py-4">
                {{ u.first_name }} {{ u.last_name }}
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white', getRoleColor(u.role)]">
                  {{ getRoleLabel(u.role) }}
                </span>
              </td>
              <td v-if="isStaffUser" class="px-6 py-4">
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  isErpUser(u) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                ]">
                  {{ isErpUser(u) ? 'ERP' : 'Tienda' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button
                    @click="handleToggleActive(u.id, u.is_active)"
                    :class="[
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      u.is_active ? 'bg-green-600' : 'bg-slate-200'
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                        u.is_active ? 'translate-x-5' : 'translate-x-1'
                      ]"
                    />
                  </button>
                  <span class="text-sm text-slate-600 dark:text-slate-400">
                    {{ u.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="openPermissionsDialog(u)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all dark:hover:text-slate-300 dark:hover:bg-[#1a1f2e]"
                    title="Gestionar permisos"
                  >
                    <Key class="h-4 w-4" />
                  </button>
                  <button
                    @click="openEdit(u)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all dark:hover:text-slate-300 dark:hover:bg-[#1a1f2e]"
                    title="Editar"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(u.id, u.role)"
                    :disabled="u.role === 'OWNER' || u.role === 'SUPER_ADMIN'"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all dark:hover:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ editingUser 
              ? 'Modifique los datos del usuario' 
              : 'Complete los datos para crear un nuevo usuario' }}
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre de usuario *</label>
              <input
                v-model="formData.username"
                type="text"
                placeholder="usuario123"
                :disabled="!!editingUser"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Correo electrónico *</label>
              <input
                v-model="formData.email"
                type="email"
                placeholder="usuario@email.com"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre</label>
              <input
                v-model="formData.first_name"
                type="text"
                placeholder="Juan"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Apellido</label>
              <input
                v-model="formData.last_name"
                type="text"
                placeholder="Pérez"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Rol *</label>
            <select
              v-model="formData.role"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option value="">Seleccione un rol</option>
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }} - {{ role.description }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
              Contraseña {{ editingUser ? '(dejar en blanco para mantener actual)' : '*' }}
            </label>
            <input
              v-model="formData.password"
              type="password"
              :placeholder="editingUser ? '••••••••' : 'Ingrese contraseña'"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              @click="formData.is_active = !formData.is_active"
              :class="[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                formData.is_active ? 'bg-green-600' : 'bg-slate-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                  formData.is_active ? 'translate-x-5' : 'translate-x-1'
                ]"
              />
            </button>
            <label class="text-sm text-slate-700 dark:text-slate-300">Usuario activo</label>
          </div>
        </div>

        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button
            @click="showForm = false"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            <X class="h-4 w-4" />
            Cancelar
          </button>
          <button
            @click="handleSave"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Check class="h-4 w-4" />
            {{ editingUser ? 'Guardar Cambios' : 'Crear Usuario' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Permissions Modal -->
    <div v-if="showPermissions" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <div class="flex items-center gap-2">
            <Key class="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Gestionar Permisos</h3>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Usuario: <strong>{{ selectedUserForPermissions?.username }}</strong> ({{ selectedUserForPermissions?.email }})
          </p>
        </div>

        <div class="p-6 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ selectedPermissions.length }} permisos seleccionados
            </span>
            <div class="flex gap-2">
              <button
                @click="selectedPermissions = availablePermissions.map(p => p.code)"
                class="text-xs px-3 py-1 text-slate-700 border border-slate-200 rounded hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
              >
                Seleccionar todos
              </button>
              <button
                @click="selectedPermissions = []"
                class="text-xs px-3 py-1 text-slate-700 border border-slate-200 rounded hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div v-if="availablePermissions.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
            No hay permisos disponibles
          </div>

          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg p-4 dark:border-white/[0.06]">
            <div
              v-for="perm in availablePermissions"
              :key="perm.code"
              @click="handlePermissionToggle(perm.code)"
              class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors dark:hover:bg-[#1a1f2e]"
            >
              <input
                type="checkbox"
                :checked="selectedPermissions.includes(perm.code)"
                class="mt-1 h-4 w-4"
                @click.stop
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900 dark:text-white">{{ perm.name }}</p>
                <p class="text-xs text-slate-500 font-mono dark:text-slate-400">{{ perm.code }}</p>
                <p v-if="perm.description" class="text-xs text-slate-500 mt-1 dark:text-slate-400">{{ perm.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button
            @click="showPermissions = false"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            <X class="h-4 w-4" />
            Cancelar
          </button>
          <button
            @click="handleSavePermissions"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Check class="h-4 w-4" />
            Guardar Permisos
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista de gestión de usuarios de Staff
 * @module @modules/users/views/StaffUsersView
 */
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { User, UserRole, RoleOption, PermissionDefinition } from '../types';
import { Plus, Users, Search, X, Check, Pencil, Trash2, Key } from 'lucide-vue-next';

// =============================================================================
// CONSTANTS
// =============================================================================

const TENANT_ROLE_OPTIONS: RoleOption[] = [
  { value: 'OWNER', label: 'Dueño', color: 'bg-amber-500', description: 'Acceso total a la tienda' },
  { value: 'MANAGER', label: 'Gerente', color: 'bg-blue-500', description: 'Gestión de operaciones y equipo' },
  { value: 'SALES_CLERK', label: 'Vendedor', color: 'bg-green-500', description: 'Ventas y atención al cliente' },
  { value: 'WAREHOUSE', label: 'Almacén', color: 'bg-purple-500', description: 'Inventario y logística' },
];

const ERP_ROLE_OPTIONS: RoleOption[] = [
  { value: 'ADMIN', label: 'Administrador ERP', color: 'bg-red-600', description: 'Administrador del sistema ERP' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-rose-700', description: 'Super administrador con acceso total' },
  { value: 'ERP_SUPERVISOR', label: 'Supervisor ERP', color: 'bg-orange-500', description: 'Supervisor de operaciones ERP' },
  { value: 'SUPPORT_ATC', label: 'Soporte ATC', color: 'bg-cyan-500', description: 'Atención al cliente y soporte comercial' },
  { value: 'SUPPORT_TECH', label: 'Soporte Técnico', color: 'bg-indigo-500', description: 'Soporte técnico y resolución de incidencias' },
];

// =============================================================================
// STATE
// =============================================================================

const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const users = ref<User[]>([]);
const loading = ref(true);
const search = ref('');
const showForm = ref(false);
const editingUser = ref<User | null>(null);
const showPermissions = ref(false);
const selectedUserForPermissions = ref<User | null>(null);
const selectedPermissions = ref<string[]>([]);
const availablePermissions = ref<PermissionDefinition[]>([]);

const formData = ref({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: authStore.user?.is_staff ? 'ADMIN' as UserRole : 'SALES_CLERK' as UserRole,
  password: '',
  is_active: true,
});

// =============================================================================
// COMPUTED
// =============================================================================

const user = computed(() => authStore.user);
const isStaffUser = computed(() => 
  user.value?.is_staff || 
  user.value?.role === 'ADMIN' || 
  user.value?.role === 'ERP_SUPERVISOR' || 
  user.value?.role === 'SUPER_ADMIN' || 
  user.value?.role === 'SUPPORT_ATC' || 
  user.value?.role === 'SUPPORT_TECH'
);

const roleOptions = computed(() => isStaffUser.value ? ERP_ROLE_OPTIONS : TENANT_ROLE_OPTIONS);

const filteredUsers = computed(() => {
  const term = search.value.toLowerCase();
  return users.value.filter((u) => {
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.first_name.toLowerCase().includes(term) ||
      u.last_name.toLowerCase().includes(term)
    );
  });
});

// =============================================================================
// METHODS
// =============================================================================

const loadUsers = async () => {
  try {
    loading.value = true;
    const data = await fetchApi<{ results?: User[] } | User[]>('/users/');
    users.value = (data as { results?: User[] }).results ?? (data as User[]) ?? [];
  } catch (error) {
    notifyError(String(error));
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const data = await fetchApi<{ results?: PermissionDefinition[]; permissionDefinitions?: PermissionDefinition[] }>('/permission-definitions/');
    availablePermissions.value = data.permissionDefinitions ?? data.results ?? [];
  } catch (error) {
    console.error('Error loading permissions:', error);
  }
};

const getRoleLabel = (role: UserRole) => {
  const option = [...TENANT_ROLE_OPTIONS, ...ERP_ROLE_OPTIONS].find((r) => r.value === role);
  return option?.label || role;
};

const getRoleColor = (role: UserRole) => {
  const option = [...TENANT_ROLE_OPTIONS, ...ERP_ROLE_OPTIONS].find((r) => r.value === role);
  return option?.color || 'bg-slate-500';
};

const isErpUser = (u: User) => {
  return u.role === 'ADMIN' || 
         u.role === 'ERP_SUPERVISOR' || 
         u.role === 'SUPPORT_ATC' || 
         u.role === 'SUPPORT_TECH' || 
         u.role === 'SUPER_ADMIN' || 
         u.is_staff;
};

const resetForm = () => {
  formData.value = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: user.value?.is_staff ? 'ADMIN' : 'SALES_CLERK',
    password: '',
    is_active: true,
  };
};

const openEdit = (u: User) => {
  editingUser.value = u;
  formData.value = {
    username: u.username,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role,
    password: '',
    is_active: u.is_active,
  };
  showForm.value = true;
};

const openCreate = () => {
  editingUser.value = null;
  resetForm();
  showForm.value = true;
};

const handleSave = async () => {
  try {
    const method = editingUser.value ? 'PUT' : 'POST';
    const path = editingUser.value ? `/users/${editingUser.value.id}/` : '/users/';
    
    const payload = { ...formData.value };
    if (editingUser.value && !payload.password) {
      const { password: _, ...payloadWithoutPassword } = payload;
      await fetchApi(path, { method, data: payloadWithoutPassword });
    } else {
      await fetchApi(path, { method, data: payload });
    }
    
    notifySuccess(editingUser.value ? 'Usuario actualizado' : 'Usuario creado');
    
    showForm.value = false;
    editingUser.value = null;
    resetForm();
    loadUsers();
  } catch (error) {
    notifyError('Error al guardar: ' + String(error));
  }
};

const handleToggleActive = async (userId: string, currentStatus: boolean) => {
  try {
    await fetchApi(`/users/${userId}/`, { 
      method: 'PATCH', 
      data: { is_active: !currentStatus } 
    });
    notifySuccess(!currentStatus ? 'Usuario activado' : 'Usuario desactivado');
    loadUsers();
  } catch (error) {
    notifyError('Error: ' + String(error));
  }
};

const handleDelete = async (userId: string, role: UserRole) => {
  if (role === 'OWNER' || role === 'SUPER_ADMIN') return;
  
  if (!confirm('¿Está seguro de eliminar este usuario?')) return;
  
  try {
    await fetchApi(`/users/${userId}/`, { method: 'DELETE' });
    notifySuccess('Usuario eliminado');
    loadUsers();
  } catch (error) {
    notifyError('Error al eliminar: ' + String(error));
  }
};

const openPermissionsDialog = async (u: User) => {
  selectedUserForPermissions.value = u;
  showPermissions.value = true;
  try {
    const data = await fetchApi<{ permissions?: PermissionDefinition[] }>(`/cms/permissions/`);
    const userPerms = data.permissions ?? [];
    selectedPermissions.value = userPerms.map((p: { code: string }) => p.code);
  } catch (error) {
    selectedPermissions.value = [];
    console.error('Error loading user permissions:', error);
  }
};

const handlePermissionToggle = (permissionCode: string) => {
  if (selectedPermissions.value.includes(permissionCode)) {
    selectedPermissions.value = selectedPermissions.value.filter(p => p !== permissionCode);
  } else {
    selectedPermissions.value.push(permissionCode);
  }
};

const handleSavePermissions = async () => {
  if (!selectedUserForPermissions.value) return;
  try {
    await fetchApi(`/cms/permissions/`, {
      method: 'POST',
      data: {
        user_id: selectedUserForPermissions.value.id,
        permissions: selectedPermissions.value,
      },
    });
    notifySuccess('Permisos actualizados');
    showPermissions.value = false;
    selectedUserForPermissions.value = null;
  } catch (error) {
    notifyError('Error al guardar permisos');
  }
};

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  loadUsers();
  loadPermissions();
});
</script>
