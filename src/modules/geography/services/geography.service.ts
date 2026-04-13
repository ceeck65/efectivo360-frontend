/**
 * @fileoverview Servicio de API para Geography
 * @module @modules/geography/services/geography.service
 * 
 * Endpoints jerárquicos para obtener ubicaciones:
 * - getStates(countryId) → Estados por país
 * - getCitiesByState(stateId) → Ciudades por estado
 * - getCitiesByCountry(countryId) → Todas las ciudades de un país
 */

import { httpClient } from '@core/index.js';
import type { ApiResponse, PaginatedResponse } from '@core/types';
import type {
  Country,
  State,
  City,
  StateWithCountry,
  CityWithRelations,
  CountryFormData,
  StateFormData,
  CityFormData,
} from '../types';

const BASE_URL = '/geography';

// =============================================================================
// COUNTRIES
// =============================================================================

/**
 * Obtener todos los países
 */
export async function fetchCountries(): Promise<Country[]> {
  const response = await httpClient.get<ApiResponse<Country[]>>(`${BASE_URL}/countries/`);
  return response.data.data || [];
}

/**
 * Obtener países activos
 */
export async function fetchActiveCountries(): Promise<Country[]> {
  const response = await httpClient.get<ApiResponse<Country[]>>(`${BASE_URL}/countries/active/`);
  return response.data.data || [];
}

/**
 * Obtener un país por ID
 */
export async function fetchCountryById(id: string): Promise<Country | null> {
  const response = await httpClient.get<ApiResponse<Country>>(`${BASE_URL}/countries/${id}/`);
  return response.data.data || null;
}

/**
 * Crear un país
 */
export async function createCountry(data: CountryFormData): Promise<Country> {
  const response = await httpClient.post<ApiResponse<Country>>(`${BASE_URL}/countries/`, data);
  return response.data.data!;
}

/**
 * Actualizar un país
 */
export async function updateCountry(id: string, data: Partial<CountryFormData>): Promise<Country> {
  const response = await httpClient.put<ApiResponse<Country>>(`${BASE_URL}/countries/${id}/`, data);
  return response.data.data!;
}

// =============================================================================
// STATES (Jerárquico por país)
// =============================================================================

/**
 * Obtener todos los estados
 */
export async function fetchStates(): Promise<State[]> {
  const response = await httpClient.get<PaginatedResponse<State>>(`${BASE_URL}/states/`);
  return response.data.results || [];
}

/**
 * Obtener estados por país
 * Endpoint jerárquico: /states/by-country?country={id}
 */
export async function getStates(countryId: string): Promise<State[]> {
  const response = await httpClient.get<State[]>(
    `${BASE_URL}/states/by-country/`,
    { params: { country: countryId } }
  );
  return response.data || [];
}

/**
 * Obtener estados activos
 */
export async function fetchActiveStates(): Promise<StateWithCountry[]> {
  const response = await httpClient.get<ApiResponse<StateWithCountry[]>>(
    `${BASE_URL}/states/active/`
  );
  return response.data.data || [];
}

/**
 * Obtener un estado por ID
 */
export async function fetchStateById(id: string): Promise<State | null> {
  const response = await httpClient.get<ApiResponse<State>>(`${BASE_URL}/states/${id}/`);
  return response.data.data || null;
}

/**
 * Crear un estado
 */
export async function createState(data: StateFormData): Promise<State> {
  const response = await httpClient.post<ApiResponse<State>>(`${BASE_URL}/states/`, data);
  return response.data.data!;
}

/**
 * Actualizar un estado
 */
export async function updateState(id: string, data: Partial<StateFormData>): Promise<State> {
  const response = await httpClient.put<ApiResponse<State>>(`${BASE_URL}/states/${id}/`, data);
  return response.data.data!;
}

// =============================================================================
// CITIES (Jerárquico por estado o país)
// =============================================================================

/**
 * Obtener todas las ciudades
 */
export async function fetchCities(): Promise<City[]> {
  const response = await httpClient.get<PaginatedResponse<City>>(`${BASE_URL}/cities/`);
  return response.data.results || [];
}

/**
 * Obtener ciudades por estado (Municipios)
 * Endpoint jerárquico: /cities/by-state?state={id}
 */
export async function getCitiesByState(stateId: string): Promise<City[]> {
  const response = await httpClient.get<City[]>(
    `${BASE_URL}/cities/by-state/`,
    { params: { state: stateId } }
  );
  return response.data || [];
}

/**
 * Obtener ciudades por país
 * Endpoint: /cities/by-country?country={id}
 */
export async function getCitiesByCountry(countryId: string): Promise<City[]> {
  const response = await httpClient.get<City[]>(
    `${BASE_URL}/cities/by-country/`,
    { params: { country: countryId } }
  );
  return response.data || [];
}

/**
 * Obtener ciudades activas
 */
export async function fetchActiveCities(): Promise<CityWithRelations[]> {
  const response = await httpClient.get<ApiResponse<CityWithRelations[]>>(
    `${BASE_URL}/cities/active/`
  );
  return response.data.data || [];
}

/**
 * Obtener una ciudad por ID
 */
export async function fetchCityById(id: string): Promise<City | null> {
  const response = await httpClient.get<ApiResponse<City>>(`${BASE_URL}/cities/${id}/`);
  return response.data.data || null;
}

/**
 * Crear una ciudad
 */
export async function createCity(data: CityFormData): Promise<City> {
  const response = await httpClient.post<ApiResponse<City>>(`${BASE_URL}/cities/`, data);
  return response.data.data!;
}

/**
 * Actualizar una ciudad
 */
export async function updateCity(id: string, data: Partial<CityFormData>): Promise<City> {
  const response = await httpClient.put<ApiResponse<City>>(`${BASE_URL}/cities/${id}/`, data);
  return response.data.data!;
}

// =============================================================================
// HIERARCHICAL HELPERS
// =============================================================================

/**
 * Cargar jerarquía completa: País → Estados → Ciudades
 * Útil para inicializar selectores en cascada
 */
export async function loadLocationHierarchy(
  countryId: string
): Promise<{
  country: Country | null;
  states: State[];
  citiesByState: Map<string, City[]>;
}> {
  const [country, states] = await Promise.all([
    fetchCountryById(countryId),
    getStates(countryId),
  ]);

  // Cargar ciudades para cada estado
  const citiesByState = new Map<string, City[]>();
  
  if (states.length > 0) {
    const citiesPromises = states.map(state =>
      getCitiesByState(state.id).then(cities => ({
        stateId: state.id,
        cities,
      }))
    );
    
    const citiesResults = await Promise.all(citiesPromises);
    citiesResults.forEach(({ stateId, cities }) => {
      citiesByState.set(stateId, cities);
    });
  }

  return {
    country,
    states,
    citiesByState,
  };
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Obtener múltiples estados por sus IDs
 */
export async function fetchStatesByIds(ids: string[]): Promise<State[]> {
  if (ids.length === 0) return [];
  
  const promises = ids.map(id => fetchStateById(id));
  const results = await Promise.all(promises);
  return results.filter((s): s is State => s !== null);
}

/**
 * Obtener múltiples ciudades por sus IDs
 */
export async function fetchCitiesByIds(ids: string[]): Promise<City[]> {
  if (ids.length === 0) return [];
  
  const promises = ids.map(id => fetchCityById(id));
  const results = await Promise.all(promises);
  return results.filter((c): c is City => c !== null);
}
