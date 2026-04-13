/**
 * @fileoverview Composable principal del módulo Master Data
 * @module @modules/master-data/composables/useMasterData
 * 
 * Lógica de gestión de categorías jerárquicas y blueprints.
 * Manejo de atributos dinámicos según la categoría.
 */

import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMasterDataStore } from '../stores/masterDataStore';
import type {
  Category,
  CategoryFormData,
  Blueprint,
  BlueprintAttribute,
  DynamicEntityFilters,
} from '../types';

// =============================================================================
// MAIN COMPOSABLE
// =============================================================================

export function useMasterData() {
  const store = useMasterDataStore();
  const {
    blueprints,
    categoryTree,
    flatCategories,
    currentCategory,
    currentBlueprint,
    isLoading,
    isLoadingTree,
    isProcessing,
    expandedNodes,
    treeNodes,
  } = storeToRefs(store);

  // Local state
  const selectedCategoryId = ref<string | null>(null);
  const searchQuery = ref('');

  // Getters
  const selectedCategory = computed(() => 
    selectedCategoryId.value 
      ? store.getCategoryById(selectedCategoryId.value)
      : null
  );

  const selectedBlueprint = computed(() => 
    selectedCategory.value?.blueprintId 
      ? store.getBlueprintById(selectedCategory.value.blueprintId)
      : null
  );

  /**
   * Atributos del blueprint actual con valores por defecto
   */
  const currentAttributes = computed((): BlueprintAttribute[] => {
    if (!selectedBlueprint.value) return [];
    return selectedBlueprint.value.attributes.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  /**
   * Categorías filtradas por búsqueda
   */
  const filteredCategories = computed(() => {
    if (!searchQuery.value.trim()) return flatCategories.value;
    
    const query = searchQuery.value.toLowerCase();
    return flatCategories.value.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  });

  /**
   * Camino/breadcrumb de la categoría seleccionada
   */
  const categoryPath = computed(() => {
    if (!selectedCategory.value) return [];
    
    const path: Category[] = [];
    let current = selectedCategory.value;
    
    while (current?.parentId) {
      const parent = store.getCategoryById(current.parentId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return path;
  });

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Inicializar módulo
   */
  async function initialize(): Promise<void> {
    await Promise.all([
      store.loadBlueprints(),
      store.loadCategoryTree(),
    ]);
  }

  // =============================================================================
  // CATEGORY MANAGEMENT
  // =============================================================================

  /**
   * Seleccionar categoría
   */
  async function selectCategory(id: string | null): Promise<void> {
    selectedCategoryId.value = id;
    
    if (id) {
      await store.loadCategoryDetail(id);
    }
  }

  /**
   * Crear nueva categoría
   */
  async function createCategory(data: CategoryFormData): Promise<boolean> {
    const category = await store.createCategory(data);
    if (category) {
      selectedCategoryId.value = category.id;
      return true;
    }
    return false;
  }

  /**
   * Actualizar categoría actual
   */
  async function updateCategory(data: Partial<CategoryFormData>): Promise<boolean> {
    if (!selectedCategoryId.value) return false;
    return await store.updateCategory(selectedCategoryId.value, data);
  }

  /**
   * Eliminar categoría actual
   */
  async function deleteCategory(): Promise<boolean> {
    if (!selectedCategoryId.value) return false;
    
    const confirmed = confirm('¿Eliminar esta categoría?');
    if (!confirmed) return false;
    
    const success = await store.deleteCategory(selectedCategoryId.value);
    if (success) {
      selectedCategoryId.value = null;
    }
    return success;
  }

  // =============================================================================
  // TREE OPERATIONS
  // =============================================================================

  /**
   * Expandir/colapsar nodo
   */
  async function toggleExpand(categoryId: string): Promise<void> {
    await store.toggleNodeExpansion(categoryId);
  }

  /**
   * Expandir todos los nodos
   */
  function expandAll(): void {
    flatCategories.value.forEach(c => {
      if (c.hasChildren) {
        expandedNodes.value.add(c.id);
      }
    });
  }

  /**
   * Colapsar todos los nodos
   */
  function collapseAll(): void {
    expandedNodes.value.clear();
  }

  /**
   * Mover categoría (cambiar padre)
   */
  async function moveCategory(newParentId: string | null): Promise<boolean> {
    if (!selectedCategoryId.value) return false;
    return await store.moveCategory(selectedCategoryId.value, newParentId);
  }

  /**
   * Mover categoría arriba en el orden
   */
  async function moveUp(): Promise<boolean> {
    if (!selectedCategory.value) return false;
    
    const siblings = flatCategories.value.filter(
      c => c.parentId === selectedCategory.value?.parentId
    );
    
    const currentIndex = siblings.findIndex(c => c.id === selectedCategoryId.value);
    if (currentIndex <= 0) return false;
    
    const newOrder = siblings.map(c => c.id);
    // Swap con el anterior
    [newOrder[currentIndex], newOrder[currentIndex - 1]] = 
    [newOrder[currentIndex - 1], newOrder[currentIndex]];
    
    return await store.reorderCategories(newOrder);
  }

  /**
   * Mover categoría abajo en el orden
   */
  async function moveDown(): Promise<boolean> {
    if (!selectedCategory.value) return false;
    
    const siblings = flatCategories.value.filter(
      c => c.parentId === selectedCategory.value?.parentId
    );
    
    const currentIndex = siblings.findIndex(c => c.id === selectedCategoryId.value);
    if (currentIndex < 0 || currentIndex >= siblings.length - 1) return false;
    
    const newOrder = siblings.map(c => c.id);
    // Swap con el siguiente
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
    [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    return await store.reorderCategories(newOrder);
  }

  // =============================================================================
  // BLUEPRINT OPERATIONS
  // =============================================================================

  /**
   * Seleccionar blueprint
   */
  function selectBlueprint(id: string | null): void {
    if (id) {
      store.loadBlueprintById(id);
    }
  }

  /**
   * Guardar blueprint
   */
  async function saveBlueprint(blueprint: Partial<Blueprint>): Promise<boolean> {
    if (blueprint.id) {
      return await store.updateBlueprint(blueprint.id, blueprint);
    }
    return false;
  }

  // =============================================================================
  // DYNAMIC ATTRIBUTES
  // =============================================================================

  /**
   * Obtener valores por defecto para atributos dinámicos
   */
  function getDefaultAttributeValues(): Record<string, unknown> {
    if (!selectedBlueprint.value) return {};
    
    const defaults: Record<string, unknown> = {};
    
    selectedBlueprint.value.attributes.forEach(attr => {
      if (attr.config.defaultValue !== undefined) {
        defaults[attr.code] = attr.config.defaultValue;
      }
    });
    
    return defaults;
  }

  /**
   * Validar valores contra blueprint
   */
  async function validateValues(values: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    if (!selectedBlueprint.value) return { valid: true, errors: [] };
    
    const errors: string[] = [];
    
    for (const attr of selectedBlueprint.value.attributes) {
      const value = values[attr.code];
      
      if (attr.isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`${attr.name} es requerido`);
        continue;
      }
      
      // Validaciones de tipo
      if (value !== undefined && value !== null) {
        if (attr.type === 'number' || attr.type === 'money' || attr.type === 'percentage') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${attr.name} debe ser un número válido`);
          } else if (attr.config.min !== undefined && num < attr.config.min) {
            errors.push(`${attr.name} debe ser mayor o igual a ${attr.config.min}`);
          } else if (attr.config.max !== undefined && num > attr.config.max) {
            errors.push(`${attr.name} debe ser menor o igual a ${attr.config.max}`);
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // =============================================================================
  // SEARCH & FILTER
  // =============================================================================

  /**
   * Buscar categorías
   */
  function searchCategories(query: string): void {
    searchQuery.value = query;
  }

  /**
   * Limpiar búsqueda
   */
  function clearSearch(): void {
    searchQuery.value = '';
  }

  // =============================================================================
  // DYNAMIC ENTITIES
  // =============================================================================

  /**
   * Buscar entidades en la categoría actual
   */
  async function searchEntities(filters?: DynamicEntityFilters): Promise<void> {
    if (!selectedCategory.value) return;
    
    await store.searchDynamicEntities({
      categoryId: selectedCategory.value.id,
      ...filters,
    });
  }

  /**
   * Guardar atributos dinámicos para una entidad
   */
  async function saveEntityAttributes(
    entityType: string,
    entityId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    return await store.saveDynamicAttributes(entityType, entityId, values);
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    blueprints,
    categoryTree,
    flatCategories,
    currentCategory,
    currentBlueprint,
    isLoading,
    isLoadingTree,
    isProcessing,
    expandedNodes,
    treeNodes,
    selectedCategoryId,
    searchQuery,
    
    // Getters
    selectedCategory,
    selectedBlueprint,
    currentAttributes,
    filteredCategories,
    categoryPath,
    
    // Init
    initialize,
    
    // Category
    selectCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Tree
    toggleExpand,
    expandAll,
    collapseAll,
    moveCategory,
    moveUp,
    moveDown,
    
    // Blueprint
    selectBlueprint,
    saveBlueprint,
    getBlueprintById: store.getBlueprintById,
    
    // Attributes
    getDefaultAttributeValues,
    validateValues,
    
    // Search
    searchCategories,
    clearSearch,
    
    // Entities
    searchEntities,
    saveEntityAttributes,
  };
}

// =============================================================================
// UTILITY COMPOSABLES
// =============================================================================

/**
 * Composable simplificado para selector de categoría
 */
export function useCategorySelector() {
  const store = useMasterDataStore();
  const { treeNodes, categoriesForSelect, isLoadingTree } = storeToRefs(store);
  
  const selectedId = ref<string | null>(null);
  
  // Auto-cargar al iniciar
  if (treeNodes.value.length === 0) {
    store.loadCategoryTree();
  }
  
  return {
    // State
    nodes: treeNodes,
    options: categoriesForSelect,
    isLoading: isLoadingTree,
    selectedId,
    
    // Actions
    select: (id: string) => { selectedId.value = id; },
    clear: () => { selectedId.value = null; },
    expand: store.toggleNodeExpansion,
    refresh: store.loadCategoryTree,
    
    // Getters
    selected: computed(() => 
      selectedId.value ? store.getCategoryById(selectedId.value) : null
    ),
  };
}

/**
 * Composable para manejo de atributos dinámicos
 */
export function useDynamicAttributes(blueprintId?: string) {
  const store = useMasterDataStore();
  const { isLoading } = storeToRefs(store);
  
  const values = ref<Record<string, unknown>>({});
  const errors = ref<Record<string, string>>({});
  
  const blueprint = computed(() => {
    if (blueprintId) {
      return store.getBlueprintById(blueprintId);
    }
    return null;
  });
  
  const attributes = computed(() => {
    return blueprint.value?.attributes || [];
  });
  
  /**
   * Establecer valor de atributo
   */
  function setValue(code: string, value: unknown): void {
    values.value[code] = value;
    // Limpiar error al cambiar valor
    if (errors.value[code]) {
      delete errors.value[code];
    }
  }
  
  /**
   * Validar todos los valores
   */
  async function validate(): Promise<boolean> {
    if (!blueprint.value) return true;
    
    errors.value = {};
    let isValid = true;
    
    for (const attr of attributes.value) {
      const value = values.value[attr.code];
      
      if (attr.isRequired && !value) {
        errors.value[attr.code] = 'Este campo es requerido';
        isValid = false;
      }
    }
    
    return isValid;
  }
  
  /**
   * Resetear valores
   */
  function reset(): void {
    values.value = {};
    errors.value = {};
  }
  
  return {
    values,
    errors,
    attributes,
    isLoading,
    setValue,
    validate,
    reset,
    getValues: () => ({ ...values.value }),
  };
}
