<template>
  <aside 
    :class="[
      'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40',
      isCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Header / Logo -->
    <div class="h-16 flex items-center justify-center border-b border-gray-100 px-4">
      <div v-if="!isCollapsed" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">E</span>
        </div>
        <span class="font-semibold text-gray-900">Efectivo 360</span>
      </div>
      <div v-else class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">E</span>
      </div>
    </div>

    <!-- Navigation Groups -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div
        v-for="group in visibleGroups"
        :key="group.id"
        class="mb-4"
      >
        <!-- Group Label -->
        <div
          v-if="!isCollapsed && group.items.length > 0"
          class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ group.label }}
        </div>
        <div
          v-else-if="group.items.length > 0"
          class="px-4 py-2"
        >
          <div class="h-px bg-gray-200"></div>
        </div>

        <!-- Group Items -->
        <ul class="space-y-1 px-2">
          <li v-for="item in group.items" :key="item.id">
            <!-- Item with children -->
            <div v-if="item.children && item.children.length > 0">
              <button
                @click="toggleMenu(item.id)"
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.id) || isExpanded(item.id)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100',
                  isCollapsed ? 'justify-center' : ''
                ]"
              >
                <component
                  :is="getIcon(item.icon)"
                  class="w-5 h-5 flex-shrink-0"
                  :class="isActive(item.id) ? 'text-blue-600' : 'text-gray-500'"
                />
                <span v-if="!isCollapsed" class="flex-1 text-left">{{ item.label }}</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="w-4 h-4 text-gray-400 transition-transform"
                  :class="isExpanded(item.id) ? 'rotate-180' : ''"
                />
              </button>

              <!-- Children -->
              <ul
                v-if="isExpanded(item.id) && !isCollapsed"
                class="mt-1 ml-4 space-y-1"
              >
                <li v-for="child in getVisibleChildren(item)" :key="child.id">
                  <router-link
                    :to="child.path"
                    @click="setActiveItem(child.id)"
                    :class="[
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive(child.id)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    ]"
                  >
                    <component
                      :is="getIcon(child.icon)"
                      class="w-4 h-4"
                      :class="isActive(child.id) ? 'text-blue-600' : 'text-gray-400'"
                    />
                    <span>{{ child.label }}</span>
                    <!-- Badges -->
                    <span
                      v-if="child.isNew"
                      class="ml-auto px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                    >
                      Nuevo
                    </span>
                    <span
                      v-if="child.isBeta"
                      class="ml-auto px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
                    >
                      Beta
                    </span>
                  </router-link>
                </li>
              </ul>
            </div>

            <!-- Item without children -->
            <router-link
              v-else
              :to="item.path"
              @click="handleItemClick(item)"
              :class="[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.id)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100',
                isCollapsed ? 'justify-center' : ''
              ]"
            >
              <component
                :is="getIcon(item.icon)"
                class="w-5 h-5 flex-shrink-0"
                :class="isActive(item.id) ? 'text-blue-600' : 'text-gray-500'"
              />
              <span v-if="!isCollapsed">{{ item.label }}</span>
              
              <!-- Badges -->
              <span
                v-if="!isCollapsed && item.isNew"
                class="ml-auto px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded"
              >
                Nuevo
              </span>
              <span
                v-if="!isCollapsed && item.isBeta"
                class="ml-auto px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
              >
                Beta
              </span>
              <span
                v-if="!isCollapsed && item.badge"
                class="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Subscription Badge (if needed) -->
    <div v-if="subscriptionBadge && !isCollapsed" class="px-3 py-2">
      <div 
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          subscriptionBadge.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        ]"
      >
        <AlertCircle class="w-4 h-4" />
        <span class="font-medium">{{ subscriptionBadge.text }}</span>
        <span class="ml-auto text-xs">{{ subscriptionBadge.days }}d</span>
      </div>
    </div>

    <!-- Efi Section (Persistent) -->
    <div class="border-t border-gray-100 p-2">
      <button
        @click="openEfi"
        :class="[
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
          isCollapsed ? 'justify-center' : '',
          'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
        ]"
      >
        <Bot class="w-5 h-5" />
        <span v-if="!isCollapsed" class="font-medium text-sm">Preguntar a Efi</span>
        <Sparkles v-if="!isCollapsed" class="w-4 h-4 ml-auto" />
      </button>
    </div>

    <!-- Footer - Collapse Toggle -->
    <div class="border-t border-gray-100 p-2">
      <button
        @click="toggleCollapse"
        class="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        :title="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <PanelLeftClose v-if="!isCollapsed" class="w-5 h-5" />
        <PanelRightClose v-else class="w-5 h-5" />
      </button>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-30 lg:hidden"
    @click="closeMobile"
  ></div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Sidebar inteligente de Efectivo 360
 * @module @shared/components/TheSidebar
 * 
 * Menú data-driven con filtros por:
 * - Rol del usuario
 * - Plan de suscripción (módulos activos)
 * - Rubro del comercio
 * 
 * Incluye acceso directo persistente a Efi.
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  CreditCard,
  BarChart3,
  Package,
  FolderTree,
  Palette,
  FileJson,
  GitBranch,
  Tags,
  Warehouse,
  Ruler,
  Settings,
  UserCog,
  Store,
  Plug,
  Building2,
  Repeat,
  DollarSign,
  LineChart,
  Bot,
  Sparkles,
  ChevronDown,
  PanelLeftClose,
  PanelRightClose,
  Lock,
  AlertCircle,
  type LucideIcon,
} from 'lucide-vue-next';
import { useSmartNavigation, type MenuGroup } from '../composables/useSmartNavigation';
import { useAssistantStore } from '@modules/assistant';
import { useSubscriptionsStore } from '@modules/subscriptions';
import type { NavigationItem } from '../config/navigationConfig';

