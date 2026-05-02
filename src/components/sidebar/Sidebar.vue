<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  Settings,
  BarChart3,
  Monitor,
  Boxes,
  CreditCard,
  Gauge,
  Ruler,
  Tag,
  Users,
  ShieldCheck,
  Shield,
  Landmark,
  Wallet,
  Waypoints,
  CheckCircle2,
  LineChart,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore, type MenuItem } from '@/stores/navigation';
import { usePermissions } from '@/composables/usePermissions';
import { eventBus, PERMISSION_EVENTS } from '@/events/eventBus';

// Icon mapping from Lucide
const iconMap: Record<string, any> = {
  BarChart3,
  LineChart,
  Boxes,
  CreditCard,
  Gauge,
  Monitor,
  Ruler,
  Users,
  Settings,
  Tag,
  ShieldCheck,
  Shield,
  Landmark,
  Wallet,
  Waypoints,
  CheckCircle2,
};

interface NavItem {
  href: string;
  label: string;
  icon: any;
  shortcut?: string;
  permission?: string;
  requiresOnline?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// Translation helper
const translate = (key: string, fallback?: string): string => {
  const translations: Record<string, string> = {
    'app.subtitle': 'Efectivo 360',
    'app.subtitleShort': 'Efi 360',
    'app.title': 'Efectivo 360',
    'sidebar.close': 'Cerrar',
    'sidebar.configureTenantFirst': 'Configura tu tienda primero',
    'sidebar.offlineMode': 'Modo sin conexión',
    'sidebar.online': 'En línea',
    'sidebar.footer': 'Sistema POS v2.0',
    'sidebar.logout': 'Cerrar Sesión',
    'sidebar.expand': 'Expandir',
    'sidebar.collapse': 'Colapsar',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.posDesktop': 'Punto de Venta',
    'sidebar.inventory': 'Inventario',
    'sidebar.billing': 'Facturación',
    'sidebar.financialAnalytics': 'Analítica Financiera',
    'sidebar.exchangeRates': 'Tasas de Cambio',
    'sidebar.units': 'Unidades',
    'sidebar.receivables': 'Cuentas por Cobrar',
    'sidebar.customers': 'Clientes',
    'sidebar.team': 'Equipo',
    'sidebar.settings': 'Configuración',
  };
  return translations[key] || fallback || key;
};

interface Props {
  isOpen: boolean;
  variant?: 'default' | 'glass';
  isCollapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'glass',
  isCollapsed: false,
});

const emit = defineEmits<{
  close: [];
  'update:isCollapsed': [value: boolean];
}>();

const route = useRoute();
const authStore = useAuthStore();
const navigationStore = useNavigationStore();
const { hasPerm } = usePermissions();

// Prevent hydration mismatch by waiting for client mount
const mounted = ref(false);
onMounted(async () => {
  mounted.value = true;
  
  // Clear cache to force fresh data from API
  navigationStore.clearCache();
  
  try {
    await navigationStore.fetchNavigation();
    console.log('Sidebar: Navigation loaded successfully', navigationStore.menu);
    
    if (navigationStore.menu.length === 0) {
      console.warn('Sidebar: El store de navegación está vacío después de fetch');
    }
  } catch (e) {
    console.error('Sidebar: Failed to fetch navigation:', e);
  }

  // Listen for permission changes
  eventBus.on(PERMISSION_EVENTS.PERMISSIONS_CHANGED, handlePermissionsChanged);
  eventBus.on(PERMISSION_EVENTS.ROLE_PERMISSIONS_UPDATED, handlePermissionsChanged);
  eventBus.on(PERMISSION_EVENTS.USER_PERMISSIONS_REFRESHED, handlePermissionsChanged);
});

onUnmounted(() => {
  // Clean up event listeners
  eventBus.off(PERMISSION_EVENTS.PERMISSIONS_CHANGED, handlePermissionsChanged);
  eventBus.off(PERMISSION_EVENTS.ROLE_PERMISSIONS_UPDATED, handlePermissionsChanged);
  eventBus.off(PERMISSION_EVENTS.USER_PERMISSIONS_REFRESHED, handlePermissionsChanged);
});

