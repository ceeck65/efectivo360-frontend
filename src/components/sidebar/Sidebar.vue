<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import type { NavItem, NavGroup } from '@/lib/navigation';
import { t, getNavGroups, filterNavItemsByRole, allNavItems, financialConfigMenu } from '@/lib/navigation';

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

// Prevent hydration mismatch by waiting for client mount
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

// Permission checks using CMS permissions from auth store (same as React)
const canViewReports = computed(() => 
  authStore.hasCmsPermissionCode('CAN_VIEW_REPORTS') || 
  authStore.user?.role === 'OWNER' || 
  authStore.user?.role === 'FOUNDER'
);
const canEditPrice = computed(() => 
  authStore.hasCmsPermissionCode('CAN_EDIT_PRICE') || 
  authStore.user?.role === 'OWNER' || 
  authStore.user?.role === 'FOUNDER'
);
const canVoidInvoice = computed(() => 
  authStore.hasCmsPermissionCode('CAN_VOID_INVOICE') || 
  authStore.user?.role === 'OWNER' || 
  authStore.user?.role === 'FOUNDER'
);

// User info
const isStaff = computed(() => authStore.user?.is_staff || false);
const userRole = computed(() => authStore.user?.role || null);
const userType = computed(() => authStore.user?.user_type || null);

// Navigation items based on role
const navItems = computed<NavItem[]>(() => {
  return filterNavItemsByRole(
    allNavItems,
    userRole.value,
    isStaff.value,
    canViewReports.value,
    canEditPrice.value,
    canVoidInvoice.value
  );
});

// Grouped items
const groupedItems = computed<NavGroup[]>(() => {
  const extraGroups = isStaff.value
    ? [{ id: 'financial', label: 'Configuración Financiera', items: financialConfigMenu }]
    : [];
  return getNavGroups(navItems.value, isStaff.value, userType.value, extraGroups);
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

// Translation helper that handles keys
const translate = (key: string): string => {
  if (key.startsWith('sidebar.')) {
    return t(key, key);
  }
  return key;
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
                <RouterLink
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
