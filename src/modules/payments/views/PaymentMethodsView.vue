<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Métodos de Pago</h1>
        <p class="mt-1 text-sm text-gray-500">
          Gestiona los métodos de pago para cobrar a tus clientes
        </p>
      </div>
      <router-link
        :to="{ name: paymentsRouteNames.methodCreate }"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus class="w-4 h-4" />
        Nuevo Método
      </router-link>
    </div>

    <LoadingSpinner v-if="isLoading" size="lg" />
    <ErrorMessage v-else-if="errors.tenantMethods" :message="errors.tenantMethods" variant="error" />
    
    <div v-else-if="activeTenantMethods.length === 0" class="text-center py-12">
      <CreditCard class="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500">No tienes métodos de pago configurados</p>
      <router-link
        :to="{ name: paymentsRouteNames.methodCreate }"
        class="mt-4 inline-block text-blue-600 hover:text-blue-700"
      >
        Configurar tu primer método →
      </router-link>
    </div>
    
    <div v-else class="space-y-4">
      <div
        v-for="method in activeTenantMethods"
        :key="method.id"
        class="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <img 
              v-if="method.template?.logo" 
              :src="method.template.logo" 
              :alt="method.template.name"
              class="w-10 h-10 object-contain"
            >
            <div v-else class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">{{ method.display_name }}</h3>
              <p class="text-sm text-gray-500">{{ method.template?.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span 
              :class="method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-2 py-1 text-xs rounded-full"
            >
              {{ method.is_active ? 'Activo' : 'Inactivo' }}
            </span>
            <router-link
              :to="{ name: paymentsRouteNames.methodEdit, params: { id: method.id } }"
              class="p-1 text-gray-400 hover:text-gray-600"
            >
              <Pencil class="w-4 h-4" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Lista de Métodos de Pago del Tenant
 * @module @modules/payments/views/PaymentMethodsView
 */
import { onMounted } from 'vue';
import { Plus, CreditCard, Pencil } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { usePaymentsStore } from '../stores/paymentsStore';
import { paymentsRouteNames } from '../router';

const store = usePaymentsStore();
const { activeTenantMethods, isLoading, errors } = store;

onMounted(() => {
  store.loadTenantPaymentMethods();
});
</script>