// Handle permission changes
const handlePermissionsChanged = async () => {
  console.log('Sidebar: Permissions changed, refreshing navigation');
  
  try {
    // Refresh user permissions from auth store
    await authStore.refreshUserPermissions();
    
    // Refresh navigation menu
    navigationStore.clearCache();
    await navigationStore.fetchNavigation();
    
    console.log('Sidebar: Navigation refreshed after permission changes');
  } catch (e) {
    console.error('Sidebar: Failed to refresh after permission changes:', e);
  }
};

// User info
const isStaff = computed(() => authStore.user?.is_staff || false);

// Check if user needs to configure tenant
const needsTenantConfiguration = computed(() => {
  const user = authStore.user;
  return (
    !user?.is_staff &&
    !user?.tenant_is_configured &&
    user?.role !== 'STAFF'
  );
});

// Convert API menu items to NavItem format
const navItems = computed<NavItem[]>(() => {
  if (navigationStore.menu.length === 0) {
    console.warn('Sidebar: navigationStore.menu está vacío');
  }
  
  return navigationStore.menu.map((item: MenuItem) => ({
    href: item.path,
    label: item.title,
    icon: iconMap[item.icon] || Settings,
    shortcut: item.shortcut || undefined,
    permission: item.permission_key || undefined,
  }));
});

// Grouped items using API data
const groupedItems = computed<NavGroup[]>(() => {
  const groups: NavGroup[] = [];
  const groupMap = new Map<string, NavItem[]>();
  
  navItems.value.forEach((item) => {
    const menuItem = navigationStore.menu.find(m => m.path === item.href);
    const groupId = menuItem?.group_id || 'other';
    
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId)!.push(item);
  });
  
  groupMap.forEach((items, groupId) => {
    const menuItem = navigationStore.menu.find(m => m.group_id === groupId);
    groups.push({
      id: groupId,
      label: menuItem?.group_label || 'Otros',
      items,
    });
  });
  
  console.log('Sidebar: Grouped items', groups);
  return groups;
});

// Expanded groups state
const expandedGroups = ref<Set<string>>(new Set());

// Initialize expanded groups
watch(
  () => groupedItems.value,
  (groups) => {
    if (groups.length === 0) {
      expandedGroups.value = new Set();
      return;
    }
    const available = new Set(groups.map((g) => g.id));
    const next = new Set<string>();
    expandedGroups.value.forEach((groupId) => {
      if (available.has(groupId)) next.add(groupId);
    });
    if (next.size === 0) {
      groups.forEach((g) => next.add(g.id));
    }
    expandedGroups.value = next;
  },
  { immediate: true }
);

const toggleGroup = (groupId: string) => {
  const next = new Set(expandedGroups.value);
  if (next.has(groupId)) next.delete(groupId);
  else next.add(groupId);
  expandedGroups.value = next;
};

const handleToggleCollapse = () => {
  emit('update:isCollapsed', !props.isCollapsed);
};

const handleLogout = async () => {
  await authStore.logout();
  window.location.href = '/es/login';
};

