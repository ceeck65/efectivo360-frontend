/**
 * @fileoverview Composable principal del módulo Geography
 * @module @modules/geography/composables/useGeography
 * 
 * Expone métodos sencillos para:
 * - fetchLocations: Cargar jerarquía completa
 * - Propiedades reactivas para selectores en cascada
 * - Caché automático para evitar peticiones redundantes
 */

import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { ULID } from '@core/types';
import { useGeographyStore } from '../stores/geographyStore';
import type {
  Country,
  State,
  City,
  GeographyOption,
  LocationSelection,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useGeography() {
  const store = useGeographyStore();
  const { countries, isLoading } = storeToRefs(store);

  // Local refs for reactive dropdowns
  const selectedCountryId = ref<ULID | null>(null);
  const selectedStateId = ref<ULID | null>(null);
  const selectedCityId = ref<ULID | null>(null);

  // Computed lists for dropdowns (filtered by selection)
  const countryOptions = computed<GeographyOption[]>(() =>
    countries.value.map(c => ({
      value: c.id,
      label: c.name,
      code: c.code,
    }))
  );

  const stateOptions = computed<GeographyOption[]>(() => {
    if (!selectedCountryId.value) return [];
    const states = store.getStatesFromCache(selectedCountryId.value);
    return states.map(s => ({
      value: s.id,
      label: s.name,
      code: s.code,
    }));
  });

  const cityOptions = computed<GeographyOption[]>(() => {
    if (!selectedStateId.value) return [];
    const cities = store.getCitiesFromCache(selectedStateId.value);
    return cities.map(c => ({
      value: c.id,
      label: c.name,
      code: c.code,
    }));
  });

  // Getters for full objects
  const selectedCountry = computed<Country | undefined>(() =>
    selectedCountryId.value ? store.getCountryById(selectedCountryId.value) : undefined
  );

  const selectedState = computed<State | undefined>(() =>
    selectedStateId.value ? store.getStateById(selectedStateId.value) : undefined
  );

  const selectedCity = computed<City | undefined>(() =>
    selectedCityId.value ? store.getCityById(selectedCityId.value) : undefined
  );

  // Current selection as object
  const currentSelection = computed<LocationSelection>(() => ({
    countryId: selectedCountryId.value,
    stateId: selectedStateId.value,
    cityId: selectedCityId.value,
    countryName: selectedCountry.value?.name,
    stateName: selectedState.value?.name,
    cityName: selectedCity.value?.name,
  }));

  // Watchers for cascade reset
  watch(selectedCountryId, (newCountryId, oldCountryId) => {
    if (newCountryId !== oldCountryId) {
      selectedStateId.value = null;
      selectedCityId.value = null;
      // Auto-load states if cached or fetch
      if (newCountryId) {
        loadStates(newCountryId);
      }
    }
  });

  watch(selectedStateId, (newStateId, oldStateId) => {
    if (newStateId !== oldStateId) {
      selectedCityId.value = null;
      // Auto-load cities if cached or fetch
      if (newStateId) {
        loadCities(newStateId);
      }
    }
  });

  // =============================================================================
  // ACTIONS
  // =============================================================================

  /**
   * Cargar países al inicio
   */
  async function initialize(): Promise<void> {
    await store.loadCountries();
  }

  /**
   * Cargar estados por país (usa caché automáticamente)
   */
  async function loadStates(countryId: ULID): Promise<State[]> {
    return store.loadStatesByCountry(countryId);
  }

  /**
   * Cargar ciudades por estado (usa caché automáticamente)
   */
  async function loadCities(stateId: ULID): Promise<City[]> {
    return store.loadCitiesByState(stateId);
  }

  /**
   * Cargar jerarquía completa en una sola llamada
   * Útil para inicializar formularios con datos predefinidos
   */
  async function fetchLocations(
    countryId?: ULID,
    stateId?: ULID,
    cityId?: ULID
  ): Promise<{
    countries: Country[];
    states: State[];
    cities: City[];
  }> {
    // Cargar países si no están cargados
    if (countries.value.length === 0) {
      await store.loadCountries();
    }

    let states: State[] = [];
    let cities: City[] = [];

    // Cargar estados si se proporciona país
    if (countryId) {
      selectedCountryId.value = countryId;
      states = await loadStates(countryId);
    }

    // Cargar ciudades si se proporciona estado
    if (stateId && countryId) {
      selectedStateId.value = stateId;
      cities = await loadCities(stateId);
    }

    // Seleccionar ciudad si se proporciona
    if (cityId && stateId) {
      selectedCityId.value = cityId;
    }

    return {
      countries: countries.value,
      states,
      cities,
    };
  }

  /**
   * Establecer selección completa de una vez
   */
  async function setSelection(
    countryId: ULID | null,
    stateId: ULID | null = null,
    cityId: ULID | null = null
  ): Promise<void> {
    selectedCountryId.value = countryId;
    
    if (countryId && stateId) {
      await loadStates(countryId);
      selectedStateId.value = stateId;
      
      if (cityId) {
        await loadCities(stateId);
        selectedCityId.value = cityId;
      }
    }
  }

  /**
   * Limpiar toda la selección
   */
  function clearSelection(): void {
    selectedCountryId.value = null;
    selectedStateId.value = null;
    selectedCityId.value = null;
  }

  /**
   * Verificar si una ubicación está completa (para validación)
   */
  function isSelectionComplete(
    requiredLevel: 'country' | 'state' | 'city' = 'city'
  ): boolean {
    if (requiredLevel === 'country') return !!selectedCountryId.value;
    if (requiredLevel === 'state') return !!selectedCountryId.value && !!selectedStateId.value;
    return !!selectedCountryId.value && !!selectedStateId.value && !!selectedCityId.value;
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State refs
    selectedCountryId,
    selectedStateId,
    selectedCityId,
    
    // Options for dropdowns
    countryOptions,
    stateOptions,
    cityOptions,
    
    // Selected objects
    selectedCountry,
    selectedState,
    selectedCity,
    currentSelection,
    
    // Loading states
    isLoadingCountries: computed(() => isLoading.value.countries),
    isLoadingStates: computed(() => isLoading.value.states),
    isLoadingCities: computed(() => isLoading.value.cities),
    
    // Actions
    initialize,
    loadStates,
    loadCities,
    fetchLocations,
    setSelection,
    clearSelection,
    isSelectionComplete,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para solo lectura de ubicaciones
 * Útil para mostrar información sin selectores
 */
export function useGeographyDisplay() {
  const store = useGeographyStore();

  async function getLocationNames(
    countryId?: ULID,
    stateId?: ULID,
    cityId?: ULID
  ): Promise<{
    country?: string;
    state?: string;
    city?: string;
    fullAddress: string;
  }> {
    const names: string[] = [];
    let countryName: string | undefined;
    let stateName: string | undefined;
    let cityName: string | undefined;

    if (countryId) {
      const country = store.getCountryById(countryId);
      if (!country) await store.loadCountries();
      countryName = store.getCountryById(countryId)?.name;
      if (countryName) names.push(countryName);
    }

    if (stateId) {
      const state = store.getStateById(stateId);
      if (!state && countryId) await store.loadStatesByCountry(countryId);
      stateName = store.getStateById(stateId)?.name;
      if (stateName) names.push(stateName);
    }

    if (cityId) {
      const city = store.getCityById(cityId);
      if (!city && stateId) await store.loadCitiesByState(stateId);
      cityName = store.getCityById(cityId)?.name;
      if (cityName) names.push(cityName);
    }

    return {
      country: countryName,
      state: stateName,
      city: cityName,
      fullAddress: names.join(', '),
    };
  }

  return {
    getLocationNames,
  };
}

/**
 * Composable para formularios con validación
 */
export function useGeographyForm() {
  const geography = useGeography();
  
  const validationErrors = ref<{
    country?: string;
    state?: string;
    city?: string;
  }>({});

  function validate(requiredLevel: 'country' | 'state' | 'city' = 'city'): boolean {
    validationErrors.value = {};
    
    if (!geography.selectedCountryId.value) {
      validationErrors.value.country = 'País requerido';
    }
    
    if (requiredLevel !== 'country' && !geography.selectedStateId.value) {
      validationErrors.value.state = 'Estado requerido';
    }
    
    if (requiredLevel === 'city' && !geography.selectedCityId.value) {
      validationErrors.value.city = 'Ciudad requerida';
    }
    
    return Object.keys(validationErrors.value).length === 0;
  }

  return {
    ...geography,
    validationErrors: computed(() => validationErrors.value),
    validate,
  };
}
