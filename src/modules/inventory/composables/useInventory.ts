/**
 * @fileoverview Composable principal para el módulo Inventory
 * @module @modules/inventory/composables/useInventory
 * 
 * Este composable encapsula toda la lógica de negocio del inventario,
 * manejo de errores, estados de carga, y expone una API limpia para las vistas.
 * Es la única interfaz que las vistas deben usar para interactuar con el módulo.
 */

import { computed, ref } from 'vue';
import { toast } from 'vue3-toastify';
import type { ULID, ApiError } from '@core/types';
import { useInventoryStore } from '../stores/inventoryStore';
import { InventoryService } from '../services/inventory.service';
import type {
  Product,
  ProductCategoryEntity,
  StockMovement,
  InventorySummary,
  ProductFilters,
  StockMovementFilters,
  CreateProductDTO,
  UpdateProductDTO,
  CreateStockMovementDTO,
  StockLevel,
} from '../types';

/** Estado de carga granular */
interface LoadingState {
  products: boolean;
  product: boolean;
  categories: boolean;
  movements: boolean;
  summary: boolean;
  saving: boolean;
  deleting: boolean;
  adjusting: boolean;
}

/** Errores por operación */
interface ErrorState {
  products: string | null;
  product: string | null;
  categories: string | null;
  movements: string | null;
  summary: string | null;
  save: string | null;
  delete: string | null;
  adjust: string | null;
}

/**
 * Composable para gestionar todas las operaciones del módulo Inventory
 * @returns {Object} API completa del módulo de inventario
 */
