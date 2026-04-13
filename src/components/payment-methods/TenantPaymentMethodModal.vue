<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-content max-w-lg">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ method ? 'Editar Método de Cobro' : 'Nuevo Método de Cobro' }}
          </h2>
          <button @click="$emit('close')" class="rounded-full p-2 hover:bg-gray-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Template Selection -->
          <div v-if="!method" class="space-y-2">
            <label class="label">Método de Pago *</label>
            <select v-model="formData.template_id" class="input" required>
              <option value="">Seleccione un método</option>
              <option v-for="template in availableTemplates" :key="template.id" :value="template.id">
                {{ template.name }} ({{ template.category?.name || 'Sin categoría' }})
              </option>
            </select>
            <p class="text-xs text-slate-500">
              Elige la plantilla base para tu método de cobro
            </p>
          </div>

          <div v-else class="space-y-2">
            <label class="label">Método de Pago</label>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <img
                v-if="method.template?.logo"
                :src="method.template.logo"
                class="h-8 w-8 rounded object-contain"
              />
              <span class="font-medium">{{ method.template?.name }}</span>
            </div>
          </div>

          <!-- Display Name -->
          <div class="space-y-2">
            <label class="label">Nombre para mostrar *</label>
            <input
              v-model="formData.display_name"
              class="input"
              placeholder="Ej: Pago por Zelle - Mi Empresa"
              required
            />
            <p class="text-xs text-slate-500">
              Este es el nombre que verán tus clientes
            </p>
          </div>

          <!-- Account Data Fields -->
          <div v-if="selectedTemplate" class="space-y-3 border-t border-slate-200 pt-4">
            <label class="label">Datos de tu cuenta</label>
            <p class="text-xs text-slate-500 mb-2">
              Configura los datos necesarios para recibir pagos
            </p>

            <div
              v-for="field in metadataFields"
              :key="field.name"
              class="space-y-1"
            >
              <label class="text-sm font-medium text-slate-700">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              <input
                v-if="field.type === 'text' || field.type === 'email' || field.type === 'tel'"
                v-model="accountData[field.name]"
                :type="field.type"
                class="input"
                :placeholder="field.default || ''"
                :required="field.required"
              />
              <select
                v-else-if="field.type === 'select'"
                v-model="accountData[field.name]"
                class="input"
                :required="field.required"
              >
                <option value="">Seleccione...</option>
                <option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
          </div>

          <!-- Instructions -->
          <div class="space-y-2">
            <label class="label">Instrucciones para el cliente</label>
            <textarea
              v-model="formData.display_instructions"
              class="input"
              placeholder="Ej: Envía el comprobante por WhatsApp al +58..."
              rows="2"
            />
          </div>

          <!-- Settings -->
          <div class="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
            <div class="space-y-2">
              <label class="label">Monto mínimo (opcional)</label>
              <input
                v-model.number="formData.minimum_amount"
                type="number"
                class="input"
                min="0"
                step="0.01"
              />
            </div>
            <div class="space-y-2">
              <label class="label">Monto máximo (opcional)</label>
              <input
                v-model.number="formData.maximum_amount"
                type="number"
                class="input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="label">Tiempo de confirmación (minutos)</label>
            <input
              v-model.number="formData.confirmation_time_minutes"
              type="number"
              class="input"
              min="5"
              max="1440"
            />
            <p class="text-xs text-slate-500">
              Tiempo máximo para confirmar un pago antes de marcarlo como pendiente
            </p>
          </div>

          <!-- Toggles -->
          <div class="space-y-3 border-t border-slate-200 pt-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.is_active"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300"
              />
              <span class="text-sm text-slate-700">Método activo</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.requires_confirmation"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300"
              />
              <span class="text-sm text-slate-700">Requiere confirmación manual</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" :disabled="loading" class="btn-primary gap-2">
              <span v-if="loading">Guardando...</span>
              <template v-else>
                <Check class="h-4 w-4" />
                {{ method ? 'Actualizar' : 'Crear' }}
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, Check } from 'lucide-vue-next';
import { useConfigStore } from '@/stores/config';
import type { TenantPaymentMethod, TenantPaymentMethodFormData, PaymentMethodTemplate, MetadataField } from '@/types';
import { parseMetadata } from '@/utils/metadata';

const props = defineProps<{
  isOpen: boolean;
  method: TenantPaymentMethod | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: TenantPaymentMethodFormData];
}>();

const configStore = useConfigStore();

const formData = ref<TenantPaymentMethodFormData>({
  template_id: 0,
  account_data: {},
  display_name: '',
  display_instructions: '',
  is_active: true,
  sort_order: 0,
  requires_confirmation: true,
  confirmation_time_minutes: 30,
});

const accountData = ref<Record<string, string>>({});
const loading = ref(false);

const availableTemplates = computed<PaymentMethodTemplate[]>(() => {
  return configStore.paymentCategories
    .flatMap(() => {
      // Esto es un mock - en realidad vendría de un endpoint de templates
      return [] as PaymentMethodTemplate[];
    })
    .filter(t => t.is_active);
});

const selectedTemplate = computed<PaymentMethodTemplate | null>(() => {
  if (!props.method?.template && !formData.value.template_id) return null;
  return props.method?.template || availableTemplates.value.find(t => t.id === formData.value.template_id) || null;
});

const metadataFields = computed<MetadataField[]>(() => {
  if (!selectedTemplate.value) return [];
  return parseMetadata(selectedTemplate.value.required_metadata).fields;
});

watch(() => props.method, (newMethod) => {
  if (newMethod) {
    formData.value = {
      template_id: newMethod.template_id,
      account_data: { ...newMethod.account_data },
      display_name: newMethod.display_name,
      display_instructions: newMethod.display_instructions,
      is_active: newMethod.is_active,
      sort_order: newMethod.sort_order,
      commission_rate: newMethod.commission_rate,
      minimum_amount: newMethod.minimum_amount,
      maximum_amount: newMethod.maximum_amount,
      requires_confirmation: newMethod.requires_confirmation,
      confirmation_time_minutes: newMethod.confirmation_time_minutes || 30,
    };
    accountData.value = { ...newMethod.account_data };
  } else {
    formData.value = {
      template_id: 0,
      account_data: {},
      display_name: '',
      display_instructions: '',
      is_active: true,
      sort_order: 0,
      requires_confirmation: true,
      confirmation_time_minutes: 30,
    };
    accountData.value = {};
  }
}, { immediate: true });

watch(accountData, (newData) => {
  formData.value.account_data = { ...newData };
}, { deep: true });

const handleSubmit = async () => {
  loading.value = true;
  try {
    emit('save', { ...formData.value });
    emit('close');
  } finally {
    loading.value = false;
  }
};
</script>
