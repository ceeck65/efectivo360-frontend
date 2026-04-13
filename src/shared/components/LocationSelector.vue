<template>
  <div class="space-y-4">
    <!-- Country Select -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ countryLabel }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <select
        v-model="selectedCountryId"
        :disabled="disabled || isLoadingCountries"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="{ 'border-red-300': validationErrors?.country }"
      >
        <option value="">{{ countryPlaceholder }}</option>
        <option
          v-for="option in countryOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p v-if="validationErrors?.country" class="mt-1 text-xs text-red-600">
        {{ validationErrors.country }}
      </p>
      <LoadingSpinner v-if="isLoadingCountries" size="sm" class="mt-1" />
    </div>

    <!-- State Select -->
    <div v-if="showState && selectedCountryId">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ stateLabel }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <select
        v-model="selectedStateId"
        :disabled="disabled || isLoadingStates || !selectedCountryId"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="{ 'border-red-300': validationErrors?.state }"
      >
        <option value="">{{ statePlaceholder }}</option>
        <option
          v-for="option in stateOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p v-if="validationErrors?.state" class="mt-1 text-xs text-red-600">
        {{ validationErrors.state }}
      </p>
      <LoadingSpinner v-if="isLoadingStates" size="sm" class="mt-1" />
    </div>

    <!-- City Select -->
    <div v-if="showCity && selectedStateId">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ cityLabel }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <select
        v-model="selectedCityId"
        :disabled="disabled || isLoadingCities || !selectedStateId"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="{ 'border-red-300': validationErrors?.city }"
      >
        <option value="">{{ cityPlaceholder }}</option>
        <option
          v-for="option in cityOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p v-if="validationErrors?.city" class="mt-1 text-xs text-red-600">
        {{ validationErrors.city }}
      </p>
      <LoadingSpinner v-if="isLoadingCities" size="sm" class="mt-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente selector de ubicación en cascada
 * @module @shared/components/LocationSelector
 * 
 * Selector jerárquico: País → Estado → Ciudad
 * Usa el módulo Geography con caché automático
 * 
 * @example
 * <LocationSelector
 *   v-model:country="countryId"
 *   v-model:state="stateId"
 *   v-model:city="cityId"
 *   required
 * />
 */
import { computed, onMounted, watch } from 'vue';
import { useGeography } from '@modules/geography';
import LoadingSpinner from './LoadingSpinner.vue';

// =============================================================================
// PROPS & EMITS
// =============================================================================

interface Props {
  // Model values
  country?: string | null;
  state?: string | null;
  city?: string | null;
  
  // Visibility toggles
  showState?: boolean;
  showCity?: boolean;
  
  // Labels
  countryLabel?: string;
  stateLabel?: string;
  cityLabel?: string;
  
  // Placeholders
  countryPlaceholder?: string;
  statePlaceholder?: string;
  cityPlaceholder?: string;
  
  // Validation
  required?: boolean;
  validationErrors?: {
    country?: string;
    state?: string;
    city?: string;
  };
  
  // State
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  country: null,
  state: null,
  city: null,
  showState: true,
  showCity: true,
  countryLabel: 'País',
  stateLabel: 'Estado / Provincia',
  cityLabel: 'Ciudad / Municipio',
  countryPlaceholder: 'Selecciona un país',
  statePlaceholder: 'Selecciona un estado',
  cityPlaceholder: 'Selecciona una ciudad',
  required: false,
  validationErrors: () => ({}),
  disabled: false,
});

const emit = defineEmits<{
  'update:country': [value: string | null];
  'update:state': [value: string | null];
  'update:city': [value: string | null];
  'change': [selection: { country: string | null; state: string | null; city: string | null }];
}>();

// =============================================================================
// GEOGRAPHY COMPOSABLE
// =============================================================================

const geography = useGeography();

// Initialize on mount
onMounted(() => {
  geography.initialize();
  
  // Set initial values if provided
  if (props.country) {
    geography.setSelection(props.country, props.state || null, props.city || null);
  }
});

// =============================================================================
// SYNC PROPS WITH GEOGRAPHY STATE
// =============================================================================

// Country binding
const selectedCountryId = computed({
  get: () => props.country || geography.selectedCountryId.value,
  set: (value) => {
    geography.selectedCountryId.value = value;
    emit('update:country', value);
    emit('change', {
      country: value,
      state: selectedStateId.value,
      city: selectedCityId.value,
    });
  },
});

// State binding
const selectedStateId = computed({
  get: () => props.state || geography.selectedStateId.value,
  set: (value) => {
    geography.selectedStateId.value = value;
    emit('update:state', value);
    emit('change', {
      country: selectedCountryId.value,
      state: value,
      city: selectedCityId.value,
    });
  },
});

// City binding
const selectedCityId = computed({
  get: () => props.city || geography.selectedCityId.value,
  set: (value) => {
    geography.selectedCityId.value = value;
    emit('update:city', value);
    emit('change', {
      country: selectedCountryId.value,
      state: selectedStateId.value,
      city: value,
    });
  },
});

// Expose options and loading states from geography
const countryOptions = geography.countryOptions;
const stateOptions = geography.stateOptions;
const cityOptions = geography.cityOptions;
const isLoadingCountries = geography.isLoadingCountries;
const isLoadingStates = geography.isLoadingStates;
const isLoadingCities = geography.isLoadingCities;

// =============================================================================
// WATCH FOR EXTERNAL CHANGES
// =============================================================================

watch(() => props.country, (newVal) => {
  if (newVal && newVal !== geography.selectedCountryId.value) {
    geography.setSelection(newVal, props.state || null, props.city || null);
  }
});
</script>
