<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-900">
          {{ module ? 'Editar Módulo' : 'Nuevo Módulo' }}
        </h2>
        <button
          @click="handleClose"
          class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Two Column Layout -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Left Column -->
          <div class="space-y-4">
            <!-- Title Field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Título
              </label>
              <input
                v-model="form.title"
                type="text"
                class="input-field"
                placeholder="Ej: Dashboard"
              />
              <p v-if="errors.title" class="text-sm text-red-500">{{ errors.title }}</p>
            </div>

            <!-- Path Field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Ruta
              </label>
              <input
                v-model="form.path"
                type="text"
                class="input-field"
                placeholder="Ej: /dashboard"
              />
              <p v-if="errors.path" class="text-sm text-red-500">{{ errors.path }}</p>
            </div>

            <!-- Order Field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Orden
              </label>
              <input
                v-model.number="form.order"
                type="number"
                class="input-field"
                placeholder="Ej: 1"
              />
              <p v-if="errors.order" class="text-sm text-red-500">{{ errors.order }}</p>
            </div>

            <!-- Device Toggles -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <input
                  id="show_on_mobile"
                  v-model="form.show_on_mobile"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <label for="show_on_mobile" class="text-sm text-slate-700">
                  Mostrar en Mobile
                </label>
              </div>
              <div class="flex items-center gap-3">
                <input
                  id="show_on_desktop"
                  v-model="form.show_on_desktop"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <label for="show_on_desktop" class="text-sm text-slate-700">
                  Mostrar en Desktop
                </label>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <!-- Icon Picker -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Icono
              </label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    v-model="form.icon"
                    type="text"
                    class="input-field pr-10"
                    placeholder="Ej: LayoutDashboard"
                    readonly
                    @click="showIconPicker = true"
                  />
                  <button
                    type="button"
                    @click="showIconPicker = true"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <Search class="h-4 w-4" />
                  </button>
                </div>
                <div v-if="form.icon" class="flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 bg-slate-50">
                  <LucideIcon :name="form.icon" :size="20" />
                </div>
              </div>
              <p v-if="errors.icon" class="text-sm text-red-500">{{ errors.icon }}</p>
            </div>

            <!-- Group Field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Grupo
              </label>
              <div class="flex gap-2">
                <select
                  v-model="form.group_ulid"
                  class="input-field flex-1"
                >
                  <option :value="null">Sin grupo</option>
                  <option
                    v-for="group in availableGroups"
                    :key="group.ulid"
                    :value="group.ulid"
                  >
                    {{ group.label }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="handleQuickAddGroup"
                  class="inline-flex items-center justify-center w-10 h-9 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  title="Crear nuevo grupo"
                >
                  <Plus class="h-4 w-4" />
                </button>
              </div>
              <p class="text-xs text-slate-500">Selecciona un grupo existente o crea uno nuevo</p>
            </div>

            <!-- App Module Field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">
                Módulo de Aplicación
              </label>
              <select
                v-model="form.app_module_ulid"
                class="input-field"
              >
                <option :value="null">Sin módulo de aplicación</option>
                <option
                  v-for="appModule in availableAppModules"
                  :key="appModule.ulid"
                  :value="appModule.ulid"
                >
                  {{ appModule.name }}
                </option>
              </select>
              <p class="text-xs text-slate-500">Vincula este ítem de menú a un módulo de aplicación del catálogo</p>
            </div>

            <!-- Active Toggle -->
            <div class="flex items-center gap-3 py-2">
              <input
                id="is_active"
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              <label for="is_active" class="text-sm text-slate-700">
                Activo
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-primary gap-2"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ module ? 'Guardar cambios' : 'Crear módulo' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Menu Group Form Modal -->
    <MenuGroupFormModal
      :is-open="groupModalOpen"
      :group="null"
      @close="groupModalOpen = false"
      @save="handleGroupSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { X, Loader2, Search, Plus } from 'lucide-vue-next';
import LucideIcon from '@/components/lucide/LucideIcon.vue';
import { useApi } from '@/composables/useApi';
import MenuGroupFormModal from './MenuGroupFormModal.vue';

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
  parent_ulid: string | null;
  parent?: string | null;
  app_module_ulid: string | null;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  is_active: boolean;
  permission_key: string | null;
  requires_staff: boolean;
  shortcut: string | null;
}

interface MenuGroup {
  id: string;
  ulid: string;
  name: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface AppModule {
  id: string;
  ulid: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  module: MenuModule | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: Partial<MenuModule>): void;
}>();

const { fetchApi } = useApi();

