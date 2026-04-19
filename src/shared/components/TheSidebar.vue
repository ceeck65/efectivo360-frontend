<template>
  <div>
    <!-- Mobile Overlay -->
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
      @click="closeMobile"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'flex h-screen flex-col px-3 py-5 transition-all duration-300 flex-shrink-0',
        'border-r border-white/[0.07] bg-brand-dark backdrop-blur-md shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)]',
        isCollapsed ? 'w-14' : 'w-64'
      ]"
    >
      <!-- Logo Section (Fixed) -->
      <div class="px-2 flex-shrink-0">
        <div class="mb-3 flex items-center justify-center">
          <img
            src="/assets/logo.svg"
            alt="ERP Efectivo 360"
            :class="['transition-all duration-300', isCollapsed ? 'h-12 w-12' : 'h-10 w-10']"
          />
        </div>
        <div v-if="!isCollapsed" class="text-center">
          <p class="text-sm font-semibold text-white/55">
            ERP Efectivo 360
          </p>
          <h1 class="text-xl font-semibold text-white">
            ERP Efectivo 360
          </h1>
        </div>
      </div>

      <!-- Navigation (Scrollable) -->
      <nav class="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
        <template v-if="isLoading">
          <div class="px-3 py-4 text-center text-white/40 text-sm">
            Cargando menú...
          </div>
        </template>
        <template v-else-if="error">
          <div class="px-3 py-4 text-center text-red-400 text-sm">
            Error al cargar menú: {{ error }}
          </div>
        </template>
        <template v-else-if="ungroupedItems.length === 0 && visibleGroups.length === 0">
          <div class="px-3 py-4 text-center text-white/40 text-sm">
            No hay elementos de menú disponibles
          </div>
        </template>
        <template v-else>
          <!-- Ungrouped items (shown first, no toggle) -->
          <template v-if="!isCollapsed && ungroupedItems.length > 0">
            <div class="space-y-1">
              <template v-for="item in ungroupedItems" :key="item.id">
                <button
                  @click="navigateTo(item.path, item.id)"
                  :class="[
                    'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition w-full text-left',
                    isItemActive(item.path)
                      ? 'border border-brand-primary/50 bg-brand-primary/20 text-brand-primary shadow-[0_0_20px_rgba(0,123,255,0.2)]'
                      : 'border border-transparent text-slate-300 hover:border-white/15 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(0,0,0,0.15)]'
                  ]"
                >
                  <component
                    :is="getIcon(item.icon)"
                    class="h-[18px] w-[18px] shrink-0 stroke-[1.5]"
                  />
                  <span>{{ item.label }}</span>
                </button>
              </template>
            </div>
          </template>

          <!-- Grouped items (with toggle) -->
          <template v-for="group in (isCollapsed ? [{ id: 'flat', label: '', icon: '', items: visibleGroups.flatMap(g => g.items) }] : visibleGroups)" :key="group.id">
            <div class="space-y-1">
              <!-- Group Header -->
              <button
                v-if="!isCollapsed && group.label"
                type="button"
                class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] uppercase tracking-wide text-white/60 hover:bg-white/5"
                @click="toggleMenu(group.id)"
              >
                <div class="flex items-center gap-2">
                  <component
                    v-if="group.icon"
                    :is="getIcon(group.icon)"
                    class="h-3.5 w-3.5"
                  />
                  <span>{{ group.label }}</span>
                </div>
                <ChevronDown v-if="isExpanded(group.id)" class="h-3.5 w-3.5" />
                <ChevronRight v-else class="h-3.5 w-3.5" />
              </button>

              <!-- Group Items -->
              <template v-if="isCollapsed || isExpanded(group.id)">
                <template v-for="item in group.items" :key="item.id">
                  <button
                    @click="navigateTo(item.path, item.id)"
                    :class="[
                      'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition w-full text-left',
                      isCollapsed ? 'justify-center' : '',
                      isItemActive(item.path)
                        ? 'border border-brand-primary/50 bg-brand-primary/20 text-brand-primary shadow-[0_0_20px_rgba(0,123,255,0.2)]'
                        : 'border border-transparent text-slate-300 hover:border-white/15 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(0,0,0,0.15)]'
                    ]"
                  >
                    <component
                      :is="getIcon(item.icon)"
                      class="h-[18px] w-[18px] shrink-0 stroke-[1.5]"
                    />
                    <span :class="[isCollapsed ? 'hidden' : 'block']">
                      {{ item.label }}
                    </span>
                  </button>
                </template>
              </template>
            </div>
          </template>
        </template>
      </nav>

      <!-- Footer -->
      <div class="space-y-2 p-3 text-xs rounded-bento border border-white/[0.08] bg-black/25 text-white/50 backdrop-blur-sm" :class="isCollapsed ? 'hidden' : 'block'">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Online</span>
        </div>
        <p class="mt-1">Sistema ERP Efectivo 360</p>
      </div>

      <!-- Collapse Toggle (Desktop) -->
      <button
        type="button"
        class="mt-4 hidden w-full items-center justify-center p-2 lg:flex rounded-xl border border-white/12 text-white/70 hover:border-sky-400/25 hover:bg-white/[0.06]"
        @click="toggleCollapse"
        :title="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <ChevronRight v-if="isCollapsed" class="h-4 w-4 stroke-[1.5]" />
        <ChevronLeft v-else class="h-4 w-4 stroke-[1.5]" />
        <span class="ml-2 text-xs" :class="isCollapsed ? 'hidden' : 'block'">
          {{ isCollapsed ? 'Expandir' : 'Colapsar' }}
        </span>
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  CreditCard,
  BarChart3,
  Package,
  Database,
  Tags,
  Receipt,
  Briefcase,
  Plug,
  Bot,
  Globe,
  Map as MapIcon,
  Coins,
  Flag,
  Wallet,
  DollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Boxes,
  Gauge,
  Ruler,
  ShieldCheck,
  Shield,
  Landmark,
  Waypoints,
  CheckCircle2,
  LineChart,
  MoreHorizontal,
} from 'lucide-vue-next';
import { useNavigationStore, type MenuItem } from '@/stores/navigation';

