<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plantillas de Pago</h1>
        <p class="mt-1 text-sm text-gray-500">
          Catálogo global de métodos de pago (Solo Staff)
        </p>
      </div>
      <router-link
        :to="{ name: paymentsRouteNames.templateCreate }"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus class="w-4 h-4" />
        Nueva Plantilla
      </router-link>
    </div>

    <LoadingSpinner v-if="isLoading" size="lg" />
    <ErrorMessage v-else-if="errors.templates" :message="errors.templates" variant="error" />
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="template in activeTemplates"
        :key="template.id"
        class="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div class="flex items-center gap-3">
          <img 
            v-if="template.logo" 
            :src="template.logo" 
            :alt="template.name"
            class="w-10 h-10 object-contain"
          >
          <div v-else class="w-10 h-10 rounded" :style="{ backgroundColor: template.brand_color }"></div>
          <div>
            <h3 class="font-medium text-gray-900">{{ template.name }}</h3>
            <p class="text-sm text-gray-500">{{ template.category?.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Plantillas de Pago (Staff Only)
 * @module @modules/payments/views/PaymentTemplatesView
 */
import { onMounted } from 'vue';
import { Plus } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { usePaymentsStore } from '../stores/paymentsStore';
import { paymentsRouteNames } from '../router';

const store = usePaymentsStore();
const { activeTemplates, isLoading, errors } = store;

onMounted(() => {
  store.loadTemplates();
});
</script>
