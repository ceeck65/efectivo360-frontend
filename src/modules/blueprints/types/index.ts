/**
 * @fileoverview Tipos del módulo Blueprints (Tipos de Comercio)
 * @module @modules/blueprints/types
 * 
 * Gestión de tipos de comercio (Industry Blueprints) con configuración de negocio,
 * schema de productos y grupos de atributos.
 */

// =============================================================================
// BUSINESS CONDITIONS
// =============================================================================

/**
 * Condiciones de negocio para un blueprint
 */
export interface BusinessConditions {
  fractional_sale?: boolean;
  service_management?: boolean;
  attribute_control?: boolean;
  traceability?: boolean;
}

// =============================================================================
// SCHEMA LOGIC
// =============================================================================

/**
 * Campo de atributo en schema_logic
 */
export interface AttributeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'weight';
  options?: string[];
  required?: boolean;
  unit?: string;
}

/**
 * Grupo de atributos en schema_logic
 */
export interface AttributeGroup {
  fields: AttributeField[];
}

/**
 * Lógica de schema con grupos
 */
export interface SchemaLogic {
  grupos: Record<string, AttributeGroup>;
}

// =============================================================================
// PRODUCT SCHEMA
// =============================================================================

/**
 * Campo de schema de producto
 */
export interface ProductSchemaField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

// =============================================================================
// BLUEPRINT
// =============================================================================

/**
 * Blueprint de industria (Tipo de comercio)
 */
export interface Blueprint {
  id: number;
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
  required_features?: string[];
  category_structure?: unknown[];
  default_categories?: string[];
  business_conditions?: BusinessConditions;
  product_schema?: ProductSchemaField[];
  schema_logic?: SchemaLogic;
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Datos para crear blueprint
 */
export interface BlueprintCreateData {
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
  required_features: string[];
  category_structure: unknown[];
  default_categories: string[];
  business_conditions: BusinessConditions;
  product_schema: ProductSchemaField[];
}

/**
 * Datos para actualizar blueprint
 */
export interface BlueprintUpdateData {
  name?: string;
  icon?: string;
  is_active?: boolean;
  required_features?: string[];
  default_categories?: string[];
  business_conditions?: BusinessConditions;
  product_schema?: ProductSchemaField[];
}

/**
 * Datos para actualizar grupos de schema_logic
 */
export interface SchemaGroupsUpdateData {
  grupos: Record<string, AttributeGroup>;
}
