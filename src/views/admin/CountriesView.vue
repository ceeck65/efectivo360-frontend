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
        {{ t('geography.addCountry') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200">
      <nav class="flex gap-8">
        <button
          class="border-b-2 border-brand-primary px-1 py-3 text-sm font-medium text-brand-primary"
        >
          {{ t('geography.countries') }}
        </button>
        <RouterLink
          to="/admin/geography/states"
          class="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          {{ t('geography.states') }}
        </RouterLink>
        <RouterLink
          to="/admin/geography/cities"
          class="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          {{ t('geography.cities') }}
        </RouterLink>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse bg-slate-200 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="countries.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
      <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <Globe class="h-10 w-10 text-slate-300 stroke-[1.5]" />
      </div>
      <h3 class="text-base font-medium text-slate-900 mb-1">{{ t('geography.noCountries') }}</h3>
      <p class="text-sm text-slate-500 mb-6">
        {{ t('geography.createFirstCountry') }}
      </p>
      <button @click="handleCreate" class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
        <Plus class="h-4 w-4" />
        {{ t('geography.addCountry') }}
      </button>
    </div>

    <!-- Countries Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.name') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.code') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('geography.active') }}</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="country in countries" :key="country.id" class="border-t border-slate-100 hover:bg-slate-50/30 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ country.name }}</div>
              </td>
              <td class="px-6 py-4">
                <code class="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                  {{ country.code }}
                </code>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    country.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ country.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleEdit(country)"
                    class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(country)"
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

    <!-- Country Form Modal -->
    <CountryFormModal
      :is-open="modalOpen"
      :country="editingCountry"
      @close="modalOpen = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Globe, Pencil, Trash2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { Country } from '@/types';
import CountryFormModal from '@/components/geography/CountryFormModal.vue';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const countries = ref<Country[]>([]);
const isLoading = ref(true);
const modalOpen = ref(false);
const editingCountry = ref<Country | null>(null);

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'geography.title': 'Gestión de Geografía',
    'geography.subtitle': 'Administración de Países, Estados y Ciudades',
    'geography.countries': 'Países',
    'geography.states': 'Estados',
    'geography.cities': 'Ciudades',
    'geography.addCountry': 'Agregar País',
    'geography.noCountries': 'No hay países registrados',
    'geography.createFirstCountry': 'Crea el primer país para comenzar',
    'geography.name': 'Nombre',
    'geography.code': 'Código',
    'geography.active': 'Activo',
  };
  return translations[key] || key;
};

const loadCountries = async () => {
  isLoading.value = true;
  try {
    const data = await fetchApi<{ results: Country[] }>('/api/geography/countries/');
    countries.value = data.results || [];
  } catch (error: any) {
    if (error?.status === 403) {
      notifyError('Acceso denegado. Solo Staff puede gestionar geografía.');
    } else {
      notifyError('Error cargando países');
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadCountries();
});

const handleCreate = () => {
  editingCountry.value = null;
  modalOpen.value = true;
};

const handleEdit = (country: Country) => {
  editingCountry.value = country;
  modalOpen.value = true;
};

const handleDelete = async (country: Country) => {
  const result = await Swal.fire({
    title: '¿Confirmar eliminación?',
    text: `¿Eliminar el país "${country.name}" permanentemente?`,
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
    await fetchApi(`/api/geography/countries/${country.id}/`, {
      method: 'DELETE',
    });
    notifySuccess(`País "${country.name}" eliminado exitosamente`);
    await loadCountries();
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando país');
  }
};

const handleSave = async (formData: Partial<Country>) => {
  try {
    if (editingCountry.value) {
      await fetchApi<Country>(`/api/geography/countries/${editingCountry.value.id}/`, {
        method: 'PUT',
        data: formData,
      });
      notifySuccess('País actualizado exitosamente');
    } else {
      await fetchApi<Country>('/api/geography/countries/', {
        method: 'POST',
        data: formData,
      });
      notifySuccess('País creado exitosamente');
    }
    modalOpen.value = false;
    await loadCountries();
  } catch (err: any) {
    notifyError(err?.message || 'Error guardando país');
    throw err;
  }
};
</script>
