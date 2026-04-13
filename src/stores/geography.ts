import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type {
  Country,
  State,
  City,
  CountryCurrencyConfig,
  CountryCurrencyFormData,
} from '@/types';

export const useGeographyStore = defineStore('geography', () => {
  // API and Notify composables
  const { fetchApi } = useApi();
  const { success: notifySuccess, error: notifyError } = useNotify();

  // ===========================================================================
  // STATE - Countries
  // ===========================================================================
  const countries = ref<Country[]>([]);
  const countriesLoading = ref(false);
  const countriesError = ref<string | null>(null);

  // ===========================================================================
  // STATE - States
  // ===========================================================================
  const states = ref<State[]>([]);
  const statesLoading = ref(false);
  const statesError = ref<string | null>(null);

  // ===========================================================================
  // STATE - Cities
  // ===========================================================================
  const cities = ref<City[]>([]);
  const citiesLoading = ref(false);
  const citiesError = ref<string | null>(null);

  // ===========================================================================
  // STATE - Country Currency Config
  // ===========================================================================
  const countryCurrencyConfigs = ref<CountryCurrencyConfig[]>([]);
  const countryCurrencyLoading = ref(false);
  const countryCurrencyError = ref<string | null>(null);

  // ===========================================================================
  // GETTERS - Countries
  // ===========================================================================
  const activeCountries = computed(() =>
    countries.value.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name))
  );

  const getCountryById = computed(() => (id: number) =>
    countries.value.find((c) => c.id === id)
  );

  // ===========================================================================
  // GETTERS - States
  // ===========================================================================
  const activeStates = computed(() =>
    states.value.filter((s) => s.is_active).sort((a, b) => a.name.localeCompare(b.name))
  );

  const getStatesByCountry = computed(() => (countryId: number) =>
    states.value
      .filter((s) => s.country === countryId && s.is_active)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  const getStateById = computed(() => (id: number) => states.value.find((s) => s.id === id));

  // ===========================================================================
  // GETTERS - Cities
  // ===========================================================================
  const activeCities = computed(() =>
    cities.value.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name))
  );

  const getCitiesByState = computed(() => (stateId: number) =>
    cities.value
      .filter((c) => c.state === stateId && c.is_active)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  const getCitiesByCountry = computed(() => (countryId: number) =>
    cities.value
      .filter((c) => c.country === countryId && c.is_active)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  const getCityById = computed(() => (id: number) => cities.value.find((c) => c.id === id));

  // ===========================================================================
  // GETTERS - Country Currency Config
  // ===========================================================================
  const activeCountryCurrencyConfigs = computed(() =>
    countryCurrencyConfigs.value
      .filter((c) => c.is_active)
      .sort((a, b) => a.priority_order - b.priority_order)
  );

  const getConfigsByCountry = computed(() => (countryId: number) =>
    countryCurrencyConfigs.value
      .filter((c) => c.country === countryId && c.is_active)
      .sort((a, b) => a.priority_order - b.priority_order)
  );

  const getConfigById = computed(() => (id: number) =>
    countryCurrencyConfigs.value.find((c) => c.id === id)
  );

  // ===========================================================================
  // ACTIONS - Countries
  // ===========================================================================
  async function fetchCountries() {
    countriesLoading.value = true;
    countriesError.value = null;
    try {
      const response = await fetchApi<{ results?: Country[] } | Country[]>('/api/geography/countries/');
      countries.value = Array.isArray(response) ? response : response.results || [];
      return countries.value;
    } catch (err: any) {
      countriesError.value = err.message || 'Failed to fetch countries';
      notifyError('Error al cargar países');
      throw err;
    } finally {
      countriesLoading.value = false;
    }
  }

  async function createCountry(data: Omit<Country, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const response = await fetchApi<Country>('/api/geography/countries/', {
        method: 'POST',
        data,
      });
      countries.value.push(response);
      notifySuccess('País creado exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al crear país');
      throw err;
    }
  }

  async function updateCountry(id: number, data: Partial<Country>) {
    try {
      const response = await fetchApi<Country>(`/api/geography/countries/${id}/`, {
        method: 'PUT',
        data,
      });
      const index = countries.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        countries.value[index] = { ...countries.value[index], ...response };
      }
      notifySuccess('País actualizado exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar país');
      throw err;
    }
  }

  async function deleteCountry(id: number) {
    try {
      await fetchApi(`/api/geography/countries/${id}/`, {
        method: 'DELETE',
      });
      countries.value = countries.value.filter((c) => c.id !== id);
      notifySuccess('País eliminado exitosamente');
    } catch (err: any) {
      notifyError(err.message || 'Error al eliminar país');
      throw err;
    }
  }

  // ===========================================================================
  // ACTIONS - States
  // ===========================================================================
  async function fetchStates() {
    statesLoading.value = true;
    statesError.value = null;
    try {
      const response = await fetchApi<{ results?: State[] } | State[]>('/api/geography/states/');
      states.value = Array.isArray(response) ? response : response.results || [];
      return states.value;
    } catch (err: any) {
      statesError.value = err.message || 'Failed to fetch states';
      notifyError('Error al cargar estados');
      throw err;
    } finally {
      statesLoading.value = false;
    }
  }

  async function fetchStatesByCountry(countryId: number) {
    try {
      const response = await fetchApi<{ results?: State[] } | State[]>(`/api/geography/states/by-country/?country=${countryId}`);
      return Array.isArray(response) ? response : response.results || [];
    } catch (err: any) {
      notifyError('Error al cargar estados del país');
      throw err;
    }
  }

  async function createState(data: Omit<State, 'id' | 'created_at' | 'updated_at' | 'country_name'>) {
    try {
      const response = await fetchApi<State>('/api/geography/states/', {
        method: 'POST',
        data,
      });
      states.value.push(response);
      notifySuccess('Estado creado exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al crear estado');
      throw err;
    }
  }

  async function updateState(id: number, data: Partial<State>) {
    try {
      const response = await fetchApi<State>(`/api/geography/states/${id}/`, {
        method: 'PUT',
        data,
      });
      const index = states.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        states.value[index] = { ...states.value[index], ...response };
      }
      notifySuccess('Estado actualizado exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar estado');
      throw err;
    }
  }

  async function deleteState(id: number) {
    try {
      await fetchApi(`/api/geography/states/${id}/`, {
        method: 'DELETE',
      });
      states.value = states.value.filter((s) => s.id !== id);
      notifySuccess('Estado eliminado exitosamente');
    } catch (err: any) {
      notifyError(err.message || 'Error al eliminar estado');
      throw err;
    }
  }

  // ===========================================================================
  // ACTIONS - Cities
  // ===========================================================================
  async function fetchCities() {
    citiesLoading.value = true;
    citiesError.value = null;
    try {
      const response = await fetchApi<{ results?: City[] } | City[]>('/api/geography/cities/');
      cities.value = Array.isArray(response) ? response : response.results || [];
      return cities.value;
    } catch (err: any) {
      citiesError.value = err.message || 'Failed to fetch cities';
      notifyError('Error al cargar ciudades');
      throw err;
    } finally {
      citiesLoading.value = false;
    }
  }

  async function fetchCitiesByState(stateId: number) {
    try {
      const response = await fetchApi<{ results?: City[] } | City[]>(`/api/geography/cities/by-state/?state=${stateId}`);
      return Array.isArray(response) ? response : response.results || [];
    } catch (err: any) {
      notifyError('Error al cargar ciudades del estado');
      throw err;
    }
  }

  async function fetchCitiesByCountry(countryId: number) {
    try {
      const response = await fetchApi<{ results?: City[] } | City[]>(`/api/geography/cities/by-country/?country=${countryId}`);
      return Array.isArray(response) ? response : response.results || [];
    } catch (err: any) {
      notifyError('Error al cargar ciudades del país');
      throw err;
    }
  }

  async function createCity(data: Omit<City, 'id' | 'created_at' | 'updated_at' | 'state_name' | 'country_name'>) {
    try {
      const response = await fetchApi<City>('/api/geography/cities/', {
        method: 'POST',
        data,
      });
      cities.value.push(response);
      notifySuccess('Ciudad creada exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al crear ciudad');
      throw err;
    }
  }

  async function updateCity(id: number, data: Partial<City>) {
    try {
      const response = await fetchApi<City>(`/api/geography/cities/${id}/`, {
        method: 'PUT',
        data,
      });
      const index = cities.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        cities.value[index] = { ...cities.value[index], ...response };
      }
      notifySuccess('Ciudad actualizada exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar ciudad');
      throw err;
    }
  }

  async function deleteCity(id: number) {
    try {
      await fetchApi(`/api/geography/cities/${id}/`, {
        method: 'DELETE',
      });
      cities.value = cities.value.filter((c) => c.id !== id);
      notifySuccess('Ciudad eliminada exitosamente');
    } catch (err: any) {
      notifyError(err.message || 'Error al eliminar ciudad');
      throw err;
    }
  }

  // ===========================================================================
  // ACTIONS - Country Currency Config
  // ===========================================================================
  async function fetchCountryCurrencyConfigs() {
    countryCurrencyLoading.value = true;
    countryCurrencyError.value = null;
    try {
      const response = await fetchApi<{ results?: CountryCurrencyConfig[] } | CountryCurrencyConfig[]>('/api/geography/country-currency-configs/');
      countryCurrencyConfigs.value = Array.isArray(response) ? response : response.results || [];
      return countryCurrencyConfigs.value;
    } catch (err: any) {
      countryCurrencyError.value = err.message || 'Failed to fetch configs';
      notifyError('Error al cargar configuraciones de moneda por país');
      throw err;
    } finally {
      countryCurrencyLoading.value = false;
    }
  }

  async function fetchConfigsByCountry(countryId: number) {
    try {
      const response = await fetchApi<{ results?: CountryCurrencyConfig[] } | CountryCurrencyConfig[]>(`/api/geography/country-currency-configs/by-country/?country=${countryId}`);
      return Array.isArray(response) ? response : response.results || [];
    } catch (err: any) {
      notifyError('Error al cargar configuraciones del país');
      throw err;
    }
  }

  async function createCountryCurrencyConfig(data: CountryCurrencyFormData) {
    try {
      const response = await fetchApi<CountryCurrencyConfig>('/api/geography/country-currency-configs/', {
        method: 'POST',
        data,
      });
      countryCurrencyConfigs.value.push(response);
      notifySuccess('Moneda asociada exitosamente al país');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al asociar moneda al país');
      throw err;
    }
  }

  async function updateCountryCurrencyConfig(id: number, data: Partial<CountryCurrencyFormData>) {
    try {
      const response = await fetchApi<CountryCurrencyConfig>(`/api/geography/country-currency-configs/${id}/`, {
        method: 'PUT',
        data,
      });
      const index = countryCurrencyConfigs.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        countryCurrencyConfigs.value[index] = { ...countryCurrencyConfigs.value[index], ...response };
      }
      notifySuccess('Configuración actualizada exitosamente');
      return response;
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar configuración');
      throw err;
    }
  }

  async function deleteCountryCurrencyConfig(id: number) {
    try {
      await fetchApi(`/api/geography/country-currency-configs/${id}/`, {
        method: 'DELETE',
      });
      countryCurrencyConfigs.value = countryCurrencyConfigs.value.filter((c) => c.id !== id);
      notifySuccess('Moneda desvinculada exitosamente del país');
    } catch (err: any) {
      notifyError(err.message || 'Error al desvincular moneda del país');
      throw err;
    }
  }

  // ===========================================================================
  // BULK ACTIONS - Reordering
  // ===========================================================================
  async function updatePriorityOrder(configs: { id: number; priority_order: number }[]) {
    try {
      const response = await fetchApi('/api/geography/country-currency-configs/bulk-update-order/', {
        method: 'POST',
        data: { configs },
      });
      // Update local state
      for (const update of configs) {
        const index = countryCurrencyConfigs.value.findIndex((c) => c.id === update.id);
        if (index !== -1) {
          countryCurrencyConfigs.value[index].priority_order = update.priority_order;
        }
      }
      notifySuccess('Orden de prioridad actualizado');
      return response;
    } catch (err: any) {
      notifyError('Error al actualizar el orden de prioridad');
      throw err;
    }
  }

  return {
    // Countries
    countries,
    countriesLoading,
    countriesError,
    activeCountries,
    getCountryById,
    fetchCountries,
    createCountry,
    updateCountry,
    deleteCountry,

    // States
    states,
    statesLoading,
    statesError,
    activeStates,
    getStatesByCountry,
    getStateById,
    fetchStates,
    fetchStatesByCountry,
    createState,
    updateState,
    deleteState,

    // Cities
    cities,
    citiesLoading,
    citiesError,
    activeCities,
    getCitiesByState,
    getCitiesByCountry,
    getCityById,
    fetchCities,
    fetchCitiesByState,
    fetchCitiesByCountry,
    createCity,
    updateCity,
    deleteCity,

    // Country Currency Config
    countryCurrencyConfigs,
    countryCurrencyLoading,
    countryCurrencyError,
    activeCountryCurrencyConfigs,
    getConfigsByCountry,
    getConfigById,
    fetchCountryCurrencyConfigs,
    fetchConfigsByCountry,
    createCountryCurrencyConfig,
    updateCountryCurrencyConfig,
    deleteCountryCurrencyConfig,
    updatePriorityOrder,
  };
});
