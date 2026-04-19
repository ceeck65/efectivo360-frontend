<template>
  <div class="min-h-screen bg-slate-50/50 p-4">
    <div class="mx-auto max-w-7xl space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-4">
          <RouterLink to="/admin" class="rounded-lg p-2 hover:bg-slate-200">
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </RouterLink>
          <div class="flex items-center gap-3">
            <div>
              <h1 class="text-xl font-bold text-slate-900">Administración de Roles</h1>
            </div>
            <span
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-full',
                permissionMode === 'store' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              ]"
            >
              {{ permissionMode === 'store' ? 'Tienda' : 'Blueprint' }}
            </span>
            <div class="relative group">
              <Info class="h-4 w-4 text-slate-400 cursor-help" />
              <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p v-if="permissionMode === 'store'">
                  Configura permisos específicos para esta tienda. Estos permisos sobrescriben el Blueprint.
                </p>
                <p v-else>
                  Configura el Blueprint Global (Plantilla Maestra). Todas las tiendas heredarán estos permisos por defecto.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Permission Mode Toggle -->
          <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              @click="permissionMode = 'store'"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                permissionMode === 'store' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              Tienda
            </button>
            <button
              v-if="authStore.user?.is_staff"
              @click="permissionMode = 'blueprint'"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                permissionMode === 'blueprint' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              Blueprint
            </button>
          </div>
          <RouterLink
            to="/admin/roles"
            class="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            <Users class="h-3.5 w-3.5" />
            Gestionar Roles
          </RouterLink>
          <!-- Tenant Selector for staff without tenant (only in store mode) -->
          <select
            v-if="permissionMode === 'store' && isStaffWithoutTenant && memberships.length > 0"
            v-model="selectedTenantId"
            @change="loadPermissionsMatrix"
            class="h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="">Seleccionar Tenant</option>
            <option v-for="membership in memberships" :key="membership.id" :value="membership.id">
              {{ membership.commercial_name || membership.name }}
            </option>
          </select>
          <button
            @click="handleSave"
            :disabled="isSaving || isLoading || (!selectedTenantId && permissionMode === 'store' && isStaffWithoutTenant)"
            class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-slate-400" />
        <p class="mt-2 text-slate-500">Cargando matriz de permisos...</p>
      </div>

      <!-- Search and Table Container -->
      <div v-else class="space-y-2">
        <!-- Search Bar -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1 max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar módulos..."
              class="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="text-xs text-slate-500">
            {{ filteredModules.length }} de {{ modules.length }} módulos
          </div>
        </div>

        <!-- Permissions Matrix -->
        <div v-if="filteredModules.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto max-h-[600px]">
            <table class="w-full text-sm">
              <thead class="bg-slate-50/50 sticky top-0 z-20">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/50 z-10 min-w-[200px]">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      @change="(e) => {
                        const target = e.target as HTMLInputElement;
                        toggleAllRoles(target.checked);
                      }"
                      :checked="isAllRolesChecked"
                      class="h-2.5 w-2.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                      title="Marcar todos los permisos para todos los roles"
                    />
                    <span>Módulo</span>
                  </div>
                </th>
                <th
                  v-for="role in activeRoles"
                  :key="role"
                  class="px-4 py-1 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]"
                >
                  <div class="flex flex-col items-center gap-1">
                    <div>{{ getRoleLabel(role) }}</div>
                    <div
                      v-if="permissionMode === 'store' && inheritanceStatus[role]"
                      :class="[
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        inheritanceStatus[role] === 'custom' ? 'bg-amber-100 text-amber-700' :
                        inheritanceStatus[role] === 'inherited' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      ]"
                    >
                      {{ inheritanceStatus[role] === 'custom' ? 'Personalizado' :
                         inheritanceStatus[role] === 'inherited' ? 'Heredado' : 'Sin config' }}
                    </div>
                  </div>
                  <div class="mt-1 flex items-center gap-1">
                    <input
                      type="checkbox"
                      @change="(e) => {
                        const target = e.target as HTMLInputElement;
                        toggleAllPermissionsForRole(role, target.checked);
                      }"
                      :checked="isAllPermissionsCheckedForRole(role)"
                      class="h-2.5 w-2.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                      title="Marcar todos para este rol"
                    />
                    <button
                      v-if="permissionMode === 'store' && inheritanceStatus[role] === 'custom'"
                      @click="handleResetToGlobal(role)"
                      class="text-slate-400 hover:text-red-600 transition-colors"
                      title="Restablecer a valores por defecto (Plantilla Global)"
                    >
                      <RotateCcw class="h-3 w-3" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="module in paginatedModules"
                :key="module.ulid"
                class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors"
              >
                <td class="px-4 py-2 sticky left-0 bg-white z-10 border-r border-slate-100">
                  <div class="flex items-center gap-2">
                    <div v-if="module.icon" class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600">
                      <LucideIcon :name="module.icon" :size="14" />
                    </div>
                    <div v-else class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600">
                      <Shield class="h-3.5 w-3.5" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <div class="text-sm font-medium text-slate-900">{{ module.title }}</div>
                        <button
                          @click="startEditingPermissionKey(module.ulid, module.permission_key)"
                          class="text-slate-400 hover:text-brand-primary transition-colors"
                          title="Editar permission_key"
                        >
                          <Pencil class="h-3 w-3" />
                        </button>
                      </div>
                      <div v-if="editingModule === module.ulid" class="mt-1 flex items-center gap-2">
                        <input
                          v-model="tempPermissionKey"
                          @keyup.enter="savePermissionKey(module.ulid)"
                          @keyup.esc="cancelEditingPermissionKey"
                          class="text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                          placeholder="CAN_VIEW_MODULE"
                        />
                        <button
                          @click="savePermissionKey(module.ulid)"
                          class="text-xs text-green-600 hover:text-green-700"
                        >
                          ✓
                        </button>
                        <button
                          @click="cancelEditingPermissionKey"
                          class="text-xs text-red-600 hover:text-red-700"
                        >
                          ✗
                        </button>
                      </div>
                      <div v-else-if="module.permission_key" class="text-xs text-slate-400 mt-0.5">{{ module.permission_key }}</div>
                      <div v-else class="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                        <AlertTriangle class="h-3 w-3" />
                        <span>Sin permiso</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  v-for="role in activeRoles"
                  :key="`${module.ulid}-${role}`"
                  class="px-4 py-2 text-center"
                >
                  <input
                    type="checkbox"
                    :checked="hasPermission(role, module.permission_key)"
                    @change="togglePermission(role, module.permission_key, module.title)"
                    class="h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

        <!-- Pagination for roles -->
      <div v-if="rolesTotalPages > 1 || (permissionMode === 'store' ? storeRoles : staffRoles).length > 5" class="flex items-center justify-between mt-2 px-3">
        <div class="flex items-center gap-4">
          <div class="text-xs text-slate-500">
            Roles {{ (rolesCurrentPage - 1) * rolesItemsPerPage + 1 }} a {{ Math.min(rolesCurrentPage * rolesItemsPerPage, (permissionMode === 'store' ? storeRoles : staffRoles).length) }} de {{ (permissionMode === 'store' ? storeRoles : staffRoles).length }}
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-600">Mostrar:</label>
            <select
              v-model="rolesItemsPerPage"
              @change="rolesCurrentPage = 1"
              class="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="(permissionMode === 'store' ? storeRoles : staffRoles).length">Todos</option>
            </select>
          </div>
        </div>
        <div v-if="rolesTotalPages > 1" class="flex items-center gap-2">
          <button
            @click="rolesCurrentPage--"
            :disabled="rolesCurrentPage === 1"
            class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span class="text-xs text-slate-600">
            Página {{ rolesCurrentPage }} de {{ rolesTotalPages }}
          </span>
          <button
            @click="rolesCurrentPage++"
            :disabled="rolesCurrentPage === rolesTotalPages"
            class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1 || filteredModules.length > 10" class="flex items-center justify-between mt-2 px-3">
        <div class="flex items-center gap-4">
          <div class="text-xs text-slate-500">
            Mostrando {{ filteredModules.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }} a {{ Math.min(currentPage * itemsPerPage, filteredModules.length) }} de {{ filteredModules.length }} módulos
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-600">Mostrar:</label>
            <select
              v-model="itemsPerPage"
              @change="currentPage = 1"
              class="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="500">500</option>
              <option :value="1000">1000</option>
              <option :value="filteredModules.length">Todos</option>
            </select>
          </div>
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span class="text-xs text-slate-600">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>

        <!-- Empty State - Only show when truly no modules exist -->
      <div v-if="!isLoading && filteredModules.length === 0 && !isStaffWithoutTenant" class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <Shield class="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-slate-900 mb-2">No hay módulos configurados</h3>
        <p class="text-sm text-slate-500 mb-4">No se encontraron módulos en el sistema para gestionar permisos.</p>
      </div>

      <!-- Empty State for search -->
      <div v-if="!isLoading && modules.length > 0 && filteredModules.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <Shield class="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-slate-900 mb-2">No se encontraron módulos</h3>
        <p class="text-sm text-slate-500 mb-4">No hay módulos que coincidan con "{{ searchQuery }}".</p>
        <button
          @click="searchQuery = ''"
          class="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20"
        >
          Limpiar búsqueda
        </button>
      </div>
      </div>

      <!-- Save Confirmation -->
      <div v-if="hasUnsavedChanges" class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 text-amber-600" />
        <p class="text-sm text-amber-800">
          Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Save, Loader2, Shield, AlertTriangle, Pencil, Users, Info, RotateCcw } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { useAuthStore } from '@/stores/auth';