// Icon mapping from Lucide
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  CreditCard,
  BarChart3,
  Package,
  Database,
  Tags,
  Receipt,
  Briefcase,
  Plug,
  Bot,
  Globe,
  Map: MapIcon,
  Coins,
  Flag,
  Wallet,
  DollarSign,
  Monitor,
  Boxes,
  Gauge,
  Ruler,
  ShieldCheck,
  Shield,
  Landmark,
  Waypoints,
  CheckCircle2,
  LineChart,
  MoreHorizontal,
};

// Props
interface Props {
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Route
const route = useRoute();
const router = useRouter();
const navigationStore = useNavigationStore();

// State
const isCollapsed = ref(false);
const isMobileOpen = computed(() => props.modelValue);
const activeItemId = ref<string | null>('');
const expandedItems = ref<Set<string>>(new Set());

// Fetch navigation on mount
onMounted(async () => {
  navigationStore.clearCache();
  try {
    await navigationStore.fetchNavigation();
    console.log('TheSidebar: Navigation loaded', navigationStore.menu);
    
    if (!navigationStore.menu || navigationStore.menu.length === 0) {
      console.warn('TheSidebar: El store de navegación está vacío');
    }
  } catch (e) {
    console.error('TheSidebar: Failed to fetch navigation', e);
  }
  
  // Set active item based on current route
  if (navigationStore.menu && navigationStore.menu.length > 0) {
    const currentPath = route.path;
    const currentItem = navigationStore.menu.find(item => 
      currentPath.startsWith(item.path)
    );
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }
});

// Computed
const isLoading = computed(() => navigationStore.isLoading);
const error = computed(() => navigationStore.error);

const ungroupedItems = computed(() => {
  console.log('TheSidebar: Computing ungroupedItems', navigationStore.ungrouped);
  if (!navigationStore.ungrouped || navigationStore.ungrouped.length === 0) {
    return [];
  }
  return navigationStore.ungrouped.map((item: MenuItem) => ({
    id: item.id,
    label: item.title,
    path: item.path,
    icon: item.icon,
    group: null,
    sortOrder: item.order,
  }));
});

type VisibleGroup = { id: string; label: string; icon: string; items: any[] };

const visibleGroups = computed<VisibleGroup[]>(() => {
  console.log('TheSidebar: Computing visibleGroups', navigationStore.groups);
  if (!navigationStore.groups || navigationStore.groups.length === 0) {
    return [];
  }

  return navigationStore.groups.map(group => ({
    id: group.id,
    label: group.label,
    icon: group.icon,
    items: group.modules.map((item: MenuItem) => ({
      id: item.id,
      label: item.title,
      path: item.path,
      icon: item.icon,
      group: group.id,
      sortOrder: item.order,
    })),
  })).filter(group => group.items.length > 0);
});

// Methods
function getIcon(iconName: string) {
  return iconMap[iconName] || LayoutDashboard;
}

function isExpanded(itemId: string): boolean {
  return expandedItems.value.has(itemId);
}

function toggleMenu(itemId: string) {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
}

function setActiveItem(itemId: string) {
  activeItemId.value = itemId;
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function closeMobile() {
  emit('update:modelValue', false);
}

function navigateTo(path: string, itemId: string) {
  router.push(path);
  setActiveItem(itemId);
}

function isItemActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path);
}
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
