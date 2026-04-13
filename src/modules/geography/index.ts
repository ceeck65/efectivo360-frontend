/**
 * @fileoverview Punto de entrada público del módulo Geography
 * @module @modules/geography
 * 
 * Módulo de geografía jerárquica:
 * - País → Estado → Ciudad
 * 
 * Características:
 * - Caché automático de estados por país
 * - Caché automático de ciudades por estado
 * - TTL de 5 minutos para entradas de caché
 * 
 * API Pública - Solo importar desde aquí, nunca de subcarpetas internas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Geography types
  Country,
  State,
  City,
  StateWithCountry,
  CityWithRelations,
  
  // Selector types
  GeographyOption,
  LocationSelection,
  
  // Cache types
  CitiesCacheEntry,
  StatesCacheEntry,
  
  // Filter types
  StatesFilter,
  CitiesFilter,
  
  // Form types
  CountryFormData,
  StateFormData,
  CityFormData,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  // Countries
  fetchCountries,
  fetchActiveCountries,
  fetchCountryById,
  createCountry,
  updateCountry,
  
  // States (hierarchical)
  fetchStates,
  getStates,
  fetchActiveStates,
  fetchStateById,
  createState,
  updateState,
  
  // Cities (hierarchical)
  fetchCities,
  getCitiesByState,
  getCitiesByCountry,
  fetchActiveCities,
  fetchCityById,
  createCity,
  updateCity,
  
  // Hierarchical helpers
  loadLocationHierarchy,
  fetchStatesByIds,
  fetchCitiesByIds,
} from './services/geography.service';

// =============================================================================
// STORE
// =============================================================================

export { useGeographyStore } from './stores/geographyStore';

// =============================================================================
// COMPOSABLES
// =============================================================================

export {
  useGeography,
  useGeographyDisplay,
  useGeographyForm,
} from './composables/useGeography';