import LucideIcon from '@/components/lucide/LucideIcon.vue';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();
const authStore = useAuthStore();

interface Module {
  ulid: string;
  title: string;
  permission_key: string | null;
  icon: string | null;
}

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  is_staff_role: boolean;
  is_active: boolean;
}

interface PermissionsData {
  roles: string[];
  modules: Module[];
  permissions: Record<string, string[]>;
}

const allRoles = ref<Role[]>([]);
const roles = ref<string[]>([]);
const modules = ref<Module[]>([]);
const permissions = ref<Record<string, string[]>>({});
const isLoading = ref(false);
const isSaving = ref(false);
const originalPermissions = ref<Record<string, string[]>>({});
const memberships = ref<any[]>([]);
const selectedTenantId = ref<string>('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const rolesCurrentPage = ref(1);
const rolesItemsPerPage = ref(5);
const editingModule = ref<string | null>(null);
const tempPermissionKey = ref<string>('');
const permissionMode = ref<'blueprint' | 'store'>('store');
const searchQuery = ref<string>('');
const inheritanceStatus = ref<Record<string, 'custom' | 'inherited' | 'none'>>({});

interface TenantMembership {
  id: string;
  name: string;
  commercial_name: string;
  logo: string | null;
  role: string;
  is_current: boolean;
}

const getRoleLabel = (role: string): string => {
  const roleObj = allRoles.value.find(r => r.code === role);
  return roleObj?.name || role;
};

const hasPermission = (role: string, permissionKey: string | null): boolean => {
  if (!permissionKey) return false;
  return ((permissions.value || {} as Record<string, string[]>)[role]?.includes(permissionKey) || false);
};

const isAllPermissionsCheckedForRole = (role: string): boolean => {
  const rolePermissions = (permissions.value || {} as Record<string, string[]>)[role] || [];
  const visibleModules = paginatedModules.value || [];
  if (visibleModules.length === 0) return false;

  // Check if all visible modules have permissions for this role
  const allChecked = visibleModules.every(module => {
    const key = module.permission_key || generatePermissionKey(module.title);
    return key && rolePermissions.includes(key);
  });

  return allChecked;
};

const isAllRolesChecked = computed(() => {
  const allChecked = activeRoles.value.every(role => isAllPermissionsCheckedForRole(role));
  return allChecked && activeRoles.value.length > 0;
});

const toggleAllRoles = (checkAll: boolean) => {
  activeRoles.value.forEach(role => {
    toggleAllPermissionsForRole(role, checkAll);
  });
};

const generatePermissionKey = (moduleTitle: string): string => {
  // Generate permission key from module title
  // Example: "Dashboard" -> "CAN_VIEW_DASHBOARD"
  const slug = moduleTitle.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `CAN_VIEW_${slug.toUpperCase()}`;
};

const togglePermission = (role: string, permissionKey: string | null, moduleTitle?: string) => {
  // Generate permission key if not exists
  const key = permissionKey || (moduleTitle ? generatePermissionKey(moduleTitle) : null);

  if (!key) return;

  if (!permissions.value[role]) {
    permissions.value[role] = [];
  }

  const index = permissions.value[role].indexOf(key);
  if (index > -1) {
    permissions.value[role].splice(index, 1);
  } else {
    permissions.value[role].push(key);
  }
};

const startEditingPermissionKey = (moduleUlid: string, currentKey: string | null) => {
  editingModule.value = moduleUlid;
  tempPermissionKey.value = currentKey || '';
};

const savePermissionKey = (moduleUlid: string) => {
  const moduleIndex = modules.value.findIndex(m => m.ulid === moduleUlid);
  if (moduleIndex !== -1) {
    modules.value[moduleIndex].permission_key = tempPermissionKey.value || null;
  }
  editingModule.value = null;
  tempPermissionKey.value = '';
};

const cancelEditingPermissionKey = () => {
  editingModule.value = null;
  tempPermissionKey.value = '';
};

const toggleAllPermissionsForRole = (role: string, checkAll: boolean) => {
  if (!permissions.value[role]) {
    permissions.value[role] = [];
  }

  if (checkAll) {
    // Add all permission keys for visible modules for this role
    paginatedModules.value.forEach(module => {
      const key = module.permission_key || generatePermissionKey(module.title);
      if (key && !permissions.value[role].includes(key)) {
        permissions.value[role].push(key);
      }
    });
  } else {
    // Remove permissions for visible modules for this role
    paginatedModules.value.forEach(module => {
      const key = module.permission_key || generatePermissionKey(module.title);
      if (key) {
        permissions.value[role] = permissions.value[role].filter(p => p !== key);
      }
    });
  }
};

const hasUnsavedChanges = computed(() => {
  return JSON.stringify(permissions.value) !== JSON.stringify(originalPermissions.value);
});

const isStaffWithoutTenant = computed(() => {
  return authStore.user?.is_staff && !authStore.tenantUlid;
});

const totalPages = computed(() => {
  return Math.ceil(filteredModules.value.length / itemsPerPage.value);
});

const filteredModules = computed(() => {
  if (!searchQuery.value.trim()) {
    return modules.value || [];
  }
  const query = searchQuery.value.toLowerCase();
  return (modules.value || []).filter(module =>
    module.title.toLowerCase().includes(query)
  );
});

const paginatedModules = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredModules.value.slice(start, end);
});

