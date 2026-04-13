/**
 * @fileoverview Store de Pinia para Master Data (Jerarquía con Blueprints)
 * @module @modules/master-data/stores/masterDataStore
 * 
 * Estado reactivo de categorías jerárquicas, blueprints y atributos dinámicos.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import type {
  Blueprint,
  Category,
  CategoryTree,
  CategoryDetail,
  CategoryFormData,
  BlueprintFormData,
  DynamicEntity,
  DynamicEntityFilters,
  TreeNode,
} from '../types';
import * as masterDataService from '../services/masterData.service';

export const useMasterDataStore = defineStore('masterData', () => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  // Blueprints
  const blueprints = ref<Blueprint[]>([]);
  const currentBlueprint = ref<Blueprint | null>(null);

  // Categorías - Árbol
  const categoryTree = ref<CategoryTree[]>([]);
  const flatCategories = ref<Category[]>([]);
  const currentCategory = ref<CategoryDetail | null>(null);
  
  // Entidades dinámicas
  const dynamicEntities = ref<DynamicEntity[]>([]);
  const currentEntity = ref<DynamicEntity | null>(null);
  
  // UI State
  const isLoading = ref(false);
  const isLoadingTree = ref(false);
  const isProcessing = ref(false);
  const expandedNodes = ref<Set<string>>(new Set());

  // Filtros
  const categoryFilters = ref({});
  const entityFilters = ref<DynamicEntityFilters>({});

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  const rootCategories = computed(() => 
    categoryTree.value.filter(node => node.category.level === 0)
  );

  const getBlueprintById = computed(() => (id: string) => 
    blueprints.value.find(b => b.id === id) || null
  );

  const getCategoryById = computed(() => (id: string) => 
    flatCategories.value.find(c => c.id === id) || null
  );

  const getCategoryByCode = computed(() => (code: string) => 
    flatCategories.value.find(c => c.code === code) || null
  );

  /**
   * Categorías para select dropdown (flat list con indentación)
   */
  const categoriesForSelect = computed(() => {
    const result: Array<{ id: string; name: string; level: number; disabled: boolean }> = [];
    
    function traverse(nodes: CategoryTree[], level: number = 0) {
      nodes.forEach(node => {
        result.push({
          id: node.category.id,
          name: node.category.name,
          level,
          disabled: false,
        });
        if (node.children && expandedNodes.value.has(node.category.id)) {
          traverse(node.children, level + 1);
        }
      });
    }
    
    traverse(categoryTree.value);
    return result;
  });

  /**
   * Convertir árbol a nodos para componente UI
   */
  const treeNodes = computed((): TreeNode[] => {
    function mapNodes(nodes: CategoryTree[]): TreeNode[] {
      return nodes.map(node => ({
        id: node.category.id,
        label: node.category.name,
        icon: node.category.icon,
        color: node.category.color,
        children: node.children && node.children.length > 0 
          ? mapNodes(node.children) 
          : undefined,
        isExpanded: expandedNodes.value.has(node.category.id),
        isLoading: node.isLoading,
        hasChildren: node.category.hasChildren,
        data: node.category,
      }));
    }
    
    return mapNodes(categoryTree.value);
  });

  // ==========================================================================
  // ACTIONS - BLUEPRINTS
  // ==========================================================================

  /**
   * Cargar todos los blueprints
   */
  async function loadBlueprints(): Promise<void> {
    isLoading.value = true;

    try {
      blueprints.value = await masterDataService.fetchBlueprints();
    } catch {
      toast.error('Error cargando blueprints');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Cargar blueprint específico
   */
  async function loadBlueprintById(id: string): Promise<boolean> {
    try {
      const blueprint = await masterDataService.fetchBlueprintById(id);
      if (blueprint) {
        currentBlueprint.value = blueprint;
        return true;
      }
    } catch {
      console.error('Error cargando blueprint');
    }
    return false;
  }

  /**
   * Crear blueprint
   */
  async function createBlueprint(data: BlueprintFormData): Promise<Blueprint | null> {
    isProcessing.value = true;

    try {
      const blueprint = await masterDataService.createBlueprint(data);
      if (blueprint) {
        blueprints.value.push(blueprint);
        toast.success('Blueprint creado');
        return blueprint;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creando blueprint');
    } finally {
      isProcessing.value = false;
    }
    return null;
  }

  /**
   * Actualizar blueprint
   */
  async function updateBlueprint(
    id: string,
    data: Partial<BlueprintFormData>
  ): Promise<boolean> {
    isProcessing.value = true;

    try {
      const updated = await masterDataService.updateBlueprint(id, data);
      if (updated) {
        const index = blueprints.value.findIndex(b => b.id === id);
        if (index !== -1) {
          blueprints.value[index] = updated;
        }
        if (currentBlueprint.value?.id === id) {
          currentBlueprint.value = updated;
        }
        toast.success('Blueprint actualizado');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error actualizando blueprint');
    } finally {
      isProcessing.value = false;
    }
    return false;
  }

  // ==========================================================================
  // ACTIONS - CATEGORIES
  // ==========================================================================

  /**
   * Cargar árbol de categorías
   */
  async function loadCategoryTree(filters?: Record<string, unknown>): Promise<void> {
    isLoadingTree.value = true;

    try {
      const response = await masterDataService.fetchCategoryTree(filters);
      categoryTree.value = response.tree;
      
      // Flatten para búsquedas rápidas
      flatCategories.value = flattenTree(response.tree);
    } catch {
      toast.error('Error cargando categorías');
    } finally {
      isLoadingTree.value = false;
    }
  }

  /**
   * Función helper para aplanar árbol
   */
  function flattenTree(nodes: CategoryTree[]): Category[] {
    const result: Category[] = [];
    
    function traverse(nodes: CategoryTree[]) {
      nodes.forEach(node => {
        result.push(node.category);
        if (node.children) {
          traverse(node.children);
        }
      });
    }
    
    traverse(nodes);
    return result;
  }

  /**
   * Cargar categoría con detalle
   */
  async function loadCategoryDetail(id: string): Promise<boolean> {
    try {
      const detail = await masterDataService.fetchCategoryById(id);
      if (detail) {
        currentCategory.value = detail;
        return true;
      }
    } catch {
      toast.error('Error cargando categoría');
    }
    return false;
  }

  /**
   * Crear categoría
   */
  async function createCategory(data: CategoryFormData): Promise<Category | null> {
    isProcessing.value = true;

    try {
      const category = await masterDataService.createCategory(data);
      if (category) {
        // Recargar árbol para reflejar cambios
        await loadCategoryTree(categoryFilters.value);
        toast.success('Categoría creada');
        return category;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creando categoría');
    } finally {
      isProcessing.value = false;
    }
    return null;
  }

  /**
   * Actualizar categoría
   */
  async function updateCategory(
    id: string,
    data: Partial<CategoryFormData>
  ): Promise<boolean> {
    isProcessing.value = true;

    try {
      const updated = await masterDataService.updateCategory(id, data);
      if (updated) {
        // Actualizar en flat list
        const index = flatCategories.value.findIndex(c => c.id === id);
        if (index !== -1) {
          flatCategories.value[index] = { ...flatCategories.value[index], ...updated };
        }
        
        // Recargar árbol si cambió el padre o el orden
        if (data.parentId !== undefined || data.sortOrder !== undefined) {
          await loadCategoryTree(categoryFilters.value);
        }
        
        // Actualizar current si es la misma
        if (currentCategory.value?.id === id) {
          currentCategory.value = { ...currentCategory.value, ...updated };
        }
        
        toast.success('Categoría actualizada');
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error actualizando categoría');
    } finally {
      isProcessing.value = false;
    }
    return false;
  }

  /**
   * Eliminar categoría
   */
  async function deleteCategory(id: string): Promise<boolean> {
    try {
      const success = await masterDataService.deleteCategory(id);
      if (success) {
        // Recargar árbol
        await loadCategoryTree(categoryFilters.value);
        toast.success('Categoría eliminada');
      }
      return success;
    } catch {
      toast.error('Error eliminando categoría');
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - TREE OPERATIONS
  // ==========================================================================

  /**
   * Expandir/colapsar nodo
   */
  async function toggleNodeExpansion(categoryId: string): Promise<void> {
    if (expandedNodes.value.has(categoryId)) {
      expandedNodes.value.delete(categoryId);
    } else {
      expandedNodes.value.add(categoryId);
      
      // Cargar hijos si no están cargados
      const node = findNodeInTree(categoryTree.value, categoryId);
      if (node && !node.children && node.category.hasChildren) {
        node.isLoading = true;
        try {
          const children = await masterDataService.expandCategory(categoryId);
          node.children = children.map(c => ({
            category: c,
            children: [],
            level: c.level,
            isExpanded: false,
            isLoading: false,
          }));
          node.isLoading = false;
        } catch {
          node.isLoading = false;
        }
      }
    }
  }

  /**
   * Buscar nodo en árbol
   */
  function findNodeInTree(nodes: CategoryTree[], id: string): CategoryTree | null {
    for (const node of nodes) {
      if (node.category.id === id) return node;
      if (node.children) {
        const found = findNodeInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Mover categoría (cambiar padre)
   */
  async function moveCategory(
    categoryId: string,
    newParentId: string | null
  ): Promise<boolean> {
    isProcessing.value = true;

    try {
      const result = await masterDataService.moveCategory(categoryId, newParentId);
      if (result.success) {
        await loadCategoryTree(categoryFilters.value);
        toast.success('Categoría movida');
        return true;
      }
    } catch {
      toast.error('Error moviendo categoría');
    } finally {
      isProcessing.value = false;
    }
    return false;
  }

  /**
   * Reordenar categorías
   */
  async function reorderCategories(categoryIds: string[]): Promise<boolean> {
    try {
      const success = await masterDataService.reorderCategories(categoryIds);
      if (success) {
        await loadCategoryTree(categoryFilters.value);
      }
      return success;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // ACTIONS - DYNAMIC ENTITIES
  // ==========================================================================

  /**
   * Buscar entidades con atributos dinámicos
   */
  async function searchDynamicEntities(
    filters: DynamicEntityFilters,
    page: number = 1
  ): Promise<void> {
    isLoading.value = true;

    try {
      const response = await masterDataService.searchDynamicEntities(filters, page);
      dynamicEntities.value = response.results;
    } catch {
      toast.error('Error buscando entidades');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Guardar atributos dinámicos
   */
  async function saveDynamicAttributes(
    entityType: string,
    entityId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const success = await masterDataService.saveDynamicAttributes(
        entityType,
        entityId,
        values
      );
      if (success) {
        toast.success('Atributos guardados');
      }
      return success;
    } catch {
      toast.error('Error guardando atributos');
      return false;
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    blueprints,
    currentBlueprint,
    categoryTree,
    flatCategories,
    currentCategory,
    dynamicEntities,
    currentEntity,
    isLoading,
    isLoadingTree,
    isProcessing,
    expandedNodes,
    categoryFilters,
    entityFilters,
    
    // Getters
    rootCategories,
    getBlueprintById,
    getCategoryById,
    getCategoryByCode,
    categoriesForSelect,
    treeNodes,
    
    // Blueprints
    loadBlueprints,
    loadBlueprintById,
    createBlueprint,
    updateBlueprint,
    
    // Categories
    loadCategoryTree,
    loadCategoryDetail,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Tree
    toggleNodeExpansion,
    moveCategory,
    reorderCategories,
    
    // Dynamic Entities
    searchDynamicEntities,
    saveDynamicAttributes,
  };
});
