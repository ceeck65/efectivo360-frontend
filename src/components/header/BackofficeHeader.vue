<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { t } from '@/lib/navigation';

interface ForexRateResponse {
  rate: number;
  currency: string;
  source: string;
  status: 'ok' | 'degraded';
  updated_at: string;
  last_success_at: string;
}

interface Props {
  onOpenSidebar?: () => void;
  forexRate?: ForexRateResponse | null;
}

const props = defineProps<Props>();
const authStore = useAuthStore();

// State
const paletteOpen = ref(false);
const profileOpen = ref(false);
const notificationsOpen = ref(false);
const isDarkMode = ref(false);
const unreadCount = ref(3); // Mock - replace with actual notifications hook

// Computed
const isOnline = computed(() => true); // Mock - connect to sync status
const isStaff = computed(() => authStore.user?.is_staff || false);
const tenantName = computed(() => 
  authStore.user?.tenant_commercial_name ?? authStore.user?.tenant_name ?? t('header.tenantFallback', 'Mi tienda')
);
const userName = computed(() => 
  authStore.user?.first_name || authStore.user?.username || t('header.profile', 'Perfil')
);
const userEmail = computed(() => authStore.user?.email || '-');
const userInitial = computed(() => 
  (authStore.user?.first_name?.[0] || authStore.user?.username?.[0] || '?').toUpperCase()
);

// Keyboard shortcut for command palette
const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen.value = !paletteOpen.value;
  }
  // Close dropdowns on Escape
  if (e.key === 'Escape') {
    profileOpen.value = false;
    notificationsOpen.value = false;
    paletteOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

// Actions
const handleLogout = async () => {
  await authStore.logout();
  window.location.href = '/es/login';
};

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};

</script>

