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
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">{{ t('geography.title') }}</h1>
          <p class="text-sm text-slate-500">{{ t('geography.subtitle') }}</p>
        </div>
      </div>
      
      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
        <Plus class="h-4 w-4" />
        {{ t('geography.addCity') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200">
      <nav class="flex gap-8">
        <RouterLink
          to="/admin/geography/countries"
          class="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          {{ t('geography.countries') }}
        </RouterLink>
        <RouterLink
          to="/admin/geography/states"
          class="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          {{ t('geography.states') }}
        </RouterLink>
        <button
          class="border-b-2 border-brand-primary px-1 py-3 text-sm font-medium text-brand-primary"
        >
          {{ t('geography.cities') }}
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse bg-slate-200 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="cities.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
      <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <Building2 class="h-10 w-10 text-slate-300 stroke-[1.5]" />
      </div>
      <h3 class="text-base font-medium text-slate-900 mb-1">{{ t('geography.noCities') }}</h3>
      <p class="text-sm text-slate-500 mb-6">
        {{ t('geography.createFirstCity') }}
      </p>
      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
        <Plus class="h-4 w-4" />
        {{ t('geography.addCity') }}
      </button>
    </div>

    <!-- Cities Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.name') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.code') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.state') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.country') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.active') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="city in cities" :key="city.id" class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ city.name }}</div>
              </td>
              <td class="px-6 py-4">
                <code class="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                  {{ city.code }}
                </code>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ city.state_name || city.state }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ city.country_name || city.country }}</span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    city.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ city.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleEdit(city)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(city)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar"
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

    <!-- City Form Modal -->
    <CityFormModal
      :is-open="modalOpen"
      :city="editingCity"
      :countries="countries"
      :states="states"
      @close="modalOpen = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Building2, Pencil, Trash2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { City, Country, State } from '@/types';
import CityFormModal from '@/components/geography/CityFormModal.vue';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const cities = ref<City[]>([]);
const countries = ref<Country[]>([]);
const states = ref<State[]>([]);
const isLoading = ref(true);
const modalOpen = ref(false);
const editingCity = ref<City | null>(null);

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'geography.title': 'Gestión de Geografía',
    'geography.subtitle': 'Administración de Países, Estados y Ciudades',
    'geography.countries': 'Países',
    'geography.states': 'Estados',
    'geography.cities': 'Ciudades',
    'geography.addCity': 'Agregar Ciudad',
    'geography.noCities': 'No hay ciudades registradas',
    'geography.createFirstCity': 'Crea la primera ciudad para comenzar',
    'geography.name': 'Nombre',
    'geography.code': 'Código',
    'geography.state': 'Estado',
    'geography.country': 'País',
    'geography.active': 'Activo',
  };
  return translations[key] || key;
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const [citiesData, countriesData, statesData] = await Promise.all([
      fetchApi<{ results: City[] }>('/api/geography/cities/'),
      fetchApi<{ results: Country[] }>('/api/geography/countries/'),
      fetchApi<{ results: State[] }>('/api/geography/states/'),
    ]);
    cities.value = citiesData.results || [];
    countries.value = countriesData.results || [];
    states.value = statesData.results || [];
  } catch (error: any) {
    if (error?.status === 403) {
      notifyError('Acceso denegado. Solo Staff puede gestionar geografía.');
    } else {
      notifyError('Error cargando datos');
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const handleCreate = () => {
  editingCity.value = null;
  modalOpen.value = true;
};

const handleEdit = (city: City) => {
  editingCity.value = city;
  modalOpen.value = true;
};

const handleDelete = async (city: City) => {
  const result = await Swal.fire({
    title: '¿Confirmar eliminación?',
    text: `¿Eliminar la ciudad "${city.name}" permanentemente?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6B7280',
    reverseButtons: true,
  });
  
  if (!result.isConfirmed) return;
  
  try {
    await fetchApi(`/api/geography/cities/${city.id}/`, {
      method: 'DELETE',
    });
    notifySuccess(`Ciudad "${city.name}" eliminada exitosamente`);
    await loadData();
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando ciudad');
  }
};

const handleSave = async (formData: Partial<City>) => {
  try {
    if (editingCity.value) {
      await fetchApi<City>(`/api/geography/cities/${editingCity.value.id}/`, {
        method: 'PUT',
        data: formData,
      });
      notifySuccess('Ciudad actualizada exitosamente');
    } else {
      await fetchApi<City>('/api/geography/cities/', {
        method: 'POST',
        data: formData,
      });
      notifySuccess('Ciudad creada exitosamente');
    }
    modalOpen.value = false;
    await loadData();
  } catch (err: any) {
    notifyError(err?.message || 'Error guardando ciudad');
    throw err;
  }
};
</script>
