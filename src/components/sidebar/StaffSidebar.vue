<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  LayoutDashboard,
  Activity,
  ScrollText,
  Building2,
  CreditCard,
  HeadphonesIcon,
  Receipt,
  Settings,
  Megaphone,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Crown,
  Users,
  Waypoints,
  CheckCircle2,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { STAFF_ROLES, hasPermission, getStaffRoleLabel, type StaffRole } from '@/lib/staff-permissions';
import { t } from '@/lib/navigation';

interface Props {
  isOpen: boolean;
  isCollapsed: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isCollapsed: false,
});

const emit = defineEmits<{
  close: [];
  'update:isCollapsed': [value: boolean];
}>();

const route = useRoute();
const authStore = useAuthStore();
const user = computed(() => authStore.user);
const userRole = computed(() => (user.value?.staff_role as StaffRole) || null);

// Icon props matching React
const iconProps = { strokeWidth: 1.5, className: 'h-5 w-5' };

// Menu structure matching React staff-sidebar.tsx
const menuStructure = [
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Activity,
    minRole: STAFF_ROLES.SUPPORT_L2,
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/admin/master/dashboard', icon: LayoutDashboard, minRole: STAFF_ROLES.SUPPORT_L2 },
      { id: 'health', label: 'Salud del Sistema', href: '/admin/master/health', icon: Activity, minRole: STAFF_ROLES.SUPPORT_L2 },
      { id: 'logs', label: 'Logs', href: '/admin/master/logs', icon: ScrollText, minRole: STAFF_ROLES.SUPPORT_L2 },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    minRole: STAFF_ROLES.SUPPORT_L1,
    items: [
      { id: 'tiendas', label: 'Tiendas Activas', href: '/admin/master/tenants', icon: Building2, minRole: STAFF_ROLES.SUPPORT_L1 },
      { id: 'suscripciones', label: 'Suscripciones', href: '/admin/master/subscriptions', icon: CreditCard, minRole: STAFF_ROLES.OPERATIONS },
      { id: 'soporte', label: 'Soporte', href: '/admin/master/support', icon: HeadphonesIcon, minRole: STAFF_ROLES.SUPPORT_L1 },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: Receipt,
    minRole: STAFF_ROLES.OPERATIONS,
    items: [
      { id: 'validacion-pagos', label: 'Validar Pagos', href: '/admin/payments', icon: CheckCircle2, minRole: STAFF_ROLES.OPERATIONS },
      { id: 'pagos', label: 'Pagos Recibidos', href: '/admin/master/payments', icon: Receipt, minRole: STAFF_ROLES.OPERATIONS },
      { id: 'planes', label: 'Configuración de Planes', href: '/admin/master/plans', icon: Settings, minRole: STAFF_ROLES.OPERATIONS },
      { id: 'categorias', label: 'Categorías ERP', href: '/admin/master/categories', icon: Waypoints, minRole: STAFF_ROLES.OPERATIONS },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    minRole: STAFF_ROLES.OPERATIONS,
    items: [
      { id: 'landing', label: 'Landing Page', href: '/admin/master/landing', icon: Megaphone, minRole: STAFF_ROLES.OPERATIONS },
      { id: 'notificaciones', label: 'Notificaciones Push', href: '/admin/master/notifications', icon: Bell, minRole: STAFF_ROLES.OPERATIONS },
    ],
  },
];

// Expanded groups state
const expandedGroups = ref<Set<string>>(new Set(menuStructure.map(g => g.id)));

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

// Check permissions
const canSeeGroup = (group: typeof menuStructure[0]): boolean => {
  return hasPermission({ is_staff: true, staff_role: userRole.value }, group.minRole);
};

const canSeeItem = (item: typeof menuStructure[0]['items'][0]): boolean => {
  return hasPermission({ is_staff: true, staff_role: userRole.value }, item.minRole);
};

// Staff badge helpers
const isGodMode = computed(() => userRole.value === STAFF_ROLES.GOD_MODE);
const isDev = computed(() => userRole.value === STAFF_ROLES.DEVELOPER);
const isOps = computed(() => userRole.value === STAFF_ROLES.OPERATIONS);

// Don't render if not staff
if (!user.value?.is_staff) {
  // Component returns null - handled by conditional rendering in parent
}
</script>

<template>
  <div v-if="user?.is_staff">
    <!-- Mobile Overlay -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="emit('close')"
      />
    </transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex h-screen flex-col',
        'bg-brand-dark',
        'border-r border-white/[0.06]',
        'backdrop-blur-xl',
        'transition-all duration-300',
        props.isCollapsed ? 'w-20' : 'w-[280px]',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-5 lg:px-4">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Shield class="h-5 w-5 text-white" stroke-width="2" />
            </div>
            <div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-brand-dark" />
          </div>

          <transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 -translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-2"
          >
            <div v-if="!props.isCollapsed" class="flex flex-col">
              <span class="text-sm font-bold text-white tracking-tight">
                CONTROL
              </span>
              <span class="text-[10px] font-medium text-brand-secondary tracking-wider uppercase">
                GLOBAL
              </span>
            </div>
          </transition>
        </div>

        <!-- Mobile Close -->
        <button
          @click="emit('close')"
          class="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Divider -->
      <div class="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <template v-for="group in menuStructure" :key="group.id">
          <div v-if="canSeeGroup(group)" class="mb-4">
            <!-- Group Header -->
            <button
              @click="toggleGroup(group.id)"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold tracking-wider uppercase',
                'text-slate-500 hover:text-slate-300 transition-colors',
                props.isCollapsed && 'justify-center'
              ]"
            >
              <component :is="group.icon" v-bind="iconProps" class="h-4 w-4" />
              <template v-if="!props.isCollapsed">
                <span class="flex-1 text-left">{{ group.label }}</span>
                <transition name="rotate">
                  <ChevronLeft
                    class="h-3 w-3 transition-transform"
                    :class="expandedGroups.has(group.id) ? '' : '-rotate-90'"
                  />
                </transition>
              </template>
            </button>

            <!-- Group Items -->
            <transition
              enter-active-class="transition-all duration-200"
              enter-from-class="h-0 opacity-0"
              enter-to-class="h-auto opacity-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="h-auto opacity-100"
              leave-to-class="h-0 opacity-0"
            >
              <div v-show="expandedGroups.has(group.id)" class="mt-1 space-y-0.5 overflow-hidden">
                <template v-for="item in group.items" :key="item.id">
                  <RouterLink
                    v-if="canSeeItem(item)"
                    :to="item.href"
                    @click="emit('close')"
                    :class="[
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                      'relative overflow-hidden',
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 text-white border border-brand-primary/30 shadow-[0_0_20px_rgba(0,123,255,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    ]"
                  >
                    <!-- Electric blue glow on hover -->
                    <div
                      :class="[
                        'absolute inset-0 rounded-xl transition-opacity duration-300',
                        'bg-gradient-to-r from-blue-500/0 via-cyan-400/5 to-blue-500/0',
                        'opacity-0 group-hover:opacity-100',
                        'blur-xl'
                      ]"
                    />

                    <component
                      :is="item.icon"
                      v-bind="iconProps"
                      :class="[
                        'relative z-10 h-5 w-5',
                        isActive(item.href) && 'text-brand-primary'
                      ]"
                    />

                    <transition
                      enter-active-class="transition-all duration-200"
                      enter-from-class="opacity-0 -translate-x-2"
                      enter-to-class="opacity-100 translate-x-0"
                      leave-active-class="transition-all duration-200"
                      leave-from-class="opacity-100 translate-x-0"
                      leave-to-class="opacity-0 -translate-x-2"
                    >
                      <span v-if="!props.isCollapsed" class="relative z-10 font-medium">
                        {{ item.label }}
                      </span>
                    </transition>

                    <!-- Active indicator -->
                    <div
                      v-if="isActive(item.href)"
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-primary to-brand-secondary rounded-r-full"
                    />
                  </RouterLink>
                </template>
              </div>
            </transition>
          </div>
        </template>
      </nav>

      <!-- Footer -->
      <div class="border-t border-white/[0.06] p-4">
        <!-- User Card -->
        <div :class="['flex items-center gap-3 mb-4', props.isCollapsed && 'justify-center']">
          <div class="relative">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium">
              {{ user?.first_name?.[0] || user?.username?.[0] || 'U' }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-brand-dark" />
          </div>

          <transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="!props.isCollapsed" class="flex flex-col min-w-0 flex-1">
              <span class="text-sm font-medium text-white truncate">
                {{ user?.first_name || user?.username }}
              </span>
              <!-- Staff Badge -->
              <span
                v-if="userRole"
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
                  isGodMode && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                  isDev && 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                  isOps && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                  !isGodMode && !isDev && !isOps && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                ]"
              >
                <Crown v-if="isGodMode" class="h-3 w-3" />
                <Shield v-else-if="isDev" class="h-3 w-3" />
                {{ getStaffRoleLabel(userRole).replace(' ', '\u00A0') }}
              </span>
            </div>
          </transition>
        </div>

        <!-- Actions -->
        <div :class="['flex gap-2', props.isCollapsed && 'flex-col items-center']">
          <button
            @click="handleLogout"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'text-slate-400 hover:text-red-400 hover:bg-red-500/10',
              'transition-all duration-200',
              props.isCollapsed && 'justify-center w-10 h-10 p-0'
            ]"
          >
            <LogOut v-bind="iconProps" />
            <span v-if="!props.isCollapsed">{{ t('sidebar.logout') }}</span>
          </button>

          <button
            @click="handleToggleCollapse"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'text-slate-400 hover:text-white hover:bg-white/10',
              'transition-all duration-200',
              props.isCollapsed && 'justify-center w-10 h-10 p-0'
            ]"
          >
            <ChevronRight v-if="props.isCollapsed" v-bind="iconProps" />
            <template v-else>
              <ChevronLeft v-bind="iconProps" />
              <span>{{ t('sidebar.collapse') }}</span>
            </template>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.rotate-enter-active,
.rotate-leave-active {
  transition: transform 0.2s;
}

.rotate-enter-from,
.rotate-leave-to {
  transform: rotate(-90deg);
}
</style>