<template>
  <div>
    <!-- Header -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-brand-dark bg-white shadow-sm"
    >
      <!-- Left Section: Title + Search -->
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-brand-dark transition hover:border-slate-300 hover:bg-slate-100 lg:hidden"
          @click="props.onOpenSidebar"
          :aria-label="t('sidebar.open', 'Abrir menú')"
        >
          <Menu class="h-4 w-4" stroke-width="1.5" />
        </button>

        <!-- Title Block -->
        <div class="min-w-0 shrink-0">
          <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {{ isStaff ? 'ERP' : t('header.storeLabel', 'Tienda') }}
          </p>
          <h2 class="truncate text-base font-semibold text-brand-dark md:text-lg">
            {{ isStaff ? 'Efectivo 360' : tenantName }}
          </h2>
        </div>

        <!-- Search Bar - Desktop -->
        <button
          type="button"
          @click="paletteOpen = true"
          class="hidden min-w-0 flex-1 max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-slate-600 transition md:flex border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
        >
          <Search class="h-4 w-4 shrink-0 text-slate-400" stroke-width="1.5" />
          <span class="flex-1 truncate">{{ t('header.commandSearchTrigger', 'Buscar módulos y rutas…') }}</span>
          <div class="flex items-center gap-1">
            <kbd class="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:inline">
              ⌘K
            </kbd>
            <span class="hidden text-[10px] text-slate-400 lg:inline">or</span>
            <kbd class="hidden shrink-0 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500 lg:inline">
              /
            </kbd>
          </div>
        </button>

        <!-- Forex Rate Badge -->
        <span
          v-if="props.forexRate"
          :class="[
            'hidden shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold lg:inline-flex',
            props.forexRate.status === 'ok'
              ? 'border-emerald-800 bg-emerald-50 text-emerald-800'
              : 'border-amber-700 bg-amber-50 text-amber-700'
          ]"
          :title="props.forexRate.status === 'ok' 
            ? undefined 
            : `${t('header.bcvLastUpdate', 'Última actualización')}: ${new Date(props.forexRate.last_success_at).toLocaleString()}`
          "
        >
          {{ t('header.bcvRate', 'Tasa Oficial BCV') }}: {{ props.forexRate.rate.toFixed(2) }} VES
        </span>
      </div>

      <!-- Right Section: User Zone -->
      <div class="relative flex items-center gap-1 md:gap-2">
        <!-- Mobile Search -->
        <button
          type="button"
          @click="paletteOpen = true"
          class="flex rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 md:hidden"
          :aria-label="t('header.commandSearchTrigger', 'Buscar módulos y rutas…')"
        >
          <Search class="h-4 w-4" stroke-width="1.5" />
        </button>

        <!-- Dark Mode Toggle -->
        <button
          type="button"
          @click="toggleDarkMode"
          class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-brand-dark"
        >
          <Moon v-if="!isDarkMode" class="h-4 w-4" stroke-width="1.5" />
          <Sun v-else class="h-4 w-4" stroke-width="1.5" />
        </button>

        <!-- Notifications Button -->
        <button
          type="button"
          @click="notificationsOpen = !notificationsOpen"
          class="relative rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell class="h-4 w-4" stroke-width="1.5" />
          <span
            v-if="unreadCount > 0"
            class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- User Menu Button -->
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-brand-dark transition hover:border-slate-300 hover:bg-slate-100"
          @click="profileOpen = !profileOpen"
        >
          <span class="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-[10px] font-semibold text-white">
            {{ userInitial }}
            <span
              :class="[
                'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white',
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              ]"
            />
          </span>
          <span class="hidden max-w-[100px] truncate font-medium text-slate-700 md:inline">
            {{ userName }}
          </span>
          <ChevronDown class="h-3.5 w-3.5 text-slate-400" stroke-width="1.5" />
        </button>

        <!-- Profile Dropdown -->
        <template v-if="profileOpen">
          <button
            type="button"
            class="fixed inset-0 z-40 cursor-default"
            aria-hidden
            @click="profileOpen = false"
          />
          <div
            class="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg"
          >
            <div class="flex items-center gap-3 border-b border-slate-100 p-3">
              <div class="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-sm font-semibold text-white">
                {{ userInitial }}
                <span
                  :class="[
                    'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white',
                    isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  ]"
                />
              </div>
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-brand-dark">
                  {{ userName }}
                </div>
                <div class="truncate text-xs text-slate-500">{{ userEmail }}</div>
              </div>
            </div>
            <div class="grid gap-0.5 p-1 text-sm">
              <RouterLink
                to="/admin/settings"
                class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-700 hover:bg-slate-100"
                @click="profileOpen = false"
              >
                <Settings class="h-4 w-4 text-brand-primary" stroke-width="1.5" />
                {{ t('header.settings', 'Configuraciones') }}
              </RouterLink>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                @click="handleLogout"
              >
                <LogOut class="h-4 w-4 text-slate-400" stroke-width="1.5" />
                {{ t('header.logout', 'Cerrar sesión') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Notifications Dropdown -->
        <template v-if="notificationsOpen">
          <button
            type="button"
            class="fixed inset-0 z-40 cursor-default"
            aria-hidden
            @click="notificationsOpen = false"
          />
          <div
            class="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span class="text-sm font-semibold text-brand-dark">Notificaciones</span>
              <span
                v-if="unreadCount > 0"
                class="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                {{ unreadCount }}
              </span>
            </div>
            <div class="max-h-64 overflow-y-auto p-2">
              <div class="flex flex-col gap-2">
                <div class="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
                  <span class="mt-0.5 h-2 w-2 rounded-full bg-rose-500" />
                  <div class="flex-1">
                    <p class="text-xs font-medium text-brand-dark">Pago recibido</p>
                    <p class="text-[11px] text-slate-500">Se ha registrado un nuevo pago de $1,250.00</p>
                    <p class="mt-1 text-[10px] text-slate-400">Hace 5 min</p>
                  </div>
                </div>
                <div class="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
                  <span class="mt-0.5 h-2 w-2 rounded-full bg-rose-500" />
                  <div class="flex-1">
                    <p class="text-xs font-medium text-brand-dark">Stock bajo</p>
                    <p class="text-[11px] text-slate-500">El producto "Café Premium" está por agotarse</p>
                    <p class="mt-1 text-[10px] text-slate-400">Hace 1 hora</p>
                  </div>
                </div>
                <div class="flex items-start gap-2 rounded-lg p-2">
                  <span class="mt-0.5 h-2 w-2 rounded-full bg-slate-300" />
                  <div class="flex-1">
                    <p class="text-xs font-medium text-slate-700">Factura generada</p>
                    <p class="text-[11px] text-slate-500">Factura #12345 fue creada exitosamente</p>
                    <p class="mt-1 text-[10px] text-slate-400">Hace 3 horas</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="border-t border-slate-100 p-2">
              <button
                type="button"
                class="w-full rounded-lg py-1.5 text-center text-xs font-medium text-brand-primary hover:bg-slate-50"
                @click="notificationsOpen = false"
              >
                Ver todas
              </button>
            </div>
          </div>
        </template>
      </div>
    </header>
  </div>
</template>
