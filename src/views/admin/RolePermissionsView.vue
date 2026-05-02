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
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="border-b border-slate-200 mb-4">
        <nav class="flex space-x-8">
          <!-- TIENDA: Solo visible para usuarios no staff (dueños de tienda) -->
          <button
            v-if="!authStore.user?.is_staff"
            @click="permissionMode = 'store'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              permissionMode === 'store'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
          >
            TIENDA
          </button>
          <!-- BLUEPRINT: Solo visible para staff (Super Admin y Staff) -->
          <button
            v-if="authStore.user?.is_staff"
            @click="permissionMode = 'blueprint'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              permissionMode === 'blueprint'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
          >
            BLUEPRINT
          </button>
          <!-- STAFF: Solo visible para staff (Super Admin y Staff) -->
          <button
            v-if="authStore.user?.is_staff"
            @click="permissionMode = 'staff'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              permissionMode === 'staff'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
          >
            STAFF
          </button>
        </nav>
      </div>

      <!-- Blueprint Warning for Store Owners -->
      <div 
        v-if="permissionMode === 'store' && !authStore.user?.is_staff && isUsingBlueprint"
        class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-amber-800">Configuración Estándar</h3>
            <p class="text-sm text-amber-700 mt-1">
              Estás usando la configuración estándar del Blueprint. Si realizas cambios, se creará una matriz personalizada para tu tienda.
            </p>
          </div>
        </div>
      </div>

      <!-- Matrix Content -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-full',
                permissionMode === 'store' ? 'bg-blue-100 text-blue-700' :
                permissionMode === 'blueprint' ? 'bg-emerald-100 text-emerald-700' :
                'bg-purple-100 text-purple-700'
              ]"
            >
              {{ permissionMode === 'store' ? 'Tienda' : permissionMode === 'blueprint' ? 'Blueprint' : 'Staff' }}
            </span>
            <div class="relative group">
              <Info class="h-4 w-4 text-slate-400 cursor-help" />
              <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p v-if="permissionMode === 'store'">
                  Configura permisos específicos para esta tienda. Estos permisos sobrescriben el Blueprint.
                </p>
                <p v-else-if="permissionMode === 'blueprint'">
                  Configura el Blueprint Global (Plantilla Maestra). Todas las tiendas heredarán estos permisos por defecto.
                </p>
                <p v-else>
                  Configura los permisos del equipo interno de Disproweb (Soporte, Admin, Supervisor, Agente).
                </p>
              </div>
            </div>
          </div>
        <div class="flex items-center gap-3">
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
            @change="handleTenantChange"
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
          <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 class="text-sm font-semibold text-slate-900">
              {{ permissionMode === 'blueprint' ? 'Editando Plantilla Base' :
                 permissionMode === 'staff' ? 'Editando Permisos de Equipo' :
                 `Editando Tienda: ${selectedTenantName || authStore.tenantName || 'Selecciona una tienda'}` }}
            </h3>
          </div>
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
              <template v-for="module in paginatedModules" :key="module.ulid">
                <!-- Parent row (module) -->
                <tr class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors">
                  <td class="px-4 py-2 sticky left-0 bg-white z-10 border-r border-slate-100">
                    <div class="flex items-center gap-2">
                      <button
                        @click="toggleModuleExpansion(module.ulid, activeRoles[0])"
                        class="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Expandir/Colapsar"
                      >
                        <svg
                          :class="['h-4 w-4 transition-transform', isModuleExpanded(module.ulid, activeRoles[0]) ? 'rotate-90' : '']"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
                      :ref="(el) => setCheckboxRef(el, module.ulid, role)"
                      type="checkbox"
                      :checked="hasPermission(role, module.permission_key) === 'ALL'"
                      @change="(e) => toggleParentCheckbox(module, role, (e.target as HTMLInputElement).checked)"
                      class="h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                  </td>
                </tr>

                <!-- Child rows (permissions) -->
                <tr
                  v-if="isModuleExpanded(module.ulid, activeRoles[0])"
                  v-for="permissionKey in generatePermissionKeys(module.title)"
                  :key="`${module.ulid}-${permissionKey}`"
                  class="border-t border-slate-50 bg-slate-50/30 hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-4 py-2 sticky left-0 bg-slate-50/30 z-10 border-r border-slate-100">
                    <div class="flex items-center gap-2 pl-8">
                      <div class="w-6 h-6"></div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs text-slate-600">{{ permissionKey }}</div>
                        <div class="text-xs text-slate-400">{{ getPermissionLabel(permissionKey) }}</div>
                      </div>
                    </div>
                  </td>
                  <td
                    v-for="role in activeRoles"
                    :key="`${module.ulid}-${permissionKey}-${role}`"
                    class="px-4 py-2 text-center"
                  >
                    <input
                      type="checkbox"
                      :checked="getRolePermissions(role).includes(permissionKey)"
                      @change="toggleChildCheckbox(module, role, permissionKey)"
                      class="h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

        <!-- Pagination for roles -->
      <div v-if="rolesTotalPages > 1 || roles.length > 5" class="flex items-center justify-between mt-2 px-3">
        <div class="flex items-center gap-4">
          <div class="text-xs text-slate-500">
            Roles {{ (rolesCurrentPage - 1) * rolesItemsPerPage + 1 }} a {{ Math.min(rolesCurrentPage * rolesItemsPerPage, roles.length) }} de {{ roles.length }}
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-600">Mostrar:</label>
            <select
              v-model="rolesItemsPerPage"
              class="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="roles.length">Todos</option>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { eventBus, PERMISSION_EVENTS } from '@/events/eventBus';
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
  modules: Record<string, Module[]>;
  permissions: Record<string, string[]>;
  inheritance_status?: Record<string, 'custom' | 'inherited' | 'none'>;
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
const selectedTenantName = ref<string>('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const rolesCurrentPage = ref(1);
const rolesItemsPerPage = ref(5);
const editingModule = ref<string | null>(null);
const tempPermissionKey = ref<string>('');
const permissionMode = ref<'store' | 'blueprint' | 'staff'>('store');

// Set initial permission mode based on user type
onMounted(() => {
  if (authStore.user?.is_staff) {
    // Staff users: default to blueprint (they can't see store tab anyway)
    permissionMode.value = 'blueprint';
  } else {
    // Store owners: default to store (they can only see store tab)
    permissionMode.value = 'store';
  }
});
const searchQuery = ref<string>('');
const inheritanceStatus = ref<Record<string, 'custom' | 'inherited' | 'none'>>({});
const isUsingBlueprint = ref<boolean>(true); // Track if store is using blueprint config

// Refs for checkboxes
const checkboxRefs = ref<Record<string, HTMLInputElement>>({});

const setCheckboxRef = (el: any, moduleUlid: string, role: string) => {
  if (el && el instanceof HTMLInputElement) {
    const key = `${moduleUlid}-${role}`;
    checkboxRefs.value[key] = el;
  }
};

// State for expanded modules per role
const expandedModules = ref<Record<string, Set<string>>>({});

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

const getRolePermissions = (role: string): string[] => {
  return (permissions.value as Record<string, string[]>)[role] || [];
};

const handleTenantChange = () => {
  const membership = memberships.value.find(m => m.id === selectedTenantId.value);
  selectedTenantName.value = membership?.commercial_name || membership?.name || '';
  loadPermissionsMatrix();
};

type PermissionState = 'ALL' | 'PARTIAL' | 'NONE';

const hasPermission = (role: string, permissionKey: string | null): PermissionState => {
  const rolePermissions = (permissions.value || {} as Record<string, string[]>)[role] || [];

  // If permissionKey is null, we can't determine the module, so return NONE
  // The checkbox should be unchecked for modules without permission_key
  if (!permissionKey) return 'NONE';

  // If it's a custom permission_key (starts with CAN_), check if it exists
  if (permissionKey.startsWith('CAN_')) {
    return rolePermissions.includes(permissionKey) ? 'ALL' : 'NONE';
  }

  // For standard modules, check if role has any of the 5 standard permissions
  const standardPermissions = [
    `CAN_VIEW_${permissionKey.toUpperCase()}`,
    `CAN_CREATE_${permissionKey.toUpperCase()}`,
    `CAN_UPDATE_${permissionKey.toUpperCase()}`,
    `CAN_STATUS_${permissionKey.toUpperCase()}`,
    `CAN_REPORT_${permissionKey.toUpperCase()}`
  ];

  const hasAll = standardPermissions.every(perm => rolePermissions.includes(perm));
  const hasAny = standardPermissions.some(perm => rolePermissions.includes(perm));

  if (hasAll) return 'ALL';
  if (hasAny) return 'PARTIAL';
  return 'NONE';
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

const generatePermissionKeys = (moduleTitle: string): string[] => {
  // Generate 5 standard permission keys from module title
  // Example: "Dashboard" -> ["CAN_VIEW_DASHBOARD", "CAN_CREATE_DASHBOARD", "CAN_UPDATE_DASHBOARD", "CAN_STATUS_DASHBOARD", "CAN_REPORT_DASHBOARD"]
  const slug = moduleTitle.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const base = slug.toUpperCase();
  return [
    `CAN_VIEW_${base}`,
    `CAN_CREATE_${base}`,
    `CAN_UPDATE_${base}`,
    `CAN_STATUS_${base}`,
    `CAN_REPORT_${base}`
  ];
};

const generatePermissionKey = (moduleTitle: string): string => {
  // Generate primary permission key from module title (for backward compatibility)
  if (!moduleTitle) {
    return '';
  }
  const slug = moduleTitle.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `CAN_VIEW_${slug.toUpperCase()}`;
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
    // Add all 5 permission keys for visible modules for this role
    paginatedModules.value.forEach(module => {
      const keys = module.permission_key ? [module.permission_key] : generatePermissionKeys(module.title);
      keys.forEach(key => {
        if (key && !permissions.value[role].includes(key)) {
          permissions.value[role].push(key);
        }
      });
    });
  } else {
    // Remove all 5 permissions for visible modules for this role
    paginatedModules.value.forEach(module => {
      const keys = module.permission_key ? [module.permission_key] : generatePermissionKeys(module.title);
      keys.forEach(key => {
        if (key) {
          permissions.value[role] = permissions.value[role].filter(p => p !== key);
        }
      });
    });
  }
};

const hasUnsavedChanges = computed(() => {
  return JSON.stringify(permissions.value) !== JSON.stringify(originalPermissions.value);
});

// Checkbox Tree functions
const toggleModuleExpansion = (moduleUlid: string, role: string) => {
  if (!expandedModules.value[role]) {
    expandedModules.value[role] = new Set();
  }
  if (expandedModules.value[role].has(moduleUlid)) {
    expandedModules.value[role].delete(moduleUlid);
  } else {
    expandedModules.value[role].add(moduleUlid);
  }
};

const isModuleExpanded = (moduleUlid: string, role: string): boolean => {
  return expandedModules.value[role]?.has(moduleUlid) || false;
};

const toggleParentCheckbox = (module: Module, role: string, checked: boolean) => {
  const keys = generatePermissionKeys(module.title);

  if (!permissions.value[role]) {
    permissions.value[role] = [];
  }

  if (checked) {
    // Add all permissions
    keys.forEach(key => {
      if (!permissions.value[role].includes(key)) {
        permissions.value[role].push(key);
      }
    });
  } else {
    // Remove all permissions
    keys.forEach(key => {
      const index = permissions.value[role].indexOf(key);
      if (index > -1) {
        permissions.value[role].splice(index, 1);
      }
    });
  }
};

const toggleChildCheckbox = (module: Module, role: string, permissionKey: string) => {
  if (!permissions.value[role]) {
    permissions.value[role] = [];
  }

  const index = permissions.value[role].indexOf(permissionKey);
  if (index > -1) {
    permissions.value[role].splice(index, 1);
  } else {
    permissions.value[role].push(permissionKey);
  }

  // Update parent checkbox state (indeterminate will be handled by watcher)
  const parentCheckbox = checkboxRefs.value[`${module.ulid}-${role}`];
  if (parentCheckbox) {
    const state = hasPermission(role, module.permission_key);
    parentCheckbox.checked = state === 'ALL';
    parentCheckbox.indeterminate = state === 'PARTIAL';
  }
};

const getPermissionLabel = (key: string): string => {
  const labels: Record<string, string> = {
    'CAN_VIEW': 'Ver',
    'CAN_CREATE': 'Crear',
    'CAN_UPDATE': 'Actualizar',
    'CAN_STATUS': 'Cambiar Estado',
    'CAN_REPORT': 'Reportes'
  };

  for (const [prefix, label] of Object.entries(labels)) {
    if (key.startsWith(prefix)) {
      return label;
    }
  }
  return key;
};

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
  return (filteredModules.value || []).slice(start, end);
});

