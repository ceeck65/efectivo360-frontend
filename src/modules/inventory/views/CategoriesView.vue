<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorías</h1>
        <p class="mt-1 text-sm text-gray-500">
          Gestión de categorías de productos
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12">
      <LoadingSpinner size="lg" color="primary" />
    </div>

    <!-- Error -->
    <ErrorMessage
      v-else-if="errors.categories"
      :message="errors.categories"
      variant="error"
      :on-retry="loadCategories"
    />

    <!-- Categories Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center"
            :style="{ backgroundColor: category.color + '20' }"
          >
            <component
              :is="getIconComponent(category.icon)"
              class="w-6 h-6"
              :style="{ color: category.color }"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">
              {{ category.name }}
            </h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">
              {{ category.description }}
            </p>
            <div class="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <span 
                class="px-2 py-1 rounded-full"
                :style="{ backgroundColor: category.color + '15', color: category.color }"
              >
                {{ category.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="categories.length === 0"
        class="col-span-full py-12 text-center"
      >
        <Inbox class="w-12 h-12 text-gray-300 mx-auto" />
        <p class="mt-4 text-gray-500">No hay categorías registradas</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Categorías de Productos
 * @module @modules/inventory/views/CategoriesView
 */
import { onMounted } from 'vue';
import { Inbox, Tag, Package, Box, Sparkles } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';

const { categories, isLoading, errors, loadCategories } = useInventory();

const iconMap: Record<string, unknown> = {
  tag: Tag,
  package: Package,
  box: Box,
  sparkles: Sparkles,
};

function getIconComponent(iconName?: string): unknown {
  return iconMap[iconName || ''] || Tag;
}

onMounted(() => {
  loadCategories();
});
</script>