const rolesTotalPages = computed(() => {
  const filtered = permissionMode.value === 'store' ? storeRoles.value : staffRoles.value;
  return Math.ceil(filtered.length / rolesItemsPerPage.value);
});

const paginatedRoles = computed(() => {
  const filtered = permissionMode.value === 'store' ? storeRoles.value : staffRoles.value;
  const start = (rolesCurrentPage.value - 1) * rolesItemsPerPage.value;
  const end = start + rolesItemsPerPage.value;
  return filtered.slice(start, end);
});

const storeRoles = computed(() => {
  // Roles de tienda (is_staff_role=False)
  return (allRoles.value || []).filter(role => !role.is_staff_role);
});

const staffRoles = computed(() => {
  // Roles de staff (is_staff_role=True)
  return (allRoles.value || []).filter(role => role.is_staff_role);
});

const activeRoles = computed(() => {
  return paginatedRoles.value.map(role => role.code);
});

// Watch permissionMode to reset roles pagination and reload permissions
watch(permissionMode, async () => {
  rolesCurrentPage.value = 1;
  await loadPermissionsMatrix();
});

// Watch searchQuery to reset page
watch(searchQuery, () => {
  currentPage.value = 1;
});

const loadRoles = async () => {
  try {
    const data = await fetchApi<any>('/api/roles/');
    allRoles.value = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    console.log('Roles cargados:', allRoles.value);
  } catch (e: any) {
    console.error('Failed to load roles:', e);
    notifyError('Error cargando roles');
    allRoles.value = [];
  }
};

