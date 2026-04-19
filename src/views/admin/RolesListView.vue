<template>
  <div class="min-h-screen bg-slate-50/50 p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RouterLink to="/admin" class="rounded-lg p-2 hover:bg-slate-200">
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Gestión de Roles</h1>
            <p class="text-sm text-slate-500">Crea y administra roles del sistema</p>
          </div>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          <Plus class="h-4 w-4" />
          Nuevo Rol
        </button>
      </div>

      <!-- Mode Toggle -->
      <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          @click="filterMode = 'store'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            filterMode === 'store' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Roles de Tienda
        </button>
        <button
          @click="filterMode = 'staff'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            filterMode === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Roles de Staff
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-slate-400" />
        <p class="mt-2 text-slate-500">Cargando roles...</p>
      </div>

      <!-- Roles Table -->
      <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nombre del Rol
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Código
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Usuarios
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="role in filteredRoles"
              :key="role.id"
              class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-slate-900">{{ role.name }}</div>
                <div v-if="role.description" class="text-xs text-slate-400 mt-0.5">{{ role.description }}</div>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{{ role.code }}</code>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    role.is_staff_role
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ role.is_staff_role ? 'Staff' : 'Tienda' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-slate-600">{{ role.user_count }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    role.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ role.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(role)"
                    class="text-slate-400 hover:text-brand-primary transition-colors"
                    title="Editar"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="confirmDelete(role)"
                    class="text-slate-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRoles.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-500">
                No hay roles para mostrar
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Link to Permissions Matrix -->
      <div class="text-center">
        <RouterLink
          to="/admin/role-permissions"
          class="inline-flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary/80"
        >
          <Shield class="h-4 w-4" />
          Ir a Matriz de Permisos
        </RouterLink>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}
          </h2>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Nombre del Rol
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Ej: Vendedor Junior"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Código
            </label>
            <input
              v-model="formData.code"
              type="text"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Ej: SALES_JUNIOR"
              :disabled="!!editingRole"
            />
            <p class="text-xs text-slate-400 mt-1">
              {{ editingRole ? 'No se puede modificar el código' : 'Se autogenera si se deja vacío' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <select
              v-model="formData.is_staff_role"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option :value="false">Rol para Clientes/Tiendas</option>
              <option :value="true">Rol Interno de Staff</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Para qué sirve este rol..."
            />
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="formData.is_active"
              type="checkbox"
              id="is_active"
              class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            <label for="is_active" class="text-sm text-slate-700">
              Rol activo
            </label>
          </div>
        </div>
        <div class="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            @click="saveRole"
            :disabled="isSaving"
            class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {{ isSaving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, Shield } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  is_staff: boolean;
  is_supervisor: boolean;
  is_staff_role: boolean;
  sort_order: number;
  is_active: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

const roles = ref<Role[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const filterMode = ref<'store' | 'staff'>('store');
const showModal = ref(false);
const editingRole = ref<Role | null>(null);

const formData = ref({
  name: '',
  code: '',
  is_staff_role: false,
  description: '',
  is_active: true,
});

const filteredRoles = computed(() => {
  if (!Array.isArray(roles.value)) {
    return [];
  }
  return roles.value.filter(role =>
    filterMode.value === 'store' ? !role.is_staff_role : role.is_staff_role
  );
});

const loadRoles = async () => {
  isLoading.value = true;
  try {
    const data = await fetchApi<any>('/api/roles/');
    // La respuesta tiene estructura de paginación: { count, next, previous, results }
    roles.value = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    console.log('Roles cargados:', roles.value);
  } catch (e: any) {
    console.error('Failed to load roles:', e);
    notifyError('Error cargando roles');
    roles.value = [];
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  editingRole.value = null;
  formData.value = {
    name: '',
    code: '',
    is_staff_role: filterMode.value === 'staff',
    description: '',
    is_active: true,
  };
  showModal.value = true;
};

const openEditModal = (role: Role) => {
  editingRole.value = role;
  formData.value = {
    name: role.name,
    code: role.code,
    is_staff_role: role.is_staff_role,
    description: role.description,
    is_active: role.is_active,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingRole.value = null;
  formData.value = {
    name: '',
    code: '',
    is_staff_role: false,
    description: '',
    is_active: true,
  };
};

const saveRole = async () => {
  if (!formData.value.name.trim()) {
    notifyError('El nombre del rol es requerido');
    return;
  }

  isSaving.value = true;
  try {
    if (editingRole.value) {
      await fetchApi(`/api/roles/${editingRole.value.id}/`, {
        method: 'PATCH',
        data: formData.value,
      });
      notifySuccess('Rol actualizado exitosamente');
    } else {
      await fetchApi('/api/roles/', {
        method: 'POST',
        data: formData.value,
      });
      notifySuccess('Rol creado exitosamente');
    }
    closeModal();
    loadRoles();
  } catch (e: any) {
    console.error('Failed to save role:', e);
    notifyError('Error guardando rol');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (role: Role) => {
  const result = await Swal.fire({
    title: '¿Eliminar rol?',
    text: `Estás a punto de eliminar el rol "${role.name}". Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  });

  if (!result.isConfirmed) return;

  try {
    await fetchApi(`/api/roles/${role.id}/`, {
      method: 'DELETE',
    });
    notifySuccess('Rol eliminado exitosamente');
    loadRoles();
  } catch (e: any) {
    console.error('Failed to delete role:', e);
    notifyError(e.response?.data?.detail || 'Error eliminando rol');
  }
};

onMounted(() => {
  loadRoles();
});
</script>
