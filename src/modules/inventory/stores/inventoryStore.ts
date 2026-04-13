/**
 * @fileoverview Store Pinia para el módulo Inventory
 * @module @modules/inventory/stores/inventoryStore
 * 
 * Este store maneja exclusivamente el estado del módulo de inventario.
 * No debe contener lógica de negocio compleja (eso va en composables).
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ULID } from '@core/types';
import type {
  Product,
  ProductCategoryEntity,
  StockMovement,
  InventorySummary,
  ProductFilters,
} from '../types';

/**
 * Store para gestionar el estado del módulo Inventory
 * @returns {Object} Store con estado y acciones del inventario
 */
export const useInventoryStore = defineStore('inventory', () => {
  // ==================== STATE ====================
  
  const products = ref<Product[]>([]);
  const categories = ref<ProductCategoryEntity[]>([]);
  const movements = ref<StockMovement[]>([]);
  
  const selectedProductId = ref<ULID | null>(null);
  const selectedCategoryId = ref<ULID | null>(null);
  
  const summary = ref<InventorySummary | null>(null);
  
  const activeFilters = ref<ProductFilters>({});
  
  const isLoadingProducts = ref(false);
  const isLoadingMovements = ref(false);
  const isLoadingSummary = ref(false);
  
  const productsError = ref<string | null>(null);
  const movementsError = ref<string | null>(null);
  const summaryError = ref<string | null>(null);
  
  const productsPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  
  const movementsPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // ==================== GETTERS ====================
  
  /** Producto actualmente seleccionado */
  const selectedProduct = computed<Product | undefined>(() => {
    if (!selectedProductId.value) return undefined;
    return products.value.find(p => p.id === selectedProductId.value);
  });
  
  /** Categoría actualmente seleccionada */
  const selectedCategory = computed<ProductCategoryEntity | undefined>(() => {
    if (!selectedCategoryId.value) return undefined;
    return categories.value.find(c => c.id === selectedCategoryId.value);
  });
  
  /** Productos con stock bajo */
  const lowStockProducts = computed<Product[]>(() => {
    return products.value.filter(
      p => p.currentStock <= p.minStockLevel && p.isActive
    );
  });
  
  /** Productos sin stock (agotados) */
  const outOfStockProducts = computed<Product[]>(() => {
    return products.value.filter(p => p.currentStock === 0 && p.isActive);
  });
  
  /** Productos filtrados por categoría seleccionada */
  const filteredByCategory = computed<Product[]>(() => {
    if (!selectedCategoryId.value) return products.value;
    return products.value.filter(p => p.categoryId === selectedCategoryId.value);
  });
  
  /** Total de páginas de productos */
  const productsTotalPages = computed<number>(() => {
    return Math.ceil(productsPagination.value.total / productsPagination.value.pageSize);
  });
  
  /** Hay más páginas de productos */
  const hasMoreProducts = computed<boolean>(() => {
    return productsPagination.value.page < productsTotalPages.value;
  });
  
  /** Alguna operación está cargando */
  const isAnyLoading = computed<boolean>(() => {
    return isLoadingProducts.value || isLoadingMovements.value || isLoadingSummary.value;
  });
  
  /** Hay algún error activo */
  const hasAnyError = computed<boolean>(() => {
    return !!(productsError.value || movementsError.value || summaryError.value);
  });

  // ==================== ACTIONS ====================
  
  /**
   * Establece la lista de productos
   * @param {Product[]} items - Productos a establecer
   * @param {number} total - Total para paginación
   * @param {boolean} append - Si true, agrega en lugar de reemplazar
   */
  function setProducts(items: Product[], total?: number, append: boolean = false): void {
    if (append) {
      // Evita duplicados por ULID
      const existingIds = new Set(products.value.map(p => p.id));
      const newItems = items.filter(p => !existingIds.has(p.id));
      products.value = [...products.value, ...newItems];
    } else {
      products.value = items;
    }
    
    if (total !== undefined) {
      productsPagination.value.total = total;
    }
  }
  
  /**
   * Agrega o actualiza un producto en la lista
   * @param {Product} product - Producto a agregar/actualizar
   */
  function upsertProduct(product: Product): void {
    const index = products.value.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products.value[index] = product;
    } else {
      products.value.unshift(product);
    }
  }
  
  /**
   * Elimina un producto de la lista
   * @param {ULID} id - ID del producto a eliminar
   */
  function removeProduct(id: ULID): void {
    products.value = products.value.filter(p => p.id !== id);
  }
  
  /**
   * Selecciona un producto por ID
   * @param {ULID | null} id - ID del producto o null para deseleccionar
   */
  function selectProduct(id: ULID | null): void {
    selectedProductId.value = id;
  }
  
  /**
   * Establece las categorías
   * @param {ProductCategoryEntity[]} items - Categorías
   */
  function setCategories(items: ProductCategoryEntity[]): void {
    categories.value = items;
  }
  
  /**
   * Selecciona una categoría
   * @param {ULID | null} id - ID de categoría
   */
  function selectCategory(id: ULID | null): void {
    selectedCategoryId.value = id;
  }
  
  /**
   * Establece los movimientos de stock
   * @param {StockMovement[]} items - Movimientos
   * @param {number} total - Total para paginación
   * @param {boolean} append - Agregar o reemplazar
   */
  function setMovements(items: StockMovement[], total?: number, append: boolean = false): void {
    if (append) {
      movements.value = [...movements.value, ...items];
    } else {
      movements.value = items;
    }
    
    if (total !== undefined) {
      movementsPagination.value.total = total;
    }
  }
  
  /**
   * Agrega un movimiento al inicio de la lista
   * @param {StockMovement} movement - Movimiento a agregar
   */
  function addMovement(movement: StockMovement): void {
    movements.value.unshift(movement);
  }
  
  /**
   * Establece el resumen de inventario
   * @param {InventorySummary} data - Datos del resumen
   */
  function setSummary(data: InventorySummary): void {
    summary.value = data;
  }
  
  /**
   * Actualiza filtros activos
   * @param {ProductFilters} filters - Filtros a aplicar
   * @param {boolean} resetPage - Reiniciar a página 1
   */
  function setFilters(filters: ProductFilters, resetPage: boolean = true): void {
    activeFilters.value = { ...activeFilters.value, ...filters };
    if (resetPage) {
      productsPagination.value.page = 1;
    }
  }
  
  /**
   * Limpia todos los filtros
   */
  function clearFilters(): void {
    activeFilters.value = {};
    productsPagination.value.page = 1;
  }
  
  /**
   * Cambia de página de productos
   * @param {number} page - Número de página
   */
  function setProductsPage(page: number): void {
    productsPagination.value.page = page;
  }
  
  /**
   * Cambia el tamaño de página de productos
   * @param {number} pageSize - Registros por página
   */
  function setProductsPageSize(pageSize: number): void {
    productsPagination.value.pageSize = pageSize;
    productsPagination.value.page = 1;
  }
  
  /**
   * Establece estados de carga
   */
  function setLoadingProducts(loading: boolean): void {
    isLoadingProducts.value = loading;
    if (loading) productsError.value = null;
  }
  
  function setLoadingMovements(loading: boolean): void {
    isLoadingMovements.value = loading;
    if (loading) movementsError.value = null;
  }
  
  function setLoadingSummary(loading: boolean): void {
    isLoadingSummary.value = loading;
    if (loading) summaryError.value = null;
  }
  
  /**
   * Establece errores
   */
  function setProductsError(error: string | null): void {
    productsError.value = error;
    isLoadingProducts.value = false;
  }
  
  function setMovementsError(error: string | null): void {
    movementsError.value = error;
    isLoadingMovements.value = false;
  }
  
  function setSummaryError(error: string | null): void {
    summaryError.value = error;
    isLoadingSummary.value = false;
  }
  
  /**
   * Limpia todos los errores
   */
  function clearErrors(): void {
    productsError.value = null;
    movementsError.value = null;
    summaryError.value = null;
  }
  
  /**
   * Resetea el store a su estado inicial
   */
  function $reset(): void {
    products.value = [];
    categories.value = [];
    movements.value = [];
    selectedProductId.value = null;
    selectedCategoryId.value = null;
    summary.value = null;
    activeFilters.value = {};
    isLoadingProducts.value = false;
    isLoadingMovements.value = false;
    isLoadingSummary.value = false;
    productsError.value = null;
    movementsError.value = null;
    summaryError.value = null;
    productsPagination.value = { page: 1, pageSize: 20, total: 0 };
    movementsPagination.value = { page: 1, pageSize: 20, total: 0 };
  }

  return {
    // State
    products,
    categories,
    movements,
    selectedProductId,
    selectedCategoryId,
    summary,
    activeFilters,
    isLoadingProducts,
    isLoadingMovements,
    isLoadingSummary,
    productsError,
    movementsError,
    summaryError,
    productsPagination,
    movementsPagination,
    // Getters
    selectedProduct,
    selectedCategory,
    lowStockProducts,
    outOfStockProducts,
    filteredByCategory,
    productsTotalPages,
    hasMoreProducts,
    isAnyLoading,
    hasAnyError,
    // Actions
    setProducts,
    upsertProduct,
    removeProduct,
    selectProduct,
    setCategories,
    selectCategory,
    setMovements,
    addMovement,
    setSummary,
    setFilters,
    clearFilters,
    setProductsPage,
    setProductsPageSize,
    setLoadingProducts,
    setLoadingMovements,
    setLoadingSummary,
    setProductsError,
    setMovementsError,
    setSummaryError,
    clearErrors,
    $reset,
  };
});

export default useInventoryStore;
