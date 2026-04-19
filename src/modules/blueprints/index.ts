/**
 * @fileoverview Entry point del módulo Blueprints
 * @module @modules/blueprints
 * 
 * Módulo para gestión de tipos de comercio (Industry Blueprints).
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  BusinessConditions,
  AttributeField,
  AttributeGroup,
  SchemaLogic,
  ProductSchemaField,
  Blueprint,
  BlueprintCreateData,
  BlueprintUpdateData,
  SchemaGroupsUpdateData,
} from './types';

// =============================================================================
// SERVICES
// =============================================================================

export {
  fetchBlueprints,
  fetchBlueprintById,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  fetchSchemaGroups,
  updateSchemaGroups,
} from './services/blueprints.service';

// =============================================================================
// ROUTER
// =============================================================================

export {
  blueprintsRoutes,
  blueprintsRouteNames,
  blueprintsPaths,
  BLUEPRINTS_ROUTE_PREFIX,
  BLUEPRINTS_ROUTE_NAME,
} from './router';
