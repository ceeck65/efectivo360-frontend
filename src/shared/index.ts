/**
 * @fileoverview Punto de entrada público del módulo @shared
 * @module @shared
 * 
 * Este módulo exporta componentes UI "mudos" y utilidades compartidas.
 * Los componentes no deben contener lógica de negocio específica de ningún módulo.
 */

// Componentes
export { default as LoadingSpinner } from './components/LoadingSpinner.vue';
export { default as ErrorMessage } from './components/ErrorMessage.vue';
export { default as DataTable } from './components/DataTable.vue';
export { default as DataTableJerarquica } from './components/DataTableJerarquica.vue';
export { default as LocationSelector } from './components/LocationSelector.vue';
export { default as TheSidebar } from './components/TheSidebar.vue';

// Types de componentes
export type { 
  SpinnerSize, 
  SpinnerColor 
} from './components/LoadingSpinner.vue';

export type { 
  ErrorVariant,
} from './components/ErrorMessage.vue';

export type { 
  Column, 
  ColumnAlign, 
  ColumnFormat, 
  SortOrder,
} from './components/DataTable.vue';
