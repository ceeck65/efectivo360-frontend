<template>
  <div class="min-h-screen bg-slate-50/50 p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RouterLink
            to="/admin"
            class="rounded-lg p-2 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Catálogo Maestro de Métodos de Pago</h1>
            <p class="text-sm text-slate-500">
              Gestión exclusiva para Staff de Efectivo 360
            </p>
          </div>
        </div>
        
        <button 
          @click="handleCreate" 
          class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus class="h-4 w-4" />
          Nueva Plantilla
        </button>
      </div>

      <!-- Templates Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-[200px] animate-pulse bg-slate-200 rounded-lg" />
      </div>

      <!-- Empty State -->
      <div v-else-if="templates.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <ImageIcon class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="text-lg font-medium text-slate-900">No hay plantillas</h3>
        <p class="mt-1 text-sm text-slate-500">
          Crea la primera plantilla global para métodos de pago.
        </p>
        <button 
          @click="handleCreate" 
          class="mt-4 inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus class="h-4 w-4" />
          Crear plantilla
        </button>
      </div>

      <!-- Cards Grid -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="template in templates"
          :key="template.id"
          class="group relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-lg"
        >
          <!-- Brand Color Bar -->
          <div
            class="absolute left-0 top-0 h-full w-1"
            :style="{ backgroundColor: template.brand_color }"
          />
          
          <!-- Card Header -->
          <div class="p-6 pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <img
                  v-if="template.logo"
                  :src="getLogoUrl(template.logo)"
                  :alt="template.name"
                  class="h-12 w-12 rounded-lg object-contain bg-white shadow-sm"
                />
                <div
                  v-else
                  class="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm"
                  :style="{ backgroundColor: template.brand_color }"
                >
                  <ImageIcon class="h-6 w-6" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ template.name }}</h3>
                  <p class="text-sm text-slate-500">@{{ template.slug }}</p>
                </div>
              </div>
              
              <!-- Actions - appear on hover -->
              <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  @click="handleEdit(template)"
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(template)"
                  class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Card Content -->
          <div class="px-6 pb-6 space-y-3">
            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                :style="{ borderColor: template.brand_color, color: template.brand_color }"
              >
                {{ template.category?.name || 'Sin categoría' }}
              </span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                {{ template.payment_type?.name || 'Inmediato' }}
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  template.currency?.code === 'USD'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                ]"
              >
                {{ template.currency?.code || 'VES' }}
              </span>
              <span
                v-if="!template.is_active"
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700"
              >
                Inactivo
              </span>
            </div>
            
            <!-- Description -->
            <p v-if="template.description" class="text-sm text-slate-600 line-clamp-2">
              {{ template.description }}
            </p>
            
            <!-- Footer -->
            <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Orden: {{ template.sort_order }}</span>
              <span v-if="getMetadataFieldsCount(template) > 0">
                {{ getMetadataFieldsCount(template) }} campos requeridos
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Modal -->
      <TemplateFormModal
        :is-open="modalOpen"
        :template="editingTemplate"
        :currencies-loading="currenciesLoading"
        :categories-loading="categoriesLoading"
        @close="modalOpen = false"
        @save="handleSave"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, ImageIcon, Pencil, Trash2 } from 'lucide-vue-next';
import { useStaffPaymentTemplates } from '@/composables/useStaffPaymentTemplates';
import { useConfigStore } from '@/stores/config';
import { useNotify } from '@/composables/useNotify';
import type { PaymentMethodTemplate } from '@/types';
import TemplateFormModal from '@/components/payment-methods/TemplateFormModal.vue';
import Swal from 'sweetalert2';

const {
  templates,
  isLoading,
  loadTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = useStaffPaymentTemplates();
const configStore = useConfigStore();
const { success: notifySuccess, error: notifyError } = useNotify();

// Helper to build full logo URL
const getLogoUrl = (logoPath: string | null): string => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http')) return logoPath;
  // Use /media/ path through nginx proxy
  return logoPath.startsWith('/') ? logoPath : `/media/${logoPath}`;
};
const modalOpen = ref(false);
const editingTemplate = ref<PaymentMethodTemplate | null>(null);
const currenciesLoading = ref(false);
const categoriesLoading = ref(false);

const loadCatalogs = async () => {
  currenciesLoading.value = true;
  categoriesLoading.value = true;
  
  if (!configStore.isInitialized) {
    await configStore.initialize();
  }
  
  currenciesLoading.value = false;
  categoriesLoading.value = false;
};

onMounted(() => {
  loadTemplates();
  loadCatalogs();
});

const handleCreate = () => {
  editingTemplate.value = null;
  modalOpen.value = true;
};

const handleEdit = (template: PaymentMethodTemplate) => {
  editingTemplate.value = template;
  modalOpen.value = true;
};

const handleDelete = async (template: PaymentMethodTemplate) => {
  const result = await Swal.fire({
    title: '¿Eliminar plantilla?',
    text: `Se eliminará permanentemente "${template.name}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    await deleteTemplate(template.id);
    notifySuccess(`Plantilla "${template.name}" eliminada`);
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando plantilla');
  }
};

const handleSave = async (formData: FormData) => {
  try {
    if (editingTemplate.value) {
      await updateTemplate(editingTemplate.value.id, formData);
      notifySuccess(`Plantilla "${editingTemplate.value.name}" actualizada`);
    } else {
      const result = await createTemplate(formData);
      notifySuccess(`Plantilla "${result.name}" creada`);
    }
    modalOpen.value = false;
    await loadTemplates();
  } catch (err: any) {
    const msg = err?.message || err?.error || 'Error guardando plantilla';
    if (msg.includes('slug') && msg.includes('existe')) {
      notifyError('El identificador (slug) ya existe. Use uno diferente.');
    } else {
      notifyError(msg);
    }
    throw err;
  }
};

const getMetadataFieldsCount = (template: PaymentMethodTemplate): number => {
  if (!template.required_metadata) return 0;
  if (typeof template.required_metadata === 'string') {
    try {
      const parsed = JSON.parse(template.required_metadata);
      return parsed.fields?.length || 0;
    } catch {
      return 0;
    }
  }
  return (template.required_metadata as { fields?: any[] }).fields?.length || 0;
};
</script>
