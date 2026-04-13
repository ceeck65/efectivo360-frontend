<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard de Pagos</h1>
    <p class="mt-2 text-gray-600">
      Bienvenido al módulo de pagos. Selecciona una opción del menú lateral.
    </p>
    
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link 
        :to="paymentsPaths.methods()" 
        class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <h3 class="font-semibold text-gray-900">Métodos de Pago</h3>
        <p class="text-sm text-gray-600 mt-1">Configura tus métodos de cobro</p>
      </router-link>
      
      <router-link 
        :to="paymentsPaths.transactions()" 
        class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <h3 class="font-semibold text-gray-900">Transacciones</h3>
        <p class="text-sm text-gray-600 mt-1">Historial de pagos</p>
      </router-link>
      
      <router-link 
        v-if="isStaff"
        :to="paymentsPaths.currencies()" 
        class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <h3 class="font-semibold text-gray-900">Monedas</h3>
        <p class="text-sm text-gray-600 mt-1">Configuración de divisas</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista Dashboard del módulo Payments
 * @module @modules/payments/views/PaymentDashboard
 */
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { paymentsPaths } from '../router';

const authStore = useAuthStore();
const isStaff = computed(() => authStore.user?.role === 'staff');
</script>
