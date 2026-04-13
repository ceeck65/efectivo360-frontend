/**
 * @fileoverview Store de Pinia para Geography (Ligero con caché)
 * @module @modules/geography/stores/geographyStore
 * 
 * Estrategia de caché:
 * - Estados: Caché por país (evita refetch si ya se cargaron)
 * - Ciudades: Caché por estado (evita refetch si ya se cargaron)
 * - TTL: 5 minutos por defecto
 * 
 * Meta: Reducir carga inicial de memoria y peticiones redundantes
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  Country,
  State,
  City,
  CitiesCacheEntry,
  StatesCacheEntry,
} from '../types';
import * as geographyService from '../services/geography.service';

// Tiempo de vida del caché (5 minutos)
const CACHE_TTL_MS = 5 * 60 * 1000;

export const useGeographyStore = defineStore('geography', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Lista base (ligera - solo activos)
  const countries = ref<Country[]>([]);
  const states = ref<State[]>([]);
  
  // Caché jerárquico (clave: parentId, valor: items + timestamp)
  const citiesByStateCache = ref<Map<string, CitiesCacheEntry>>(new Map());
  const statesByCountryCache = ref<Map<string, StatesCacheEntry>>(new Map());
  
  // Estado de UI
  const isLoading = ref({
    countries: false,
    states: false,
    cities: false,
  });
  
  const errors = ref<Record<string, string | null>>({
    countries: null,
    states: null,
    cities: null,
  });

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const activeCountries = computed(() => 
    countries.value.filter(c => c.is_active)
  );

  const activeStates = computed(() => 
    states.value.filter(s => s.is_active)
  );

  /**
   * Verificar si los estados de un país están en caché y son válidos
   */
  function hasStatesCached(countryId: string): boolean {
    const entry = statesByCountryCache.value.get(countryId);
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
  }

  /**
   * Obtener estados desde caché
   */
  function getStatesFromCache(countryId: string): State[] {
    return statesByCountryCache.value.get(countryId)?.states || [];
  }

  /**
   * Verificar si las ciudades de un estado están en caché
   */
  function hasCitiesCached(stateId: string): boolean {
    const entry = citiesByStateCache.value.get(stateId);
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
  }

  /**
   * Obtener ciudades desde caché
   */
  function getCitiesFromCache(stateId: string): City[] {
    return citiesByStateCache.value.get(stateId)?.cities || [];
  }

  /**
   * Buscar país por ID
   */
  const getCountryById = computed(() => (id: string): Country | undefined =>
    countries.value.find(c => c.id === id)
  );

  /**
   * Buscar estado por ID
   */
  const getStateById = computed(() => (id: string): State | undefined =>
    states.value.find(s => s.id === id)
  );

  /**
   * Buscar ciudad por ID (busca en todas las entradas de caché)
   */
  const getCityById = computed(() => (id: string): City | undefined => {
    for (const entry of citiesByStateCache.value.values()) {
      const city = entry.cities.find(c => c.id === id);
      if (city) return city;
    }
    return undefined;
  });

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /**
   * Cargar todos los países (solo una vez por sesión)
   */
  async function loadCountries(force = false): Promise<void> {
    if (!force && countries.value.length > 0) return;
    
    isLoading.value.countries = true;
    errors.value.countries = null;
    
    try {
      countries.value = await geographyService.fetchActiveCountries();
    } catch (err: any) {
      errors.value.countries = err.message || 'Error cargando países';
      toast.error('Error cargando países');
    } finally {
      isLoading.value.countries = false;
    }
  }

  /**
   * Cargar estados por país (con caché)
   */
  async function loadStatesByCountry(countryId: string, force = false): Promise<State[]> {
    // Verificar caché
    if (!force && hasStatesCached(countryId)) {
      return getStatesFromCache(countryId);
    }
    
    isLoading.value.states = true;
    errors.value.states = null;
    
    try {
      const statesData = await geographyService.getStates(countryId);
      
      // Guardar en caché
      statesByCountryCache.value.set(countryId, {
        countryId,
        states: statesData,
        fetchedAt: Date.now(),
      });
      
      // También agregar al array global para búsquedas
      const newIds = new Set(statesData.map(s => s.id));
      states.value = [
        ...states.value.filter(s => !newIds.has(s.id)),
        ...statesData,
      ];
      
      return statesData;
    } catch (err: any) {
      errors.value.states = err.message || 'Error cargando estados';
      toast.error('Error cargando estados');
      return [];
    } finally {
      isLoading.value.states = false;
    }
  }

  /**
   * Cargar ciudades por estado (con caché)
   */
  async function loadCitiesByState(stateId: string, force = false): Promise<City[]> {
    // Verificar caché
    if (!force && hasCitiesCached(stateId)) {
      return getCitiesFromCache(stateId);
    }
    
    isLoading.value.cities = true;
    errors.value.cities = null;
    
    try {
      const citiesData = await geographyService.getCitiesByState(stateId);
      
      // Guardar en caché
      citiesByStateCache.value.set(stateId, {
        stateId,
        cities: citiesData,
        fetchedAt: Date.now(),
      });
      
      return citiesData;
    } catch (err: any) {
      errors.value.cities = err.message || 'Error cargando ciudades';
      toast.error('Error cargando ciudades');
      return [];
    } finally {
      isLoading.value.cities = false;
    }
  }

  /**
   * Cargar ciudades por país (útil para buscadores)
   */
  async function loadCitiesByCountry(countryId: string): Promise<City[]> {
    // Primero cargar estados si no están en caché
    const countryStates = await loadStatesByCountry(countryId);
    
    // Cargar ciudades para cada estado
    const citiesPromises = countryStates.map(state =>
      loadCitiesByState(state.id)
    );
    
    const citiesArrays = await Promise.all(citiesPromises);
    return citiesArrays.flat();
  }

  /**
   * Invalidar caché de estados para un país
   */
  function invalidateStatesCache(countryId?: string): void {
    if (countryId) {
      statesByCountryCache.value.delete(countryId);
    } else {
      statesByCountryCache.value.clear();
    }
  }

  /**
   * Invalidar caché de ciudades para un estado
   */
  function invalidateCitiesCache(stateId?: string): void {
    if (stateId) {
      citiesByStateCache.value.delete(stateId);
    } else {
      citiesByStateCache.value.clear();
    }
  }

  /**
   * Limpiar todo el caché
   */
  function clearAllCache(): void {
    statesByCountryCache.value.clear();
    citiesByStateCache.value.clear();
    countries.value = [];
    states.value = [];
  }

  // ==========================================================================
  // CRUD OPERATIONS (actualizan caché automáticamente)
  // ==========================================================================

  /**
   * Crear estado e invalidar caché del país
   */
  async function createState(data: { name: string; code: string; country: string }): Promise<State | null> {
    try {
      const newState = await geographyService.createState(data);
      // Invalidar caché para que se recargue
      invalidateStatesCache(data.country);
      toast.success('Estado creado');
      return newState;
    } catch (err: any) {
      toast.error('Error creando estado');
      return null;
    }
  }

  /**
   * Crear ciudad e invalidar caché del estado
   */
  async function createCity(data: { name: string; code?: string; state: string }): Promise<City | null> {
    try {
      const newCity = await geographyService.createCity(data);
      invalidateCitiesCache(data.state);
      toast.success('Ciudad creada');
      return newCity;
    } catch (err: any) {
      toast.error('Error creando ciudad');
      return null;
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    countries,
    states,
    citiesByStateCache,
    statesByCountryCache,
    isLoading,
    errors,
    
    // Getters
    activeCountries,
    activeStates,
    hasStatesCached,
    getStatesFromCache,
    hasCitiesCached,
    getCitiesFromCache,
    getCountryById,
    getStateById,
    getCityById,
    
    // Actions
    loadCountries,
    loadStatesByCountry,
    loadCitiesByState,
    loadCitiesByCountry,
    invalidateStatesCache,
    invalidateCitiesCache,
    clearAllCache,
    createState,
    createCity,
  };
});
