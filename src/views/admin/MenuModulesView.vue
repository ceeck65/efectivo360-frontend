<template>
  <div class="min-h-screen bg-slate-50/50 p-4">
    <div class="mx-auto max-w-7xl space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RouterLink to="/admin" class="rounded-lg p-2 hover:bg-slate-200">
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </RouterLink>
          <div>
            <h1 class="text-xl font-bold text-slate-900">Gestión de Módulos</h1>
            <p class="text-xs text-slate-500">Organiza los ítems del menú por grupos</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="handleCreateGroup" class="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <FolderPlus class="h-3.5 w-3.5" /> Nuevo Grupo
          </button>
          <button @click="handleCreate" class="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium text-white bg-slate-900 rounded-lg">
            <Plus class="h-3.5 w-3.5" /> Nuevo Módulo
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar módulos por título o ruta..."
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">Cargando...</div>

      <!-- Empty State -->
      <div v-else-if="filteredGroups.length === 0 && filteredUngroupedModules.length === 0" class="bg-white rounded-xl border p-12 text-center">
        <p class="text-slate-500">No se encontraron módulos</p>
      </div>

      <!-- Groups with Modules -->
      <div v-else class="space-y-4">
        <!-- Draggable Groups -->
        <draggable
          v-model="filteredGroups"
          item-key="id"
          handle=".group-drag-handle"
          @end="onGroupReorder"
          :disabled="!!searchQuery"
          class="space-y-4"
        >
          <template #item="{ element: group }">
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <!-- Group Header -->
              <div class="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-200">
                <div class="flex items-center gap-3">
                  <button class="group-drag-handle p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing">
                    <GripVertical class="h-4 w-4 text-slate-400" />
                  </button>
                  <div class="flex items-center gap-2">
                    <div v-if="group.icon" class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600">
                      <LucideIcon :name="group.icon" :size="14" />
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-slate-900">{{ group.label }}</h3>
                      <p class="text-xs text-slate-500">{{ group.name }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">{{ group.modules?.length || 0 }} módulos</span>
                  <button @click="handleEditGroup(group)" class="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button @click="handleDeleteGroup(group)" class="p-1.5 hover:bg-red-50 text-red-600 rounded">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <!-- Group Modules -->
              <draggable
                v-model="group.modules"
                item-key="id"
                handle=".module-drag-handle"
                @end="onModuleReorder(group)"
                :disabled="!!searchQuery"
                class="divide-y divide-slate-100"
              >
                <template #item="{ element: module }">
                  <div class="flex items-center justify-between px-4 py-2 hover:bg-slate-50/30 transition-colors">
                    <div class="flex items-center gap-3">
                      <button class="module-drag-handle p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing">
                        <GripVertical class="h-4 w-4 text-slate-400" />
                      </button>
                      <div class="flex items-center gap-2">
                        <div class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600">
                          <LucideIcon :name="module.icon" :size="14" />
                        </div>
                        <div class="font-medium text-slate-900 text-sm">{{ module.title }}</div>
                        <div class="text-xs text-slate-400 font-mono">{{ module.path }}</div>
                        <span v-if="module.group_ulid" class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700">
                          {{ getGroupByUlid(module.group_ulid)?.label || 'Grupo' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1">
                        <span v-if="module.show_on_mobile" class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-blue-700">
                          <Smartphone class="h-3 w-3" />
                        </span>
                        <span v-if="module.show_on_desktop" class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-green-700">
                          <Monitor class="h-3 w-3" />
                        </span>
                      </div>
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                          module.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        ]"
                      >
                        {{ module.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                      <div class="flex items-center gap-1">
                        <button @click="handleEdit(module)" class="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                          <Pencil class="h-3.5 w-3.5" />
                        </button>
                        <button @click="handleDelete(module)" class="p-1.5 hover:bg-red-50 text-red-600 rounded">
                          <Trash2 class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>

        <!-- Ungrouped Modules -->
        <div v-if="filteredUngroupedModules.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-200">
            <h3 class="text-sm font-semibold text-slate-900">Sin Grupo</h3>
          </div>
          <draggable
            v-model="filteredUngroupedModules"
            item-key="id"
            handle=".module-drag-handle"
            @end="onUngroupedModuleReorder"
            :disabled="!!searchQuery"
            class="divide-y divide-slate-100"
          >
            <template #item="{ element: module }">
              <div class="flex items-center justify-between px-4 py-2 hover:bg-slate-50/30 transition-colors">
                <div class="flex items-center gap-3">
                  <button class="module-drag-handle p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing">
                    <GripVertical class="h-4 w-4 text-slate-400" />
                  </button>
                  <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600">
                      <LucideIcon :name="module.icon" :size="14" />
                    </div>
                    <div class="font-medium text-slate-900 text-sm">{{ module.title }}</div>
                    <div class="text-xs text-slate-400 font-mono">{{ module.path }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <span v-if="module.show_on_mobile" class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-blue-700">
                      <Smartphone class="h-3 w-3" />
                    </span>
                    <span v-if="module.show_on_desktop" class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-green-700">
                      <Monitor class="h-3 w-3" />
                    </span>
                  </div>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                      module.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    ]"
                  >
                    {{ module.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                  <div class="flex items-center gap-1">
                    <button @click="handleEdit(module)" class="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                      <Pencil class="h-3.5 w-3.5" />
                    </button>
                    <button @click="handleDelete(module)" class="p-1.5 hover:bg-red-50 text-red-600 rounded">
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- Menu Module Form Modal -->
    <MenuModuleFormModal
      :is-open="modalOpen"
      :module="editingModule"
      @close="modalOpen = false"
      @save="handleSave"
    />

    <!-- Menu Group Form Modal -->
    <MenuGroupFormModal
      :is-open="groupModalOpen"
      :group="editingGroup"
      @close="groupModalOpen = false"
      @save="handleSaveGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft, Plus, Pencil, Trash2, Smartphone, Monitor, GripVertical, FolderPlus, Search } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import MenuModuleFormModal from '@/components/admin/MenuModuleFormModal.vue';
import MenuGroupFormModal from '@/components/admin/MenuGroupFormModal.vue';
import LucideIcon from '@/components/lucide/LucideIcon.vue';
import Swal from 'sweetalert2';

interface MenuModule {
  id: string;
  title: string;
  path: string;
  icon: string;
  order: number;
  group_ulid: string | null;
  group_label: string | null;
  group_icon: string | null;
  group?: string | null;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  is_active: boolean;
  permission_key: string | null;
  requires_staff: boolean;
  shortcut: string | null;
  parent_ulid: string | null;
  parent?: string | null;
}

interface MenuGroup {
  id: string;
  ulid: string;
  name: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  modules: MenuModule[];
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();
const groups = ref<MenuGroup[]>([]);
const ungroupedModules = ref<MenuModule[]>([]);
const allModules = ref<MenuModule[]>([]);
const allGroups = ref<MenuGroup[]>([]);
const isLoading = ref(false);
const modalOpen = ref(false);
const groupModalOpen = ref(false);
const editingModule = ref<MenuModule | null>(null);
const editingGroup = ref<MenuGroup | null>(null);
const searchQuery = ref('');

const fetchModules = async () => {
  isLoading.value = true;
  try {
    const [modulesResponse, groupsResponse] = await Promise.all([
      fetchApi<any>('/api/navigation/menu-modules/'),
      fetchApi<any>('/api/navigation/menu-groups/')
    ]);

    // Handle paginated response for modules
    const modulesData = Array.isArray(modulesResponse)
      ? modulesResponse
      : (modulesResponse?.results || []);
    const groupsData = Array.isArray(groupsResponse)
      ? groupsResponse
      : (groupsResponse?.results || []);

    console.log('MenuModulesView - modulesData:', modulesData);
    console.log('MenuModulesView - modulesData length:', modulesData.length);
    console.log('MenuModulesView - groupsResponse raw:', groupsResponse);
    console.log('MenuModulesView - groupsData:', groupsData);
    console.log('MenuModulesView - groupsData length:', groupsData.length);

    // Save original data
    allModules.value = modulesData;
    allGroups.value = groupsData;

    // Group modules by their group
    const grouped: MenuGroup[] = groupsData.map((group: MenuGroup) => ({
      ...group,
      modules: modulesData.filter((m: MenuModule) => m.group_ulid === group.ulid).sort((a: MenuModule, b: MenuModule) => a.order - b.order)
    })).filter((g: MenuGroup) => g.modules.length > 0);

    console.log('MenuModulesView - grouped:', grouped);

    // Sort groups by sort_order
    grouped.sort((a: MenuGroup, b: MenuGroup) => a.sort_order - b.sort_order);

    // Get ungrouped modules
    const ungrouped = modulesData.filter((m: MenuModule) => !m.group_ulid).sort((a: MenuModule, b: MenuModule) => a.order - b.order);

    console.log('MenuModulesView - ungrouped:', ungrouped);

    groups.value = grouped;
    ungroupedModules.value = ungrouped;
  } catch (e) {
    console.error('Failed to fetch modules:', e);
  } finally {
    isLoading.value = false;
  }
};

// Filter groups based on filtered modules
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return groups.value;
  }
  const query = searchQuery.value.toLowerCase();
  return groups.value
    .map((group: MenuGroup) => ({
      ...group,
      modules: group.modules.filter((m: MenuModule) =>
        m.title.toLowerCase().includes(query) ||
        m.path.toLowerCase().includes(query)
      )
    }))
    .filter((g: MenuGroup) => g.modules.length > 0);
});

// Filter ungrouped modules
const filteredUngroupedModules = computed(() => {
  if (!searchQuery.value.trim()) {
    return ungroupedModules.value;
  }
  const query = searchQuery.value.toLowerCase();
  return ungroupedModules.value.filter((m: MenuModule) =>
    m.title.toLowerCase().includes(query) ||
    m.path.toLowerCase().includes(query)
  );
});

// Helper to get group by ulid
const getGroupByUlid = (ulid: string) => {
  return allGroups.value.find((g: MenuGroup) => g.ulid === ulid);
};

const handleCreate = () => {
  editingModule.value = null;
  modalOpen.value = true;
};

const handleEdit = (module: MenuModule) => {
  editingModule.value = module;
  modalOpen.value = true;
};

const handleDelete = async (module: MenuModule) => {
  const result = await Swal.fire({
    title: '¿Confirmar eliminación?',
    text: `¿Eliminar el módulo "${module.title}" permanentemente?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await fetchApi(`/api/navigation/menu-modules/${module.id}/`, {
      method: 'DELETE',
    });
    notifySuccess(`Módulo "${module.title}" eliminado exitosamente`);
    await fetchModules();
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando módulo');
  }
};

const handleSave = async (formData: Partial<MenuModule>) => {
  try {
    console.log('MenuModulesView - handleSave - formData:', formData);
    console.log('MenuModulesView - handleSave - formData.group:', formData.group, 'type:', typeof formData.group);

    // Transform group object to ULID string if needed
    const payload = { ...formData };
    if (payload.group && typeof payload.group === 'object' && 'ulid' in payload.group) {
      payload.group = (payload.group as any).ulid;
    }
    // Transform parent object to ULID string if needed
    if (payload.parent && typeof payload.parent === 'object' && 'ulid' in payload.parent) {
      payload.parent = (payload.parent as any).ulid;
    }

    console.log('MenuModulesView - handleSave - payload after transform:', payload);

    if (editingModule.value) {
      await fetchApi<MenuModule>(`/api/navigation/menu-modules/${editingModule.value.id}/`, {
        method: 'PUT',
        data: payload,
      });
      notifySuccess('Módulo actualizado exitosamente');
    } else {
      await fetchApi<MenuModule>('/api/navigation/menu-modules/', {
        method: 'POST',
        data: payload,
      });
      notifySuccess('Módulo creado exitosamente');
    }
    modalOpen.value = false;
    await fetchModules();
  } catch (err: any) {
    notifyError(err?.message || 'Error guardando módulo');
    throw err;
  }
};

const handleCreateGroup = () => {
  editingGroup.value = null;
  groupModalOpen.value = true;
};

const handleEditGroup = (group: MenuGroup) => {
  editingGroup.value = group;
  groupModalOpen.value = true;
};

const handleDeleteGroup = async (group: MenuGroup) => {
  const result = await Swal.fire({
    title: '¿Confirmar eliminación?',
    text: `¿Eliminar el grupo "${group.label}" y todos sus módulos?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await fetchApi(`/api/navigation/menu-groups/${group.ulid}/`, {
      method: 'DELETE',
    });
    notifySuccess(`Grupo "${group.label}" eliminado exitosamente`);
    await fetchModules();
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando grupo');
  }
};

const handleSaveGroup = async (formData: Partial<MenuGroup>) => {
  try {
    if (editingGroup.value) {
      await fetchApi<MenuGroup>(`/api/navigation/menu-groups/${editingGroup.value.id}/`, {
        method: 'PUT',
        data: formData,
      });
      notifySuccess('Grupo actualizado exitosamente');
    } else {
      await fetchApi<MenuGroup>('/api/navigation/menu-groups/', {
        method: 'POST',
        data: formData,
      });
      notifySuccess('Grupo creado exitosamente');
    }
    groupModalOpen.value = false;
    await fetchModules();
  } catch (err: any) {
    notifyError(err?.message || 'Error guardando grupo');
    throw err;
  }
};

const onGroupReorder = async () => {
  // Update sort_order for all groups
  try {
    for (let i = 0; i < groups.value.length; i++) {
      const group = groups.value[i];
      if (group.sort_order !== i + 1) {
        await fetchApi(`/api/navigation/menu-groups/${group.ulid}/`, {
          method: 'PATCH',
          data: { sort_order: i + 1 },
        });
      }
    }
    notifySuccess('Orden de grupos actualizado');
  } catch (err: any) {
    notifyError(err?.message || 'Error actualizando orden');
    await fetchModules();
  }
};

const onModuleReorder = async (group: MenuGroup) => {
  // Update order for modules within the group
  try {
    for (let i = 0; i < group.modules.length; i++) {
      const module = group.modules[i];
      if (module.order !== i) {
        await fetchApi(`/api/navigation/menu-modules/${module.id}/`, {
          method: 'PATCH',
          data: { order: i },
        });
      }
    }
  } catch (err: any) {
    notifyError(err?.message || 'Error actualizando orden');
    await fetchModules();
  }
};

const onUngroupedModuleReorder = async () => {
  // Update order for ungrouped modules
  try {
    for (let i = 0; i < ungroupedModules.value.length; i++) {
      const module = ungroupedModules.value[i];
      if (module.order !== i) {
        await fetchApi(`/api/navigation/menu-modules/${module.id}/`, {
          method: 'PATCH',
          data: { order: i },
        });
      }
    }
  } catch (err: any) {
    notifyError(err?.message || 'Error actualizando orden');
    await fetchModules();
  }
};

onMounted(fetchModules);
</script>