const rolesTotalPages = computed(() => {
  return Math.ceil(roles.value.length / rolesItemsPerPage.value);
});

const paginatedRoles = computed(() => {
  const start = (rolesCurrentPage.value - 1) * rolesItemsPerPage.value;
  const end = start + rolesItemsPerPage.value;
  return roles.value.slice(start, end);
});

const activeRoles = computed(() => {
  return paginatedRoles.value.map(role => role);
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

// Watch permissions to update indeterminate state
watch(permissions, () => {
  // Update indeterminate state for all checkboxes
  paginatedModules.value.forEach(module => {
    activeRoles.value.forEach(role => {
      const key = `${module.ulid}-${role}`;
      const checkbox = checkboxRefs.value[key];
      if (checkbox) {
        const state = hasPermission(role, module.permission_key);
        checkbox.indeterminate = state === 'PARTIAL';
      }
    });
  });
}, { deep: true });

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
      // Blueprint mode: mode=global, no tenant_id, is_staff_role=false (store roles only)
      params.mode = 'global';
      params.is_staff_role = 'false';
    } else if (permissionMode.value === 'staff') {
      // Staff mode: mode=global, no tenant_id, is_staff_role=true (staff roles only)
      params.mode = 'global';
      params.is_staff_role = 'true';
    } else {
      // Store mode: mode=tenant, with tenant_id, is_staff_role=false (store roles only)
      const tenantId = authStore.tenantUlid || selectedTenantId.value || null;
      if (tenantId) {
        params.tenant_id = tenantId;
      }
      params.mode = 'tenant';
      params.is_staff_role = 'false';
    }

    console.log('Loading permissions matrix with params:', params);

    const data = await fetchApi<PermissionsData & { requires_tenant_selection?: boolean; message?: string; mode?: string }>('/api/role-permissions/matrix/', { params });

    console.log('Módulos cargados:', data.modules);
    console.log('Permisos cargados:', data.permissions);
    console.log('Mode:', data.mode);

    if (data.requires_tenant_selection) {
      // Backend returned empty matrix indicating tenant selection is required
      roles.value = data.roles;
      // Extract modules array from object with "null" key
      modules.value = data.modules && data.modules.null ? data.modules.null : [];
      permissions.value = { ...data.permissions };
      originalPermissions.value = JSON.parse(JSON.stringify(data.permissions));
      currentPage.value = 1; // Reset to first page
      return;
    }

    roles.value = data.roles;
    // Extract modules array from object with "null" key
    modules.value = data.modules && data.modules.null ? data.modules.null : [];
    permissions.value = { ...data.permissions };
    originalPermissions.value = JSON.parse(JSON.stringify(data.permissions));
    currentPage.value = 1; // Reset to first page
    
    // Handle inheritance status from backend
    if (data.inheritance_status) {
      inheritanceStatus.value = data.inheritance_status;
      
      // Update isUsingBlueprint for store owners
      if (permissionMode.value === 'store' && !authStore.user?.is_staff) {
        // Check if any role has inherited permissions
        const hasInherited = Object.values(data.inheritance_status).some(status => status === 'inherited');
        const hasCustom = Object.values(data.inheritance_status).some(status => status === 'custom');
        
        // Using blueprint if no custom permissions exist
        isUsingBlueprint.value = !hasCustom && hasInherited;
      }
    } else {
      // Fallback to separate call if inheritance_status not included
      await loadInheritanceStatus();
    }
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
    title: '¿Deseas actualizar la jerarquía de permisos del sistema?',
    text: 'Esto afectará a todos los usuarios activos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, actualizar',
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
      mode: permissionMode.value === 'store' ? 'tenant' : 'global'
    };

    if (permissionMode.value === 'store') {
      // Store mode: use tenant_id
      const tenantId = authStore.tenantUlid || selectedTenantId.value || null;
      if (!tenantId) {
        notifyError('Error: No tienes un tenant asignado. Por favor selecciona un tenant.');
        isSaving.value = false;
        return;
      }
      payload.tenant_id = tenantId;
    } else {
      // Blueprint or Staff mode: explicitly send tenant_id as null
      payload.tenant_id = null;
    }

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    await fetchApi('/api/role-permissions/sync/', {
      method: 'POST',
      data: payload,
    });
    notifySuccess(permissionMode.value === 'blueprint'
      ? 'Blueprint Global guardado exitosamente. Las tiendas heredarán estos permisos por defecto.'
      : permissionMode.value === 'staff'
      ? 'Permisos del equipo guardados exitosamente.'
      : 'Permisos guardados exitosamente. El menú de navegación se actualizará para los usuarios afectados.');
    originalPermissions.value = JSON.parse(JSON.stringify(permissions.value));
    
    // Emit permission change event for instant sidebar refresh
    eventBus.emit(PERMISSION_EVENTS.ROLE_PERMISSIONS_UPDATED, {
      mode: permissionMode.value,
      tenantId: payload.tenant_id,
    });
    
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
