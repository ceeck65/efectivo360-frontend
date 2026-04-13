<template>
  <div class="card group relative overflow-hidden transition-all hover:shadow-lg">
    <!-- Brand Color Bar -->
    <div
      class="absolute left-0 top-0 h-full w-1"
      :style="{ backgroundColor: template.brand_color }"
    />
    
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <img
            v-if="template.logo_url"
            :src="template.logo_url"
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
        
        <!-- Actions -->
        <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            @click="$emit('edit', template)"
            class="btn-ghost p-2"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            @click="$emit('delete', template)"
            class="btn-ghost p-2 text-red-500"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <!-- Badges -->
      <div class="mt-4 flex flex-wrap gap-2">
        <span
          class="badge"
          :style="{ borderColor: template.brand_color, color: template.brand_color }"
        >
          {{ template.category?.name || 'Sin categoría' }}
        </span>
        <span class="badge bg-gray-100 text-gray-700 border-0">
          {{ configStore.getPaymentTypeLabel(template.payment_type) }}
        </span>
        <span
          v-if="template.currency"
          :class="[
            'badge',
            template.currency.code === 'USD'
              ? 'bg-slate-900 text-white border-0'
              : 'bg-gray-100 text-gray-700 border-0'
          ]"
        >
          {{ template.currency.code }}
        </span>
        <span v-if="!template.is_active" class="badge bg-red-100 text-red-700 border-0">
          Inactivo
        </span>
      </div>
      
      <!-- Description -->
      <p v-if="template.description" class="mt-3 text-sm text-gray-600 line-clamp-2">
        {{ template.description }}
      </p>
      
      <!-- Footer -->
      <div class="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Orden: {{ template.sort_order }}</span>
        <span v-if="metadataFields.length > 0">
          {{ metadataFields.length }} campos requeridos
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Trash2, Image as ImageIcon } from 'lucide-vue-next';
import { useConfigStore } from '@/stores/config';
import type { PaymentMethodTemplate, MetadataField } from '@/types';
import { parseMetadata } from '@/utils/metadata';

const props = defineProps<{
  template: PaymentMethodTemplate;
}>();

defineEmits<{
  edit: [template: PaymentMethodTemplate];
  delete: [template: PaymentMethodTemplate];
}>();

const configStore = useConfigStore();

const metadataFields = computed<MetadataField[]>(() => {
  return parseMetadata(props.template.required_metadata).fields;
});
</script>