const showIconPicker = ref(false);
const availableGroups = ref<MenuGroup[]>([]);
const availableAppModules = ref<AppModule[]>([]);
const groupModalOpen = ref(false);
const isSubmitting = ref(false);

const errors = reactive<Record<string, string>>({});

const form = reactive({
  title: '',
  path: '',
  icon: '',
  order: 0,
  group_ulid: null as string | null,
  app_module_ulid: null as string | null,
  show_on_mobile: true,
  show_on_desktop: true,
  is_active: true,
});

const fetchGroups = async () => {
  try {
    console.log('MenuModuleFormModal: Fetching groups from /api/navigation/menu-groups/');
    const response = await fetchApi<any>('/api/navigation/menu-groups/');
    console.log('MenuModuleFormModal: Groups response:', response);
    // Handle paginated response
    const groupsData = Array.isArray(response)
      ? response
      : (response?.results || []);
    availableGroups.value = groupsData;
    console.log('MenuModuleFormModal: availableGroups set to:', availableGroups.value);
  } catch (e) {
    console.error('MenuModuleFormModal: Failed to fetch groups:', e);
    availableGroups.value = [];
  }
};

const fetchAppModules = async () => {
  try {
    console.log('MenuModuleFormModal: Fetching app modules from /api/v1/app-modules/');
    const response = await fetchApi<any>('/api/v1/app-modules/');
    console.log('MenuModuleFormModal: App modules response:', response);
    // Handle paginated response
    const modulesData = Array.isArray(response)
      ? response
      : (response?.results || []);
    availableAppModules.value = modulesData;
    console.log('MenuModuleFormModal: availableAppModules set to:', availableAppModules.value);
  } catch (e) {
    console.error('MenuModuleFormModal: Failed to fetch app modules:', e);
    availableAppModules.value = [];
  }
};

const handleQuickAddGroup = () => {
  groupModalOpen.value = true;
};

const handleGroupSaved = (groupData: Partial<MenuGroup>) => {
  fetchGroups();
  if (groupData.name) {
    const newGroup = availableGroups.value.find(g => g.name === groupData.name);
    if (newGroup) {
      form.group_ulid = newGroup.ulid;
    }
  }
  groupModalOpen.value = false;
};

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);

  if (!form.title.trim()) {
    errors.title = 'El título es requerido';
  }
  if (!form.path.trim()) {
    errors.path = 'La ruta es requerida';
  }
  if (!form.icon.trim()) {
    errors.icon = 'El icono es requerido';
  }
  if (form.order < 0) {
    errors.order = 'El orden debe ser un número positivo';
  }

  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    console.log('MenuModuleFormModal - form.group_ulid:', form.group_ulid, 'type:', typeof form.group_ulid);
    const payload = {
      title: form.title.trim(),
      path: form.path.trim(),
      icon: form.icon.trim(),
      order: form.order,
      group: form.group_ulid || null, // Use 'group' field for API
      app_module_ulid: form.app_module_ulid || null,
      show_on_mobile: form.show_on_mobile,
      show_on_desktop: form.show_on_desktop,
      is_active: form.is_active,
    };
    console.log('MenuModuleFormModal - Enviando datos:', payload);
    emit('save', payload);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

// Watch for module changes to populate form
watch(
  () => props.module,
  (newModule) => {
    if (newModule) {
      form.title = newModule.title;
      form.path = newModule.path;
      form.icon = newModule.icon;
      form.order = newModule.order;
      form.group_ulid = newModule.group_ulid;
      form.app_module_ulid = newModule.app_module_ulid;
      form.show_on_mobile = newModule.show_on_mobile;
      form.show_on_desktop = newModule.show_on_desktop;
      form.is_active = newModule.is_active;
    } else {
      form.title = '';
      form.path = '';
      form.icon = '';
      form.order = 0;
      form.group_ulid = null;
      form.app_module_ulid = null;
      form.show_on_mobile = true;
      form.show_on_desktop = true;
      form.is_active = true;
    }
    // Clear errors
    Object.keys(errors).forEach(k => delete errors[k]);
  },
  { immediate: true }
);

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchGroups();
    fetchAppModules();
  }
});
</script>

<style scoped>
.input-field {
  @apply flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400;
  @apply focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0;
  @apply disabled:cursor-not-allowed disabled:opacity-50;
}

.btn-primary {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium;
  @apply bg-brand-primary text-white hover:bg-brand-primary/90;
  @apply h-10 px-4 py-2 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium;
  @apply border border-slate-200 bg-white text-slate-700 hover:bg-slate-50;
  @apply h-10 px-4 py-2 transition-colors;
}
</style>
