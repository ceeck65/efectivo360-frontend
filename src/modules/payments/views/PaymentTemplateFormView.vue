<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <button 
        @click="$router.back()" 
        class="p-2 text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEdit ? 'Editar' : 'Nueva' }} Plantilla
      </h1>
    </div>

    <div class="max-w-2xl bg-white rounded-lg border border-gray-200 p-6">
      <p class="text-gray-600">Formulario en construcción...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Formulario de Plantilla (Staff Only)
 * @module @modules/payments/views/PaymentTemplateFormView
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const isEdit = computed(() => !!route.params.id);
</script>
