<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#141824]">
      <!-- Header -->
      <div class="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10 dark:border-white/[0.06] dark:bg-[#141824]">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Crear tipo de comercio</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Crea un blueprint base. Luego podrás ampliar categorías desde configuración de módulos.
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-6">
        <!-- Código y Nombre -->
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
            <input
              v-model="form.code"
              type="text"
              placeholder="ej: bodega"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="ej: Bodega"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>

        <!-- Icono y Features -->
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono</label>
            <input
              v-model="form.icon"
              type="text"
              placeholder="ej: store"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Features</label>
            <input
              v-model="form.required_features"
              type="text"
              placeholder="Separadas por coma (ej: balanza,variantes)"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>

        <!-- Categorías Iniciales -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Categorías Iniciales Auto-Creadas
          </label>
          <TagsInput
            :tags="form.default_categories"
            @update:tags="form.default_categories = $event"
            placeholder="Escribe categoría y presiona Enter (ej: Frenos, Motor...)"
          />
        </div>

        <!-- Condicionales de Negocio -->
        <div>
          <h3 class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Condicionales de Negocio</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/[0.06]">
              <span class="flex items-center text-sm text-slate-700 dark:text-slate-300">
                Venta Fraccionada
                <span :title="'Permite vender cantidades decimales como 0.5 kg o 1.25 litros.'" class="ml-1 inline-flex cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Info class="h-4 w-4" />
                </span>
              </span>
              <button
                @click="form.business_conditions!.fractional_sale = !form.business_conditions!.fractional_sale"
                :class="[
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                  form.business_conditions!.fractional_sale ? 'bg-green-600' : 'bg-slate-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    form.business_conditions!.fractional_sale ? 'translate-x-4' : 'translate-x-0.5'
                  ]"
                />
              </button>
            </label>
            <label class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/[0.06]">
              <span class="flex items-center text-sm text-slate-700 dark:text-slate-300">
                Gestión de Servicios
                <span :title="'Habilita la venta de tiempo/mano de obra.'" class="ml-1 inline-flex cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Info class="h-4 w-4" />
                </span>
              </span>
              <button
                @click="form.business_conditions!.service_management = !form.business_conditions!.service_management"
                :class="[
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                  form.business_conditions!.service_management ? 'bg-green-600' : 'bg-slate-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    form.business_conditions!.service_management ? 'translate-x-4' : 'translate-x-0.5'
                  ]"
                />
              </button>
            </label>
            <label class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/[0.06]">
              <span class="flex items-center text-sm text-slate-700 dark:text-slate-300">
                Control de Atributos
                <span :title="'Habilita Tallas/Colores por defecto.'" class="ml-1 inline-flex cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Info class="h-4 w-4" />
                </span>
              </span>
              <button
                @click="form.business_conditions!.attribute_control = !form.business_conditions!.attribute_control"
                :class="[
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                  form.business_conditions!.attribute_control ? 'bg-green-600' : 'bg-slate-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    form.business_conditions!.attribute_control ? 'translate-x-4' : 'translate-x-0.5'
                  ]"
                />
              </button>
            </label>
            <label class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/[0.06]">
              <span class="flex items-center text-sm text-slate-700 dark:text-slate-300">
                Trazabilidad
                <span :title="'Requiere fecha de vencimiento y/o número de lote.'" class="ml-1 inline-flex cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Info class="h-4 w-4" />
                </span>
              </span>
              <button
                @click="form.business_conditions!.traceability = !form.business_conditions!.traceability"
                :class="[
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                  form.business_conditions!.traceability ? 'bg-green-600' : 'bg-slate-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                    form.business_conditions!.traceability ? 'translate-x-4' : 'translate-x-0.5'
                  ]"
                />
              </button>
            </label>
          </div>
        </div>

        <!-- Schema de Productos (Campos Dinámicos) -->
        <div>
          <h3 class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Schema de Productos</h3>
          <ProductSchemaEditor
            :schema="form.product_schema"
            @update:schema="form.product_schema = $event"
          />
        </div>

        <!-- Activo -->
        <label class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 dark:border-white/[0.06]">
          <span class="text-sm text-slate-700 dark:text-slate-300">Activo</span>
          <button
            @click="form.is_active = !form.is_active"
            :class="[
              'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
              form.is_active ? 'bg-green-600' : 'bg-slate-200'
            ]"
          >
            <span
              :class="[
                'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                form.is_active ? 'translate-x-4' : 'translate-x-0.5'
              ]"
            />
          </button>
        </label>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <button
          @click="$emit('close')"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {{ saving ? 'Guardando...' : 'Crear tipo de comercio' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Modal para crear blueprint
 * @module @modules/blueprints/components/CreateBlueprintModal
 */
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { BlueprintCreateData, BusinessConditions } from '../types';
import { Info } from 'lucide-vue-next';
import TagsInput from '@/components/shared/TagsInput.vue';
import ProductSchemaEditor from '@/components/shared/ProductSchemaEditor.vue';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [];
}>();

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const saving = ref(false);

const defaultForm: BlueprintCreateData = {
  code: '',
  name: '',
  icon: '',
  is_active: true,
  required_features: [],
  category_structure: [],
  default_categories: [],
  business_conditions: {
    fractional_sale: false,
    service_management: false,
    attribute_control: false,
    traceability: false,
  },
  product_schema: [],
};

const form = ref<BlueprintCreateData>({ ...defaultForm });


const handleSubmit = async () => {
  if (!form.value.code.trim() || !form.value.name.trim()) {
    notifyError('Código y nombre son obligatorios.');
    return;
  }

  try {
    saving.value = true;
    await fetchApi('/api/v1/industry-blueprints/', {
      method: 'POST',
      data: {
        code: form.value.code.trim().toLowerCase(),
        name: form.value.name.trim(),
        icon: (form.value.icon || '').trim(),
        is_active: form.value.is_active,
        required_features: form.value.required_features,
        category_structure: [],
        default_categories: form.value.default_categories,
        business_conditions: form.value.business_conditions,
        product_schema: form.value.product_schema,
      },
    });
    notifySuccess('Tipo de comercio creado.');
    emit('created');
    emit('close');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudo crear el tipo de comercio.');
  } finally {
    saving.value = false;
  }
};


watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    form.value = { ...defaultForm };
  }
});
</script>
