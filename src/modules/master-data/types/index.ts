/**
 * @fileoverview Tipos del módulo Master Data (Jerarquía de Categorías con Blueprints)
 * @module @modules/master-data/types
 * 
 * Implementación de jerarquía de Categorías y Subcategorías basada en Blueprints.
 * Soporta atributos dinámicos según el tipo de categoría.
 */

import type { ULID } from '@core/types';

// =============================================================================
// BLUEPRINT TYPES (Atributos Dinámicos)
// =============================================================================

/**
 * Tipo de dato para atributos de blueprint
 */
export type BlueprintAttributeType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'size'
  | 'reference'
  | 'money'
  | 'percentage'
  | 'barcode';

/**
 * Definición de un atributo en el blueprint
 */
export interface BlueprintAttribute {
  id: ULID;
  code: string;
  name: string;
  description?: string;
  
  // Tipo y validación
  type: BlueprintAttributeType;
  isRequired: boolean;
  isFilterable: boolean;      // Puede usarse como filtro en búsquedas
  isSearchable: boolean;      // Puede buscarse
  
  // Configuración según tipo
  config: BlueprintAttributeConfig;
  
  // Orden
  sortOrder: number;
  
  // UI
  placeholder?: string;
  helpText?: string;
  icon?: string;
}

/**
 * Configuración específica según tipo de atributo
 */
export interface BlueprintAttributeConfig {
  // Para string
  minLength?: number;
  maxLength?: number;
  regex?: string;
  
  // Para number/money/percentage
  min?: number;
  max?: number;
  precision?: number;       // Decimales
  
  // Para select/multiselect
  options?: BlueprintAttributeOption[];
  allowCustom?: boolean;    // Permitir valores personalizados
  
  // Para reference
  referenceEntity?: string;   // Entidad referenciada (product, customer, etc.)
  
  // Para color
  colorFormat?: 'hex' | 'rgb' | 'name';
  
  // Para size
  sizeUnit?: string;        // cm, in, EU, US, etc.
  
  // Para barcode
  barcodeFormat?: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'QR';
  
  // Valor por defecto
  defaultValue?: string | number | boolean | string[];
  
  // Para fecha
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
}

/**
 * Opción para select/multiselect
 */
export interface BlueprintAttributeOption {
  value: string;
  label: string;
  color?: string;           // Para visualización
  icon?: string;
  sortOrder?: number;
}

/**
 * Blueprint completo
 * Define la estructura de atributos para una categoría
 */
export interface Blueprint {
  id: ULID;
  code: string;
  name: string;
  description?: string;
  
  // Atributos definidos
  attributes: BlueprintAttribute[];
  
  // Reglas de validación a nivel blueprint
  validationRules?: BlueprintValidationRule[];
  
  // UI
  icon?: string;
  color?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Regla de validación avanzada
 */
export interface BlueprintValidationRule {
  id: ULID;
  name: string;
  condition: 'all' | 'any' | 'none';
  conditions: Array<{
    attributeCode: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
    value: unknown;
  }>;
  errorMessage: string;
}

// =============================================================================
// CATEGORY TYPES (Jerarquía)
// =============================================================================

/**
 * Categoría jerárquica
 */
export interface Category {
  id: ULID;
  code: string;
  name: string;
  description?: string;
  
  // Jerarquía
  parentId: ULID | null;
  level: number;              // 0 = root, 1 = subcategoría, etc.
  path: string;               // Path materializado: /1/2/3/
  sortOrder: number;
  
  // Blueprint (atributos dinámicos)
  blueprintId: ULID;
  blueprint?: Blueprint;
  
  // Árbol
  children?: Category[];      // Subcategorías (lazy loaded)
  hasChildren: boolean;       // Flag para saber si tiene hijos sin cargar
  
  // UI
  icon?: string;
  color?: string;
  imageUrl?: string;
  
  // Estado
  isActive: boolean;
  isPublic: boolean;
  