export function useInventory() {
  const store = useInventoryStore();
  
  // ==================== STATE LOCAL ====================
  
  /** Estado de carga detallado */
  const loading = ref<LoadingState>({
    products: false,
    product: false,
    categories: false,
    movements: false,
    summary: false,
    saving: false,
    deleting: false,
    adjusting: false,
  });
  
  /** Errores por operación */
  const errors = ref<ErrorState>({
    products: null,
    product: null,
    categories: null,
    movements: null,
    summary: null,
    save: null,
    delete: null,
    adjust: null,
  });
  
  // ==================== GETTERS ====================
  
  /** Productos desde el store */
  const products = computed<Product[]>(() => store.products);
  
  /** Categorías desde el store */
  const categories = computed<ProductCategoryEntity[]>(() => store.categories);
  
  /** Movimientos desde el store */
  const movements = computed<StockMovement[]>(() => store.movements);
  
  /** Producto seleccionado */
  const selectedProduct = computed<Product | undefined>(() => store.selectedProduct);
  
  /** Resumen del inventario */
  const summary = computed<InventorySummary | null>(() => store.summary);
  
  /** Filtros activos */
  const activeFilters = computed<ProductFilters>(() => store.activeFilters);
  
  /** Hay alguna operación en curso */
  const isLoading = computed<boolean>(() => 
    Object.values(loading.value).some(Boolean)
  );
  
  /** Hay algún error activo */
  const hasErrors = computed<boolean>(() => 
    Object.values(errors.value).some(Boolean)
  );
  
  /** Productos con alerta de stock */
  const productsWithStockAlerts = computed<Product[]>(() => 
    store.lowStockProducts
  );
  
  /** Info de paginación */
  const pagination = computed(() => ({
    page: store.productsPagination.page,
    pageSize: store.productsPagination.pageSize,
    total: store.productsPagination.total,
    totalPages: store.productsTotalPages,
    hasMore: store.hasMoreProducts,
  }));

  // ==================== HELPERS ====================
  
  /**
   * Determina el nivel de stock de un producto
   * @param {Product} product - Producto a evaluar
   * @returns {StockLevel} Nivel de stock
   */
  function getStockLevel(product: Product): StockLevel {
    if (product.currentStock === 0) return 'CRITICAL';
    if (product.currentStock <= product.minStockLevel) return 'LOW';
    if (product.maxStockLevel && product.currentStock >= product.maxStockLevel) return 'HIGH';
    return 'NORMAL';
  }
  
  /**
   * Obtiene clases CSS según nivel de stock
   * @param {StockLevel} level - Nivel de stock
   * @returns {string} Clases Tailwind
   */
  function getStockLevelClasses(level: StockLevel): string {
    const classes: Record<StockLevel, string> = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      LOW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      NORMAL: 'bg-green-100 text-green-800 border-green-200',
      HIGH: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return classes[level];
  }
  
  /**
   * Obtiene label legible según nivel de stock
   * @param {StockLevel} level - Nivel de stock
   * @returns {string} Label traducido
   */
  function getStockLevelLabel(level: StockLevel): string {
    const labels: Record<StockLevel, string> = {
      CRITICAL: 'Sin stock',
      LOW: 'Stock bajo',
      NORMAL: 'Stock OK',
      HIGH: 'Stock alto',
    };
    return labels[level];
  }
  
  /**
   * Formatea precio en formato moneda venezolana
   * @param {number} amount - Monto en centavos
   * @returns {string} Precio formateado
   */
  function formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(amount / 100);
  }
  
  /**
   * Maneja errores de API de forma uniforme
   * @param {unknown} error - Error capturado
   * @param {keyof ErrorState} context - Contexto del error
   * @returns {string} Mensaje de error formateado
   */
  function handleError(error: unknown, context: keyof ErrorState): string {
    const apiError = error as ApiError;
    const message = apiError?.message || 'Error inesperado. Intente nuevamente.';
    errors.value[context] = message;
    return message;
  }
  
  /**
   * Limpia un error específico
   * @param {keyof ErrorState} context - Contexto a limpiar
   */
  function clearError(context: keyof ErrorState): void {
    errors.value[context] = null;
  }
  
  /**
   * Limpia todos los errores
   */
  function clearAllErrors(): void {
    Object.keys(errors.value).forEach(key => {
      errors.value[key as keyof ErrorState] = null;
    });
  }

  // ==================== OPERACIONES CRUD ====================
  
  /**
   * Carga productos con filtros y paginación
   * @param {ProductFilters} filters - Filtros a aplicar
   * @param {boolean} append - Si true, agrega a la lista existente
   */
  async function loadProducts(
    filters: ProductFilters = {},
    append: boolean = false
  ): Promise<void> {
    loading.value.products = true;
    errors.value.products = null;
    
    try {
      const mergedFilters = { ...store.activeFilters, ...filters };
      const response = await InventoryService.getProducts(mergedFilters);
      
      store.setProducts(response.results, response.count, append);
      
      if (!append) {
        store.productsPagination.total = response.count;
      }
    } catch (error) {
      const message = handleError(error, 'products');
      toast.error(message);
    } finally {
      loading.value.products = false;
    }
  }
  
  /**
   * Carga un producto específico por ID
   * @param {ULID} id - ID del producto
   */
  async function loadProductById(id: ULID): Promise<Product | null> {
    loading.value.product = true;
    errors.value.product = null;
    
    try {
      const product = await InventoryService.getProductById(id);
      store.upsertProduct(product);
      store.selectProduct(product.id);
      return product;
    } catch (error) {
      const message = handleError(error, 'product');
      toast.error(message);
      return null;
    } finally {
      loading.value.product = false;
    }
  }
  
  /**
   * Busca producto por SKU
   * @param {string} sku - SKU a buscar
   */
  async function searchBySku(sku: string): Promise<Product | null> {
    loading.value.product = true;
    
    try {
      const product = await InventoryService.getProductBySku(sku);
      store.upsertProduct(product);
      return product;
    } catch (error) {
      handleError(error, 'product');
      return null;
    } finally {
      loading.value.product = false;
    }
  }
  
  /**
   * Crea un nuevo producto
   * @param {CreateProductDTO} data - Datos del producto
   */
  async function createProduct(data: CreateProductDTO): Promise<Product | null> {
    loading.value.saving = true;
    errors.value.save = null;
    
    try {
      const product = await InventoryService.createProduct(data);
      store.upsertProduct(product);
      toast.success(`Producto "${product.name}" creado exitosamente`);
      return product;
    } catch (error) {
      const message = handleError(error, 'save');
      toast.error(message);
      return null;
    } finally {
      loading.value.saving = false;
    }
  }
  
  /**
   * Actualiza un producto existente
   * @param {ULID} id - ID del producto
   * @param {UpdateProductDTO} data - Datos a actualizar
   */
  async function updateProduct(
    id: ULID,
    data: UpdateProductDTO
  ): Promise<Product | null> {
    loading.value.saving = true;
    errors.value.save = null;
    
    try {
      const product = await InventoryService.updateProduct(id, data);
      store.upsertProduct(product);
      toast.success(`Producto "${product.name}" actualizado`);
      return product;
    } catch (error) {
      const message = handleError(error, 'save');
      toast.error(message);
      return null;
    } finally {
      loading.value.saving = false;
    }
  }
  
  /**
   * Elimina un producto
   * @param {ULID} id - ID del producto
   */
  async function deleteProduct(id: ULID): Promise<boolean> {
    loading.value.deleting = true;
    errors.value.delete = null;
    
    try {
      await InventoryService.deleteProduct(id);
      store.removeProduct(id);
      toast.success('Producto eliminado correctamente');
      return true;
    } catch (error) {
      const message = handleError(error, 'delete');
      toast.error(message);
      return false;
    } finally {
      loading.value.deleting = false;
    }
  }
  
  /**
   * Carga categorías de productos
   */
  async function loadCategories(): Promise<void> {
    loading.value.categories = true;
    errors.value.categories = null;
    
    try {
      const response = await InventoryService.getCategories();
      store.setCategories(response.results);
    } catch (error) {
      const message = handleError(error, 'categories');
      toast.error(message);
    } finally {
      loading.value.categories = false;
    }
  }
  
  /**
   * Selecciona un producto
   * @param {ULID | null} id - ID del producto
   */
  function selectProduct(id: ULID | null): void {
    store.selectProduct(id);
  }
  
  /**
   * Limpia la selección de producto
   */
  function clearSelection(): void {
    store.selectProduct(null);
  }

  // ==================== MOVIMIENTOS DE STOCK ====================
  
  /**
   * Carga movimientos de stock
   * @param {StockMovementFilters} filters - Filtros para movimientos
   */
  async function loadMovements(filters: StockMovementFilters = {}): Promise<void> {
    loading.value.movements = true;
    errors.value.movements = null;
    
    try {
      const response = await InventoryService.getStockMovements(filters);
      store.setMovements(response.results, response.count);
    } catch (error) {
      const message = handleError(error, 'movements');
      toast.error(message);
    } finally {
      loading.value.movements = false;
    }
  }
  
  /**
   * Registra un movimiento de stock
   * @param {CreateStockMovementDTO} data - Datos del movimiento
   */
  async function recordMovement(data: CreateStockMovementDTO): Promise<StockMovement | null> {
    loading.value.adjusting = true;
    errors.value.adjust = null;
    
    try {
      const movement = await InventoryService.createStockMovement(data);
      store.addMovement(movement);
      
      // Actualiza el stock del producto afectado
      await loadProductById(data.productId);
      
      toast.success('Movimiento registrado correctamente');
      return movement;
    } catch (error) {
      const message = handleError(error, 'adjust');
      toast.error(message);
      return null;
    } finally {
      loading.value.adjusting = false;
    }
  }
  
  /**
   * Ajusta el stock de un producto
   * @param {ULID} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad
   * @param {string} reason - Razón del ajuste
   */
  async function adjustStock(
    productId: ULID,
    newQuantity: number,
    reason: string
  ): Promise<StockMovement | null> {
    loading.value.adjusting = true;
    
    try {
      const movement = await InventoryService.adjustStock(productId, newQuantity, reason);
      store.addMovement(movement);
      await loadProductById(productId);
      
      toast.success('Stock ajustado correctamente');
      return movement;
    } catch (error) {
      const message = handleError(error, 'adjust');
      toast.error(message);
      return null;
    } finally {
      loading.value.adjusting = false;
    }
  }

  // ==================== RESUMEN Y DASHBOARD ====================
  
  /**
   * Carga el resumen del inventario
   */
  async function loadSummary(): Promise<void> {
    loading.value.summary = true;
    errors.value.summary = null;
    
    try {
      const data = await InventoryService.getInventorySummary();
      store.setSummary(data);
    } catch (error) {
      const message = handleError(error, 'summary');
      toast.error(message);
    } finally {
      loading.value.summary = false;
    }
  }
  
  /**
   * Actualiza los filtros y recarga productos
   * @param {ProductFilters} filters - Nuevos filtros
   */
  async function applyFilters(filters: ProductFilters): Promise<void> {
    store.setFilters(filters);
    await loadProducts();
  }
  
  /**
   * Limpia filtros y recarga
   */
  async function clearAllFilters(): Promise<void> {
    store.clearFilters();
    await loadProducts();
  }
  
  /**
   * Cambia de página
   * @param {number} page - Número de página
   */
  async function changePage(page: number): Promise<void> {
    store.setProductsPage(page);
    await loadProducts();
  }

  // ==================== RETORNO PÚBLICO ====================
  
  return {
    // State (readonly)
    products,
    categories,
    movements,
    selectedProduct,
    summary,
    activeFilters,
    pagination,
    loading: computed(() => loading.value),
    errors: computed(() => errors.value),
    isLoading,
    hasErrors,
    productsWithStockAlerts,
    
    // Helpers
    getStockLevel,
    getStockLevelClasses,
    getStockLevelLabel,
    formatPrice,
    
    // CRUD Productos
    loadProducts,
    loadProductById,
    searchBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    selectProduct,
    clearSelection,
    
    // Categorías
    loadCategories,
    
    // Movimientos
    loadMovements,
    recordMovement,
    adjustStock,
    
    // Dashboard
    loadSummary,
    
    // Filtros
    applyFilters,
    clearAllFilters,
    changePage,
    clearError,
    clearAllErrors,
  };
}

export default useInventory;