// =============================================================================
// PROPS
// =============================================================================

interface Props {
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// =============================================================================
// ROUTE & STORES
// =============================================================================

const route = useRoute();
const assistantStore = useAssistantStore();
const subscriptionsStore = useSubscriptionsStore();

const {
  groupedItems,
  availableGroups,
  groupConfigs,
  isExpanded,
  toggleMenu,
  isActive,
  setActiveItem,
  getVisibleChildren,
  findItemByPath,
} = useSmartNavigation();

// =============================================================================
// SUBSCRIPTION BADGE
// =============================================================================

const subscriptionBadge = computed(() => {
  const summary = subscriptionsStore.subscriptionSummary;
  if (!summary) return null;
  
  if (summary.isInGracePeriod) {
    return { type: 'error', text: 'Vencido', days: summary.gracePeriodDays };
  }
  if (summary.daysRemaining <= 7) {
    return { type: 'warning', text: 'Próximo', days: summary.daysRemaining };
  }
  return null;
});

// =============================================================================
// STATE
// =============================================================================

const isCollapsed = ref(false);
const isMobileOpen = ref(false);

// =============================================================================
// COMPUTED
// =============================================================================

/**
 * Grupos visibles con sus items
 */
const visibleGroups = computed(() => {
  return availableGroups.value.map(groupId => {
    const config = groupConfigs.find(g => g.id === groupId)!;
    return {
      id: groupId,
      label: config.label,
      icon: config.icon,
      items: groupedItems.value[groupId] || [],
    };
  }).filter(g => g.items.length > 0);
});

// =============================================================================
// METHODS
// =============================================================================

/**
 * Mapear nombre de icono a componente Lucide
 */
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  CreditCard,
  BarChart3,
  Package,
  FolderTree,
  Palette,
  FileJson,
  GitBranch,
  Tags,
  Warehouse,
  Ruler,
  Settings,
  UserCog,
  Store,
  Plug,
  Building2,
  Repeat,
  DollarSign,
  LineChart,
  Bot,
  Sparkles,
  ChevronDown,
  PanelLeftClose,
  PanelRightClose,
  Lock,
  AlertCircle,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] || LayoutDashboard;
}

/**
 * Manejar click en item
 */
function handleItemClick(item: NavigationItem): void {
  setActiveItem(item.id);
  
  // Si es Efi, abrir chat
  if (item.id === 'efi') {
    openEfi();
  }
  
  // Cerrar menú móvil
  closeMobile();
}

/**
 * Abrir Efi
 */
function openEfi(): void {
  // Enviar contexto actual al asistente
  const currentModule = getCurrentModuleFromPath();
  assistantStore.setContext({
    module: currentModule,
    action: 'sidebar_access',
    data: { source: 'sidebar_button' },
    timestamp: new Date().toISOString(),
  });
  
  // Abrir ventana de chat
  assistantStore.openChat();
  
  // Cerrar menú móvil
  closeMobile();
}

/**
 * Determinar módulo actual desde la ruta
 */
function getCurrentModuleFromPath(): any {
  const path = route.path;
  if (path.includes('inventory') || path.includes('products')) return 'inventory';
  if (path.includes('payments')) return 'payments';
  if (path.includes('sales')) return 'sales';
  if (path.includes('customers')) return 'customers';
  if (path.includes('reports')) return 'reports';
  return 'dashboard';
}

/**
 * Toggle colapso
 */
function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebar_collapsed', String(isCollapsed.value));
}

/**
 * Cerrar menú móvil
 */
function closeMobile(): void {
  isMobileOpen.value = false;
  emit('update:modelValue', false);
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  // Restaurar estado de colapso
  const saved = localStorage.getItem('sidebar_collapsed');
  if (saved) {
    isCollapsed.value = saved === 'true';
  }
  
  // Establecer item activo según ruta actual
  const currentItem = findItemByPath(route.path);
  if (currentItem) {
    setActiveItem(currentItem.id);
    // Expandir padre si es hijo
    if (currentItem.parentId) {
      toggleMenu(currentItem.parentId);
    }
  }
});

// Watch para menú móvil
watch(() => props.modelValue, (val) => {
  isMobileOpen.value = val;
});

// Watch para cambios de ruta
watch(() => route.path, (path) => {
  const item = findItemByPath(path);
  if (item) {
    setActiveItem(item.id);
  }
});
</script>

<style scoped>
/* Scrollbar styling */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

/* Active link indicator */
.router-link-active {
  position: relative;
}

.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #2563eb;
  border-radius: 0 2px 2px 0;
}
</style>