const loadMemberships = async () => {
  try {
    const data = await fetchApi<{ memberships: TenantMembership[]; current_tenant_id: string }>('/api/v1/auth/memberships/');
    memberships.value = data.memberships;
    if (data.current_tenant_id) {
      selectedTenantId.value = data.current_tenant_id;
    } else if (data.memberships.length > 0) {
      selectedTenantId.value = data.memberships[0].id;
    }
  } catch (e: any) {
    console.error('Failed to load memberships:', e);
  }
};

const loadInheritanceStatus = async () => {
  if (permissionMode.value !== 'store') {
    inheritanceStatus.value = {};
    return;
  }
  
  const tenantId = authStore.tenantUlid || selectedTenantId.value;
  if (!tenantId) return;
  
  try {
    const data = await fetchApi<{ inheritance_status: Record<string, 'custom' | 'inherited' | 'none'> }>('/api/role-permissions/inheritance-status/', {
      params: { tenant_id: tenantId }
    });
    inheritanceStatus.value = data.inheritance_status;
  } catch (e: any) {
    console.error('Failed to load inheritance status:', e);
  }
};

const loadPermissionsMatrix = async () => {
  isLoading.value = true;
  try {
    const params: any = {};
    
    if (permissionMode.value === 'blueprint') {
      // Blueprint mode: mode=global, no tenant_id
      params.mode = 'global';
    } else {
      // Store mode: mode=tenant, with tenant_id
      const tenantId = authStore.tenantUlid || selectedTenantId.value || null;
      if (tenantId) {
        params.tenant_id = tenantId;
      }
      params.mode = 'tenant';
    }

    const data = await fetchApi<PermissionsData & { requires_tenant_selection?: boolean; message?: string; mode?: string }>('/api/role-permissions/matrix/', { params });

    console.log('Módulos cargados:', data.modules);
    console.log('Permisos cargados:', data.permissions);
    console.log('Mode:', data.mode);

    if (data.requires_tenant_selection) {
      // Backend returned empty matrix indicating tenant selection is required
      roles.value = data.roles;
      modules.value = data.modules;
      permissions.value = { ...data.permissions };
      originalPermissions.value = JSON.parse(JSON.stringify(data.permissions));
      currentPage.value = 1; // Reset to first page
      return;
    }

    roles.value = data.roles;
    modules.value = data.modules;
    permissions.value = { ...data.permissions };
    originalPermissions.value = JSON.parse(JSON.stringify(data.permissions));
    currentPage.value = 1; // Reset to first page
    
    // Load inheritance status for store mode
    await loadInheritanceStatus();
  } catch (e: any) {
    console.error('Failed to load permissions matrix:', e);
    notifyError('Error cargando matriz de permisos');
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  if (!hasUnsavedChanges.value) {
    notifyInfo('No hay cambios para guardar');
    return;
  }

  const result = await Swal.fire({
    title: permissionMode.value === 'blueprint' ? '¿Guardar Blueprint Global?' : '¿Guardar cambios de permisos?',
    text: permissionMode.value === 'blueprint' 
      ? 'Esto actualizará el Blueprint Global. Las tiendas heredarán estos permisos por defecto.'
      : 'Esto actualizará los permisos específicos de esta tienda. El menú de navegación se actualizará instantáneamente para todos los usuarios afectados.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0f172a',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  isSaving.value = true;
  try {
    const payload: any = { 
      permissions: permissions.value,
      mode: permissionMode.value === 'blueprint' ? 'global' : 'tenant'
    };

    if (permissionMode.value === 'blueprint') {
      // Blueprint mode: don't include tenant_id at all
      // The backend will set tenant to null when mode is global
    } else {
      // Store mode: use tenant_id
      const tenantId = authStore.tenantUlid || selectedTenantId.value || null;
      if (!tenantId) {
        notifyError('Error: No tienes un tenant asignado. Por favor selecciona un tenant.');
        isSaving.value = false;
        return;
      }
      payload.tenant_id = tenantId;
    }

    await fetchApi('/api/role-permissions/sync/', {
      method: 'POST',
      data: payload,
    });
    notifySuccess(permissionMode.value === 'blueprint' 
      ? 'Blueprint Global guardado exitosamente. Las tiendas heredarán estos permisos por defecto.'
      : 'Permisos guardados exitosamente. El menú de navegación se actualizará para los usuarios afectados.');
    originalPermissions.value = JSON.parse(JSON.stringify(permissions.value));
    
    // Reload inheritance status for store mode
    if (permissionMode.value === 'store') {
      await loadInheritanceStatus();
    }
  } catch (e: any) {
    console.error('Failed to sync permissions:', e);
    notifyError('Error guardando permisos');
  } finally {
    isSaving.value = false;
  }
};

const notifyInfo = (message: string) => {
  // Simple info notification
  console.log(message);
};

const handleResetToGlobal = async (role: string) => {
  const result = await Swal.fire({
    title: '¿Restablecer a Valores por Defecto?',
    text: `Esto eliminará la configuración personalizada para el rol ${getRoleLabel(role)} y la tienda heredará los permisos de la Plantilla Global.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, restablecer',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0f172a',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const tenantId = authStore.tenantUlid;
    if (!tenantId) {
      notifyError('No se pudo determinar el tenant');
      return;
    }

    await fetchApi('/api/role-permissions/reset-to-global/', {
      method: 'POST',
      data: { tenant_id: tenantId, role },
    });
    notifySuccess(`Permisos de ${getRoleLabel(role)} restablecidos a la Plantilla Global.`);
    
    // Reload permissions matrix and inheritance status
    await loadPermissionsMatrix();
  } catch (e: any) {
    console.error('Failed to reset to global:', e);
    notifyError('Error restableciendo permisos');
  }
};

onMounted(async () => {
  await loadRoles();
  if (isStaffWithoutTenant.value) {
    await loadMemberships();
  }
  await loadPermissionsMatrix();
});
</script>

<style scoped>
/* Sticky column styling */
table {
  border-collapse: separate;
  border-spacing: 0;
}

/* Checkbox styling */
input[type="checkbox"]:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}
</style>
