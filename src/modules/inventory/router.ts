/**
 * @fileoverview Definición de rutas autónomas para el módulo Inventory
 * @module @modules/inventory/router
 * 
 * Este router define todas las rutas del módulo de inventario.
 * Se importa dinámicamente en el router central de la aplicación.
 */

import type { RouteRecordRaw } from 'vue-router';
import { defineAsyncComponent } from 'vue';

// Lazy loading de componentes de vista para code-splitting
const InventoryDashboard = defineAsyncComponent(() => 
  import('./views/InventoryDashboard.vue')
);

const ProductListView = defineAsyncComponent(() => 
  import('./views/ProductListView.vue')
);

const ProductDetailView = defineAsyncComponent(() => 
  import('./views/ProductDetailView.vue')
);

const ProductFormView = defineAsyncComponent(() => 
  import('./views/ProductFormView.vue')
);

const StockMovementsView = defineAsyncComponent(() => 
  import('./views/StockMovementsView.vue')
);

const StockAdjustmentView = defineAsyncComponent(() => 
  import('./views/StockAdjustmentView.vue')
);

const CategoriesView = defineAsyncComponent(() => 
  import('./views/CategoriesView.vue')
);

/** Prefijo de ruta para el módulo */
export const INVENTORY_ROUTE_PREFIX = '/inventory';

/** Nombre base para rutas del módulo */
export const INVENTORY_ROUTE_NAME = 'inventory';

/**
 * Definición de rutas del módulo Inventory
 * Todas las rutas se cargan con lazy loading para optimizar el bundle
 */
export const inventoryRoutes: RouteRecordRaw[] = [
  {
    path: INVENTORY_ROUTE_PREFIX,
    name: INVENTORY_ROUTE_NAME,
    component: InventoryDashboard,
    meta: {
      title: 'Inventario',
      requiresAuth: true,
      module: 'inventory',
      icon: 'Package',
      breadcrumb: 'Inventario',
    },
    children: [
      {
        path: '',
        name: `${INVENTORY_ROUTE_NAME}.dashboard`,
        component: InventoryDashboard,
        meta: {
          title: 'Dashboard de Inventario',
          breadcrumb: 'Dashboard',
        },
      },
      {
        path: 'products',
        name: `${INVENTORY_ROUTE_NAME}.products`,
        component: ProductListView,
        meta: {
          title: 'Productos',
          breadcrumb: 'Productos',
        },
      },
      {
        path: 'products/new',
        name: `${INVENTORY_ROUTE_NAME}.products.create`,
        component: ProductFormView,
        meta: {
          title: 'Nuevo Producto',
          breadcrumb: 'Nuevo',
        },
      },
      {
        path: 'products/:id',
        name: `${INVENTORY_ROUTE_NAME}.products.detail`,
        component: ProductDetailView,
        props: true,
        meta: {
          title: 'Detalle de Producto',
          breadcrumb: 'Detalle',
        },
      },
      {
        path: 'products/:id/edit',
        name: `${INVENTORY_ROUTE_NAME}.products.edit`,
        component: ProductFormView,
        props: true,
        meta: {
          title: 'Editar Producto',
          breadcrumb: 'Editar',
        },
      },
      {
        path: 'movements',
        name: `${INVENTORY_ROUTE_NAME}.movements`,
        component: StockMovementsView,
        meta: {
          title: 'Movimientos de Stock',
          breadcrumb: 'Movimientos',
        },
      },
      {
        path: 'movements/adjust',
        name: `${INVENTORY_ROUTE_NAME}.movements.adjust`,
        component: StockAdjustmentView,
        meta: {
          title: 'Ajuste de Inventario',
          breadcrumb: 'Ajuste',
        },
      },
      {
        path: 'categories',
        name: `${INVENTORY_ROUTE_NAME}.categories`,
        component: CategoriesView,
        meta: {
          title: 'Categorías',
          breadcrumb: 'Categorías',
        },
      },
    ],
  },
];

/**
 * Generador de paths tipados para navegación programática
 * @example
 * ```ts
 * import { inventoryPaths } from '@modules/inventory/router';
 * router.push(inventoryPaths.products());
 * router.push(inventoryPaths.productDetail('01HABC123'));
 * ```
 */
export const inventoryPaths = {
  /** Dashboard de inventario */
  dashboard: () => INVENTORY_ROUTE_PREFIX,
  
  /** Lista de productos */
  products: () => `${INVENTORY_ROUTE_PREFIX}/products`,
  
  /** Nuevo producto */
  productCreate: () => `${INVENTORY_ROUTE_PREFIX}/products/new`,
  
  /** Detalle de producto */
  productDetail: (id: string) => `${INVENTORY_ROUTE_PREFIX}/products/${id}`,
  
  /** Editar producto */
  productEdit: (id: string) => `${INVENTORY_ROUTE_PREFIX}/products/${id}/edit`,
  
  /** Movimientos de stock */
  movements: () => `${INVENTORY_ROUTE_PREFIX}/movements`,
  
  /** Ajuste de stock */
  adjustment: () => `${INVENTORY_ROUTE_PREFIX}/movements/adjust`,
  
  /** Categorías */
  categories: () => `${INVENTORY_ROUTE_PREFIX}/categories`,
} as const;

/**
 * Generador de nombres de rutas para uso con named routes
 * @example
 * ```ts
 * router.push({ name: inventoryRouteNames.products });
 * ```
 */
export const inventoryRouteNames = {
  dashboard: `${INVENTORY_ROUTE_NAME}.dashboard`,
  products: `${INVENTORY_ROUTE_NAME}.products`,
  productCreate: `${INVENTORY_ROUTE_NAME}.products.create`,
  productDetail: `${INVENTORY_ROUTE_NAME}.products.detail`,
  productEdit: `${INVENTORY_ROUTE_NAME}.products.edit`,
  movements: `${INVENTORY_ROUTE_NAME}.movements`,
  adjustment: `${INVENTORY_ROUTE_NAME}.movements.adjust`,
  categories: `${INVENTORY_ROUTE_NAME}.categories`,
} as const;

export default inventoryRoutes;
