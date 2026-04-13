/**
 * @fileoverview Punto de entrada público del módulo Inventory
 * @module @modules/inventory
 * 
 * Este archivo exporta únicamente la API pública del módulo.
 * Ningún otro módulo debe importar archivos internos directamente.
 */

// Router
export { 
  inventoryRoutes, 
  inventoryPaths, 
  inventoryRouteNames,
  INVENTORY_ROUTE_PREFIX,
  INVENTORY_ROUTE_NAME,
} from './router';

// Composable principal
export { useInventory } from './composables/useInventory';

// Store
export { useInventoryStore } from './stores/inventoryStore';

// Types públicos del módulo
export type {
  Product,
  ProductCategoryEntity,
  StockMovement,
  ProductLot,
  InventorySummary,
  ProductFilters,
  StockMovementFilters,
  CreateProductDTO,
  UpdateProductDTO,
  CreateStockMovementDTO,
  StockLevel,
  ProductCategory,
  UnitOfMeasure,
  StockMovementType,
} from './types';

// Componentes específicos del módulo (para uso interno o lazy loading)
export { default as ProductStockBadge } from './components/ProductStockBadge.vue';
