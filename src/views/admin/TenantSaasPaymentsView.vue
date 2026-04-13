<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/admin"
          class="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft class="h-5 w-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">Métodos de Pago para Suscripción</h1>
          <p class="text-sm text-slate-500">Gestiona cómo pagas tu suscripción a Efectivo 360</p>
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
      <div class="flex items-start gap-3">
        <Info class="h-5 w-5 text-blue-600 mt-0.5" />
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">¿Qué son estos métodos de pago?</p>
          <p class="text-blue-700">
            Son las cuentas de Efectivo 360 donde realizas los pagos de tu suscripción mensual.
            Selecciona el método que prefieras usar para pagar tu plan.
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse bg-slate-200 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="availableMethods.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
      <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <CreditCard class="h-10 w-10 text-slate-300 stroke-[1.5]" />
      </div>
      <h3 class="text-base font-medium text-slate-900 mb-1">No hay métodos disponibles</h3>
      <p class="text-sm text-slate-500 mb-6">
        Contacta al equipo de Efectivo 360 para configurar métodos de pago.
      </p>
    </div>

    <!-- Methods Grid -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="method in availableMethods"
        :key="method.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative"
        :class="{ 'ring-2 ring-blue-500 border-blue-500': selectedMethodId === method.id }"
      >
        <!-- Brand Color Bar -->
        <div
          class="absolute left-0 top-0 h-full w-1"
          :style="{ backgroundColor: method.template.brand_color }"
        />

        <div class="p-5 pl-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <img
                v-if="method.template.logo"
                :src="method.template.logo"
                :alt="method.template.name"
                class="h-10 w-10 rounded-lg object-contain bg-white border border-slate-100"
              />
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                :style="{ backgroundColor: method.template.brand_color }"
              >
                <CreditCard class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{{ method.display_name }}</h3>
                <p class="text-xs text-slate-500">{{ method.template.name }}</p>
              </div>
            </div>

            <button
              v-if="selectedMethodId !== method.id"
              @click="selectedMethodId = method.id"
              class="inline-flex items-center justify-center h-8 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Seleccionar
            </button>
            <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
              <Check class="h-3 w-3" />
              Activo
            </span>
          </div>

          <p class="mt-3 text-sm text-slate-600">
            {{ method.display_instructions }}
          </p>

          <div v-if="selectedMethodId === method.id" class="mt-4 pt-4 border-t border-slate-100">
            <p class="text-xs text-slate-500 mb-2">Instrucciones de pago:</p>
            <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
              {{ method.display_instructions }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Info, CreditCard, Check } from 'lucide-vue-next';
import { useTenantSaasPayments } from '@/composables/useSaasPaymentMethods';

const { availableMethods, isLoading, loadAvailableMethods } = useTenantSaasPayments();
const selectedMethodId = ref<number | null>(null);

onMounted(() => {
  loadAvailableMethods();
});
</script>
