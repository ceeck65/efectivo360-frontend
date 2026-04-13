/**
 * @fileoverview Tipos del módulo Geography
 * @module @modules/geography/types
 * 
 * Define la jerarquía geográfica: País → Estado → Ciudad
 * Todos los IDs son ULIDs.
 */

import type { ULID } from '@core/types';

// =============================================================================
// BASE GEOGRAPHY TYPES
// =============================================================================

/**
 * País
 */
export interface Country {
  id: ULID;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Estado/Provincia
 */
export interface State {
  id: ULID;
  name: string;
  code: string;
  country: ULID;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ciudad/Municipio
 */
export interface City {
  id: ULID;
  name: string;
  code: string;
  state: ULID;
  country: ULID;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// EXTENDED TYPES (with related data)
// =============================================================================

/**
 * Estado con información del país
 */
export interface StateWithCountry extends State {
  country_name: string;
}

/**
 * Ciudad con información del estado y país
 */
export interface CityWithRelations extends City {
  state_name: string;
  country_name: string;
}

// =============================================================================
// DROPDOWN / SELECTOR TYPES
// =============================================================================

/**
 * Opción para dropdowns
 */
export interface GeographyOption {
  value: ULID;
  label: string;
  code?: string;
  disabled?: boolean;
}

/**
 * Ubicación completa seleccionada
 */
export interface LocationSelection {
  countryId: ULID | null;
  stateId: ULID | null;
  cityId: ULID | null;
  countryName?: string;
  stateName?: string;
  cityName?: string;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

/**
 * Entrada de caché para ciudades por estado
 */
export interface CitiesCacheEntry {
  stateId: ULID;
  cities: City[];
  fetchedAt: number;
}

/**
 * Entrada de caché para estados por país
 */
export interface StatesCacheEntry {
  countryId: ULID;
  states: State[];
  fetchedAt: number;
}

// =============================================================================
// API PARAMS
// =============================================================================

/**
 * Parámetros para filtrar estados
 */
export interface StatesFilter {
  country?: ULID;
  is_active?: boolean;
}

/**
 * Parámetros para filtrar ciudades
 */
export interface CitiesFilter {
  state?: ULID;
  country?: ULID;
  is_active?: boolean;
}

// =============================================================================
// FORM DATA
// =============================================================================

/**
 * Datos para crear/editar un país
 */
export interface CountryFormData {
  name: string;
  code: string;
  is_active?: boolean;
}

/**
 * Datos para crear/editar un estado
 */
export interface StateFormData {
  name: string;
  code: string;
  country: ULID;
  is_active?: boolean;
}

/**
 * Datos para crear/editar una ciudad
 */
export interface CityFormData {
  name: string;
  code?: string;
  state: ULID;
  country?: ULID;
  is_active?: boolean;
}