const isActive = (href: string): boolean => {
  return route.path === href;
};
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
      @click="emit('close')"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex h-screen flex-col px-3 py-5 transition-transform',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        variant === 'glass'
          ? `border-r border-white/[0.07] bg-brand-dark backdrop-blur-md shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)] ${props.isCollapsed ? 'lg:w-14' : 'lg:w-56'}`
          : `border-r bg-card ${props.isCollapsed ? 'lg:w-20' : 'lg:w-64'}`,
        'w-64'
      ]"
    >
      <!-- Mobile Header -->
      <div class="flex items-center justify-between px-2 lg:hidden">
        <p
          :class="[
            'text-sm font-semibold',
            variant === 'glass' ? 'text-white/80' : 'text-muted-foreground'
          ]"
        >
          {{ translate('app.subtitle') }}
        </p>
        <button
          type="button"
          :class="[
            variant === 'glass'
              ? 'rounded-md border border-white/15 p-2 text-white/90 hover:bg-white/10'
              : 'rounded-md border border-muted p-2 text-muted-foreground'
          ]"
          @click="emit('close')"
          :aria-label="translate('sidebar.close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Logo Section -->
      <div class="px-2">
        <div class="mb-3 flex items-center justify-center">
          <img
            src="/assets/efectivo360/logo-mark.svg"
            :alt="translate('app.subtitle')"
            :class="['h-10 w-10', props.isCollapsed ? '' : 'md:h-12 md:w-12']"
          />
        </div>
        <p
          :class="[
            'text-sm font-semibold lg:whitespace-nowrap lg:text-center',
            variant === 'glass' ? 'text-white/55' : 'text-muted-foreground'
          ]"
        >
          {{ props.isCollapsed 
            ? (isStaff ? 'ERP Efectivo 360' : translate('app.subtitleShort')) 
            : (isStaff ? 'ERP Efectivo 360' : translate('app.subtitle')) 
          }}
        </p>
        <h1
          :class="[
            'text-xl font-semibold',
            variant === 'glass' ? 'text-white' : '',
            props.isCollapsed ? 'hidden' : 'block'
          ]"
        >
          {{ isStaff ? 'ERP Efectivo 360' : translate('app.title') }}
        </h1>
      </div>

      <!-- Navigation -->
      <nav v-if="mounted" class="mt-6 flex flex-1 flex-col gap-1">
        <template v-for="group in (props.isCollapsed ? [{ id: 'flat', label: '', items: navItems }] : groupedItems)" :key="group.id">
          <div class="space-y-1">
            <!-- Group Header -->
            <button
              v-if="!props.isCollapsed && group.label"
              type="button"
              :class="[
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] uppercase tracking-wide',
                variant === 'glass' 
                  ? 'text-white/60 hover:bg-white/5' 
                  : 'text-muted-foreground hover:bg-muted/40'
              ]"
              @click="toggleGroup(group.id)"
            >
              <span>{{ group.label }}</span>
              <ChevronDown v-if="expandedGroups.has(group.id)" class="h-3.5 w-3.5" />
              <ChevronRight v-else class="h-3.5 w-3.5" />
            </button>

            <!-- Group Items -->
            <template v-if="props.isCollapsed || expandedGroups.has(group.id)">
              <template v-for="item in group.items" :key="item.href">
                <div
                  v-if="needsTenantConfiguration && item.href !== '/admin/tenants'"
                  :class="[
                    'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition cursor-not-allowed opacity-60',
                    variant === 'glass'
                      ? 'border border-transparent text-slate-300'
                      : 'text-muted-foreground'
                  ]"
                  :title="translate('sidebar.configureTenantFirst')"
                >
                  <component
                    :is="item.icon"
                    :class="[
                      'h-[18px] w-[18px] shrink-0',
                      variant === 'glass' ? 'stroke-[1.5]' : 'stroke-[1.35]'
                    ]"
                  />
                  <span :class="[props.isCollapsed ? 'hidden' : 'block']">
                    {{ translate(item.label) }}
                  </span>
                  <Lock
                    v-if="!props.isCollapsed"
                    :class="[
                      'ml-auto h-3.5 w-3.5',
                      variant === 'glass' ? 'text-white/40' : 'text-muted-foreground/60'
                    ]"
                  />
                </div>
                <RouterLink
                  v-else-if="!item.permission || hasPerm('MENUS', item.permission)"
                  :to="item.href"
                  @click="emit('close')"
                  :class="[
                    'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition',
                    variant === 'glass'
                      ? isActive(item.href)
                        ? 'border border-brand-primary/50 bg-brand-primary/20 text-brand-primary shadow-[0_0_20px_rgba(0,123,255,0.2)]'
                        : 'border border-transparent text-slate-300 hover:border-white/15 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(0,0,0,0.15)]'
                      : isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/80 dark:hover:bg-white/[0.06]',
                    item.requiresOnline && !true ? 'cursor-not-allowed opacity-60' : ''
                  ]"
                  :title="item.requiresOnline && !true ? translate('sidebar.offlineMode') : undefined"
                >
                  <component
                    :is="item.icon"
                    :class="[
                      'h-[18px] w-[18px] shrink-0',
                      variant === 'glass' ? 'stroke-[1.5]' : 'stroke-[1.35]'
                    ]"
                  />
                  <span :class="[props.isCollapsed ? 'hidden' : 'block']">
                    {{ translate(item.label) }}
                  </span>
                  <span
                    v-if="item.shortcut && !props.isCollapsed"
                    :class="[
                      'ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      variant === 'glass'
                        ? isActive(item.href)
                          ? 'border-sky-400/35 text-white'
                          : 'border-white/12 text-white/40'
                        : isActive(item.href)
                          ? 'border-primary-foreground/60 text-primary-foreground'
                          : 'border-muted-foreground/40 text-muted-foreground'
                    ]"
                  >
                    {{ item.shortcut }}
                  </span>
                </RouterLink>
              </template>
            </template>
          </div>
        </template>
      </nav>

      <!-- Skeleton Loading -->
      <nav v-else class="mt-6 flex flex-1 flex-col gap-1">
        <div
          v-for="i in 5"
          :key="i"
          :class="[
            'flex items-center gap-3 rounded-lg px-2.5 py-2',
            variant === 'glass' ? 'bg-white/5' : 'bg-muted/50'
          ]"
        >
          <div :class="['h-[18px] w-[18px] rounded', variant === 'glass' ? 'bg-white/10' : 'bg-muted']" />
          <div :class="['h-4 w-24 rounded', variant === 'glass' ? 'bg-white/10' : 'bg-muted']" />
        </div>
      </nav>

      <!-- Footer -->
      <div
        :class="[
          'space-y-2 p-3 text-xs',
          variant === 'glass'
            ? `rounded-bento border border-white/[0.08] bg-black/25 text-white/50 backdrop-blur-sm ${props.isCollapsed ? 'hidden' : 'block'}`
            : `rounded-lg border bg-muted/40 text-muted-foreground ${props.isCollapsed ? 'hidden' : 'block'}`
        ]"
      >
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{{ translate('sidebar.online') }}</span>
        </div>
        <p class="mt-1">{{ translate('sidebar.footer') }}</p>
      </div>

      <!-- Logout Button -->
      <button
        type="button"
        :class="[
          'mt-4 flex w-full items-center gap-2 px-3 py-2 text-sm transition',
          variant === 'glass'
            ? 'rounded-xl border border-white/15 text-slate-200 hover:bg-white/10'
            : 'rounded-md border border-muted text-muted-foreground hover:bg-muted'
        ]"
        @click="handleLogout"
      >
        <LogOut :class="['h-4 w-4', variant === 'glass' ? 'stroke-[1.5]' : '']" />
        <span :class="[props.isCollapsed ? 'hidden' : 'block']">
          {{ translate('sidebar.logout') }}
        </span>
      </button>

      <!-- Collapse Toggle (Desktop) -->
      <button
        type="button"
        :class="[
          'mt-4 hidden w-full items-center justify-center p-2 lg:flex',
          variant === 'glass'
            ? 'rounded-xl border border-white/12 text-white/70 hover:border-sky-400/25 hover:bg-white/[0.06]'
            : 'rounded-md border border-muted text-muted-foreground'
        ]"
        @click="handleToggleCollapse"
        :aria-label="props.isCollapsed ? translate('sidebar.expand') : translate('sidebar.collapse')"
      >
        <ChevronRight v-if="props.isCollapsed" :class="['h-4 w-4', variant === 'glass' ? 'stroke-[1.5]' : '']" />
        <ChevronLeft v-else :class="['h-4 w-4', variant === 'glass' ? 'stroke-[1.5]' : '']" />
        <span :class="['ml-2 text-xs', props.isCollapsed ? 'hidden' : 'block']">
          {{ props.isCollapsed ? translate('sidebar.expand') : translate('sidebar.collapse') }}
        </span>
      </button>
    </aside>
  </div>
</template>
