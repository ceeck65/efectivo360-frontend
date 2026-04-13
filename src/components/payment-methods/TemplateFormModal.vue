<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-content">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ template ? `Editar ${template.name}` : 'Nueva Plantilla Global' }}
          </h2>
          <button @click="$emit('close')" class="rounded-full p-2 hover:bg-gray-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="label">Nombre *</label>
              <input
                v-model="formData.name"
                class="input"
                placeholder="Ej: Banesco"
                required
              />
            </div>
            
            <div class="space-y-2">
              <label class="label">Slug *</label>
              <input
                v-model="formData.slug"
                class="input"
                placeholder="Ej: banesco"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="label">Categoría *</label>
              <select
                v-model="formData.category_id"
                class="input"
                :disabled="categoriesLoading"
                required
              >
                <option value="">{{ categoriesLoading ? 'Cargando...' : 'Seleccione categoría' }}</option>
                <option v-for="cat in configStore.paymentCategories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="label">Tipo de Pago *</label>
              <select v-model="formData.payment_type_id" class="input" required>
                <option value="">Seleccione tipo</option>
                <option v-for="opt in configStore.paymentTypes" :key="opt.id" :value="opt.id">
                  {{ opt.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="label">Moneda *</label>
              <select
                v-model="formData.currency_id"
                class="input"
                :disabled="currenciesLoading"
                required
              >
                <option value="">{{ currenciesLoading ? 'Cargando...' : 'Seleccione moneda' }}</option>
                <option v-for="curr in configStore.currencies" :key="curr.id" :value="curr.id">
                  {{ curr.code }} - {{ curr.name }}
                </option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="label">Orden de Visualización</label>
              <input
                v-model.number="formData.sort_order"
                type="number"
                class="input"
                min="0"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="label">Color de Marca</label>
            <ColorPicker v-model="formData.brand_color" />
          </div>

          <div class="space-y-2">
            <label class="label">Logo</label>
            <div class="flex items-center gap-4">
              <div v-if="logoPreview" class="relative">
                <img
                  :src="getLogoUrl(logoPreview)"
                  alt="Preview"
                  class="h-20 w-20 rounded-lg object-contain bg-gray-50 border"
                />
                <button
                  type="button"
                  @click="clearLogo"
                  class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>
              <div v-else class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <ImageIcon class="h-8 w-8 text-gray-400" />
              </div>
              
              <div class="flex-1">
                <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 hover:bg-gray-50">
                  <Upload class="h-4 w-4" />
                  <span class="text-sm">{{ logoFile ? logoFile.name : 'Subir logo (PNG, JPG, SVG)' }}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    @change="handleFileChange"
                    class="hidden"
                  />
                </label>
                <p class="mt-1 text-xs text-gray-500">Máx. 2MB. Formatos: PNG, JPG, SVG, WEBP</p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="label">Descripción</label>
            <textarea
              v-model="formData.description"
              class="input"
              placeholder="Descripción del método de pago..."
              rows="2"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              :checked="formData.is_active"
              @change="formData.is_active = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              id="is_active"
              class="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
            />
            <label for="is_active" class="text-sm text-gray-700 cursor-pointer">Activo</label>
          </div>

          <MetadataBuilder v-model="formData.required_metadata.fields" />

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" :disabled="loading" class="btn-primary gap-2">
              <span v-if="loading">Guardando...</span>
              <template v-else>
                <Check class="h-4 w-4" />
                {{ template ? 'Actualizar' : 'Crear' }}
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-vue-next';
import { useConfigStore } from '@/stores/config';
import type { PaymentMethodTemplate, MetadataField } from '@/types';
import { parseMetadata } from '@/utils/metadata';
import ColorPicker from './ColorPicker.vue';
import MetadataBuilder from './MetadataBuilder.vue';
import { useStaffPaymentTemplates } from '@/composables/useStaffPaymentTemplates';

interface FormDataState {
  name: string;
  slug: string;
  brand_color: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  required_metadata: { fields: MetadataField[] };
  // FK IDs para el serializer (category_id, payment_type_id, currency_id)
  currency_id: number | null;
  category_id: number | null;
  payment_type_id: number | null;
}

const props = defineProps<{
  isOpen: boolean;
  template: PaymentMethodTemplate | null;
  currenciesLoading: boolean;
  categoriesLoading: boolean;
}>();


const {
  apiBaseUrl,
} = useStaffPaymentTemplates();

// Helper to build full logo URL
const getLogoUrl = (logoPath: string | null): string => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http') || logoPath.startsWith('blob:')) return logoPath;
  return `${apiBaseUrl}${logoPath}`;
};

const emit = defineEmits<{
  close: [];
  save: [data: FormData];
}>();

const configStore = useConfigStore();

const defaultForm: FormDataState = {
  name: '',
  slug: '',
  brand_color: '#3b82f6',
  description: '',
  sort_order: 0,
  is_active: true,
  required_metadata: { fields: [] },
  currency_id: null,
  category_id: null,
  payment_type_id: null,
};

const formData = ref<FormDataState>({ ...defaultForm });
const logoFile = ref<File | null>(null);
const logoPreview = ref<string>('');
const loading = ref(false);

watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    formData.value = {
      name: newTemplate.name,
      slug: newTemplate.slug,
      brand_color: newTemplate.brand_color,
      description: newTemplate.description,
      sort_order: newTemplate.sort_order,
      is_active: newTemplate.is_active,
      required_metadata: parseMetadata(newTemplate.required_metadata),
      // FK IDs desde los objetos anidados
      currency_id: newTemplate.currency?.id || null,
      category_id: newTemplate.category?.id || null,
      payment_type_id: newTemplate.payment_type?.id || null,
    };
    logoPreview.value = newTemplate.logo;
    logoFile.value = null;
  } else {
    formData.value = { ...defaultForm };
    logoPreview.value = '';
    logoFile.value = null;
  }
}, { immediate: true });

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Formato no válido. Use PNG, JPG, SVG o WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo no debe superar 2MB');
      return;
    }
    logoFile.value = file;
    logoPreview.value = URL.createObjectURL(file);
  }
};

const clearLogo = () => {
  logoFile.value = null;
  logoPreview.value = props.template?.logo || '';
};

const handleSubmit = async () => {
  loading.value = true;
  
  try {
    const submitData = new FormData();
    submitData.append('name', formData.value.name);
    submitData.append('slug', formData.value.slug);
    submitData.append('brand_color', formData.value.brand_color);
    
    // FK IDs para el serializer (campos obligatorios: category_id, payment_type_id)
    if (formData.value.currency_id) {
      submitData.append('currency_id', String(formData.value.currency_id));
    }
    if (formData.value.category_id) {
      submitData.append('category_id', String(formData.value.category_id));
    }
    if (formData.value.payment_type_id) {
      submitData.append('payment_type_id', String(formData.value.payment_type_id));
    }
    
    submitData.append('description', formData.value.description);
    submitData.append('sort_order', String(formData.value.sort_order));
    submitData.append('is_active', String(formData.value.is_active));
    submitData.append('required_metadata', JSON.stringify(formData.value.required_metadata));
    
    if (logoFile.value) {
      submitData.append('logo', logoFile.value);
    }
    
    emit('save', submitData);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51, 65, 85);
  margin-bottom: 0.25rem;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: rgb(243, 244, 246);
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51, 65, 85);
  background: white;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background: rgb(248, 250, 252);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: rgb(15, 23, 42);
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: rgb(30, 41, 59);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
