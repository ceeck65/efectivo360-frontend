<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Administración de Tasas de Cambio</h2>
        <p class="text-sm text-slate-600 mt-1">
          Gestión manual del tipo de cambio USD/VES
        </p>
      </div>
      
      <!-- Panic Button -->
      <button
        v-if="isStaff"
        @click="handlePanicUpdate"
        :disabled="isUpdating"
        class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg v-if="isUpdating" class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <AlertTriangle v-else class="h-4 w-4" />
        {{ isUpdating ? 'Actualizando...' : 'Actualización de Emergencia' }}
      </button>
    </div>

    <!-- Current Rate Card -->
    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Tasa Actual</h3>
          <p class="text-sm text-slate-600 mt-1">
            Fuente: <span class="font-medium">{{ currentRate?.source || 'Cargando...' }}</span>
          </p>
          <p class="text-sm text-slate-600">
            Última actualización: <span class="font-medium">{{ formatDate(currentRate?.updated_at) }}</span>
          </p>
        </div>
        <div class="text-right">
          <p class="text-4xl font-bold text-slate-900">
            {{ currentRate?.rate?.toFixed(2) || '---' }} VES
          </p>
          <p class="text-sm text-slate-600 mt-1">USD 1.00</p>
        </div>
      </div>
      
      <!-- Status Badge -->
      <div class="mt-4">
        <span
          :class="[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            currentRate?.status === 'ok'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          ]"
        >
          {{ currentRate?.status === 'ok' ? 'Estado: Normal' : 'Estado: Degradado' }}
        </span>
      </div>
    </div>

    <!-- History Section -->
    <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-semibold text-slate-900">Historial de Cambios</h3>
        <p class="text-sm text-slate-600 mt-1">
          Últimos {{ history.length }} cambios en la tasa USD/VES
        </p>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Tasa Anterior
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Nueva Tasa
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Cambio
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Fuente
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="history.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-500">
                No hay historial disponible
              </td>
            </tr>
            <tr v-for="item in history" :key="item.id" class="hover:bg-slate-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ item.previous_rate.toFixed(2) }} VES
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {{ item.new_rate.toFixed(2) }} VES
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getChangeClass(item.previous_rate, item.new_rate)
                  ]"
                >
                  {{ calculateChange(item.previous_rate, item.new_rate) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ item.source }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useAlert } from '@/composables/useAlert';
import { useAuthStore } from '@/stores/auth';

interface ForexRateResponse {
  rate: number;
  currency: string;
  source: string;
  status: 'ok' | 'degraded';
  updated_at: string;
  last_success_at: string;
}

interface HistoryItem {
  id: number;
  currency_code: string;
  previous_rate: number;
  new_rate: number;
  source: string;
  created_at: string;
}

const { apiClient } = useApi();
const { showSuccess, showError } = useAlert();
const authStore = useAuthStore();

const currentRate = ref<ForexRateResponse | null>(null);
const isStaff = computed(() => authStore.isStaff);
const history = ref<HistoryItem[]>([]);
const isUpdating = ref(false);

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calculateChange = (previous: number, current: number) => {
  if (previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
};

const getChangeClass = (previous: number, current: number) => {
  if (previous === 0) return 'bg-slate-100 text-slate-800';
  const change = current - previous;
  if (change > 0) return 'bg-emerald-100 text-emerald-800';
  if (change < 0) return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-800';
};

const fetchCurrentRate = async () => {
  try {
    const response = await apiClient.get<ForexRateResponse>('/api/v1/forex/rate/');
    currentRate.value = response.data;
  } catch (error) {
    console.error('Error fetching current rate:', error);
  }
};

const fetchHistory = async () => {
  try {
    const response = await apiClient.get<{ history: HistoryItem[] }>('/api/v1/admin/forex/history/?limit=50');
    history.value = response.data.history;
  } catch (error) {
    console.error('Error fetching history:', error);
  }
};

const handlePanicUpdate = async () => {
  isUpdating.value = true;
  try {
    const response = await apiClient.post('/api/v1/admin/forex/manual-update/');
    
    console.log('Tasa Actualizada:', {
      rate: response.data.rate,
      source: response.data.source
    });
    
    showSuccess(
      'Tasa Actualizada',
      `Nueva tasa: ${response.data.rate.toFixed(2)} VES (${response.data.source})`
    );
    
    // Refresh current rate and history
    await fetchCurrentRate();
    await fetchHistory();
  } catch (error: any) {
    console.error('Error updating rate:', error);
    showError(
      'Error al Actualizar',
      error.response?.data?.detail || 'No se pudo actualizar la tasa'
    );
  } finally {
    isUpdating.value = false;
  }
};

onMounted(() => {
  fetchCurrentRate();
  fetchHistory();
});
</script>
