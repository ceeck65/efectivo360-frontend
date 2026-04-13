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
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">{{ t('countryCurrency.title') }}</h1>
          <p class="text-sm text-slate-500">{{ t('countryCurrency.subtitle') }}</p>
        </div>
      </div>

      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
        <Plus class="h-4 w-4" />
        {{ t('countryCurrency.addConfig') }}
      </button>
    </div>

    <!-- Country Selector -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {{ t('countryCurrency.selectCountry') }}
      </label>
      <select
        v-model="selectedCountryId"
        class="w-full max-w-md h-10 px-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all"
        @change="loadConfigsForCountry"
      >
        <option value="">{{ t('countryCurrency.allCountries') }}</option>
        <option v-for="country in geographyStore.activeCountries" :key="country.id" :value="country.id">
          {{ country.name }} ({{ country.code }})
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="geographyStore.countryCurrencyLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse bg-slate-200 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredConfigs.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
      <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <Coins class="h-10 w-10 text-slate-300 stroke-[1.5]" />
      </div>
      <h3 class="text-base font-medium text-slate-900 mb-1">{{ t('countryCurrency.noConfigs') }}</h3>
      <p class="text-sm text-slate-500 mb-6">
        {{ t('countryCurrency.createFirstConfig') }}
      </p>
      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
        <Plus class="h-4 w-4" />
        {{ t('countryCurrency.addConfig') }}
      </button>
    </div>

    <!-- Configs Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.priority') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.country') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.currency') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.legalTender') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.priceBase') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('countryCurrency.active') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="config in filteredConfigs"
              :key="config.id"
              class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                  {{ config.priority_order }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ config.country_name }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-slate-900">{{ config.currency_code }}</span>
                  <span class="text-slate-400">·</span>
                  <span class="text-slate-500">{{ config.currency_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    config.is_legal_tender
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ config.is_legal_tender ? t('common.yes') : t('common.no') }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    config.is_price_base
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ config.is_price_base ? t('common.yes') : t('common.no') }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    config.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ config.is_active ? t('common.active') : t('common.inactive') }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleEdit(config)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    :title="t('common.edit')"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(config)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    :title="t('common.delete')"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Country Currency Config Form Modal -->
    <CountryCurrencyConfigModal
      :is-open="modalOpen"
      :config="editingConfig"
      :countries="geographyStore.activeCountries"
      @close="modalOpen = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Coins, Pencil, Trash2 } from 'lucide-vue-next';
import { useGeographyStore } from '@/stores/geography';
import type { CountryCurrencyConfig, CountryCurrencyFormData } from '@/types';
import CountryCurrencyConfigModal from '@/components/geography/CountryCurrencyConfigModal.vue';
import Swal from 'sweetalert2';

// Store
const geographyStore = useGeographyStore();

// State
const selectedCountryId = ref<number | ''>('');
const modalOpen = ref(false);
const editingConfig = ref<CountryCurrencyConfig | null>(null);

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'countryCurrency.title': 'Asociación de Monedas por País',
    'countryCurrency.subtitle': 'Configura qué monedas están disponibles para cada país',
    'countryCurrency.addConfig': 'Asociar Moneda',
    'countryCurrency.selectCountry': 'Filtrar por país',
    'countryCurrency.allCountries': 'Todos los países',
    'countryCurrency.noConfigs': 'No hay configuraciones de moneda registradas',
    'countryCurrency.createFirstConfig': 'Asocia una moneda a un país para comenzar',
    'countryCurrency.priority': 'Prioridad',
    'countryCurrency.country': 'País',
    'countryCurrency.currency': 'Moneda',
    'countryCurrency.legalTender': 'Moneda Fiscal',
    'countryCurrency.priceBase': 'Base de Precios',
    'countryCurrency.active': 'Activo',
    'common.actions': 'Acciones',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
  };
  return translations[key] || key;
};

// Computed
const filteredConfigs = computed(() => {
  if (!selectedCountryId.value) {
    return geographyStore.activeCountryCurrencyConfigs;
  }
  return geographyStore.getConfigsByCountry(Number(selectedCountryId.value));
});

// Methods
const loadConfigsForCountry = () => {
  if (selectedCountryId.value) {
    geographyStore.fetchConfigsByCountry(Number(selectedCountryId.value));
  }
};

const handleCreate = () => {
  editingConfig.value = null;
  modalOpen.value = true;
};

const handleEdit = (config: CountryCurrencyConfig) => {
  editingConfig.value = config;
  modalOpen.value = true;
};

const handleDelete = async (config: CountryCurrencyConfig) => {
  const result = await Swal.fire({
    title: t('countryCurrency.deleteConfirmTitle') || '¿Confirmar desvinculación?',
    text: `¿Desvincular la moneda "${config.currency_code}" de "${config.country_name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, desvincular',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await geographyStore.deleteCountryCurrencyConfig(config.id);
  } catch (err: any) {
    // Error already handled in store
  }
};

const handleSave = async (formData: CountryCurrencyFormData) => {
  try {
    if (editingConfig.value) {
      await geographyStore.updateCountryCurrencyConfig(editingConfig.value.id, formData);
    } else {
      await geographyStore.createCountryCurrencyConfig(formData);
    }
    modalOpen.value = false;
  } catch (err: any) {
    // Error already handled in store
    throw err;
  }
};

// Lifecycle
onMounted(() => {
  geographyStore.fetchCountries();
  geographyStore.fetchCountryCurrencyConfigs();
});
</script>