  // Contadores
  productCount?: number;    // Cantidad de productos en esta categoría
  productCountRecursive?: number; // Cantidad incluyendo subcategorías
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Árbol de categorías (estructura recursiva)
 */
export interface CategoryTree {
  category: Category;
  children: CategoryTree[];
  level: number;
  isExpanded: boolean;
  isLoading: boolean;
}

/**
 * Categoría con datos completos
 */
export interface CategoryDetail extends Category {
  // Atributos del blueprint con valores por defecto
  defaultAttributeValues: Record<string, unknown>;
  
  // Subcategorías cargadas
  subcategories: Category[];
  
  // Camino completo desde raíz
  breadcrumb: Array<{ id: ULID; name: string; code: string }>;
}

// =============================================================================
// DATA ENTITY TYPES (Entidades con atributos dinámicos)
// =============================================================================

/**
 * Valor de atributo dinámico
 */
export interface DynamicAttributeValue {
  attributeId: ULID;
  attributeCode: string;
  
  // Valor (tipo según definición en blueprint)
  value: string | number | boolean | string[] | null;
  
  // Metadata
  displayValue: string;       // Versión formateada para UI
  unit?: string;              // Unidad (para números)
}

/**
 * Entidad con atributos dinámicos
 * Ejemplo: Product con atributos de su categoría
 */
export interface DynamicEntity {
  id: ULID;
  entityType: 'product' | 'customer' | 'location' | 'asset' | string;
  
  // Datos base
  name: string;
  code?: string;
  description?: string;
  
  // Categoría y blueprint
  categoryId: ULID;
  category?: Category;
  blueprintId: ULID;
  
  // Atributos dinámicos
  attributeValues: DynamicAttributeValue[];
  
  // Acceso rápido por código
  attributesByCode: Record<string, DynamicAttributeValue>;
  
  // Estado
  isActive: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// FILTER & SEARCH TYPES
// =============================================================================

/**
 * Filtro para entidades con atributos dinámicos
 */
export interface DynamicAttributeFilter {
  attributeId: ULID;
  attributeCode: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: unknown;
  valueTo?: unknown;          // Para operadores 'between'
}

/**
 * Filtros para categorías
 */
export interface CategoryFilters {
  parentId?: ULID | null;     // null = solo raíces
  level?: number;
  isActive?: boolean;
  isPublic?: boolean;
  hasBlueprintId?: ULID;
  search?: string;
  includeInactive?: boolean;
}

/**
 * Filtros para entidades dinámicas
 */
export interface DynamicEntityFilters {
  categoryId?: ULID;
  categoryPath?: string;      // Filtrar por path (incluye subcategorías)
  blueprintId?: ULID;
  attributeFilters?: DynamicAttributeFilter[];
  search?: string;
  isActive?: boolean;
}

// =============================================================================
// FORM & UI TYPES
// =============================================================================

/**
 * Datos para crear/editar categoría
 */
export interface CategoryFormData {
  code: string;
  name: string;
  description?: string;
  parentId?: ULID | null;
  blueprintId: ULID;
  icon?: string;
  color?: string;
  imageUrl?: string;
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
}

/**
 * Datos para crear/editar blueprint
 */
export interface BlueprintFormData {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  attributes: Array<Omit<BlueprintAttribute, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Nodo para el árbol jerárquico en UI
 */
export interface TreeNode {
  id: ULID;
  label: string;
  icon?: string;
  color?: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
  data: Category;
}

/**
 * Columna para DataTableJerarquica
 */
export interface HierarchyColumn {
  field: string;
  header: string;
  width?: string;
  type?: 'text' | 'number' | 'badge' | 'icon' | 'actions' | 'tree';
  format?: (value: unknown, row: Category) => string;
  sortable?: boolean;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Respuesta de árbol de categorías
 */
export interface CategoryTreeResponse {
  tree: CategoryTree[];
  total: number;
  maxLevel: number;
}

/**
 * Respuesta de movimiento en jerarquía
 */
export interface MoveCategoryResponse {
  success: boolean;
  newPath: string;
  newLevel: number;
  affectedRows: number;       // Cuántas categorías se actualizaron
}
