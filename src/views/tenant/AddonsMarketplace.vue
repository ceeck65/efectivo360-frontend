<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ShoppingCart,
  Package,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

// Types
interface Addon {
  id: string;
  code: string;
  name: string;
  description: string;
  addon_type: 'SERVICIO' | 'CONSUMO';
  price: number;
  units_included: number;
  default_duration_days: number;
  is_active: boolean;
  display_order: number;
}

interface TenantAddon {
  id: string;
  addon: Addon;
  expiration_date?: string;
  remaining_units: number;
  is_active: boolean;
  purchased_at: string;
}

// Reactive data
const addons = ref<Addon[]>([]);
const tenantAddons = ref<TenantAddon[]>([]);
const loading = ref(false);
const purchasing = ref<string | null>(null);

// Notifications
const { success: notifySuccess, error: notifyError } = useNotify();

// Computed
const availableAddons = computed(() => {
  return addons.value.filter(addon => addon.is_active);
});

const hasActiveAddon = (addonId: string) => {
  return tenantAddons.value.some(ta => 
    ta.addon.id === addonId && 
    ta.is_active && 
    (ta.addon.addon_type === 'CONSUMO' || 
     (ta.addon.addon_type === 'SERVICIO' && ta.expiration_date && new Date(ta.expiration_date) > new Date()))
  );
};

const getAddonStatus = (addon: Addon) => {
  const tenantAddon = tenantAddons.value.find(ta => ta.addon.id === addon.id);
  if (!tenantAddon || !tenantAddon.is_active) return 'available';
  
  if (addon.addon_type === 'SERVICIO') {
    if (tenantAddon.expiration_date && new Date(tenantAddon.expiration_date) > new Date()) {
      return 'active';
    }
    return 'expired';
  } else {
    return tenantAddon.remaining_units > 0 ? 'active' : 'exhausted';
  }
};

const getAddonStatusText = (addon: Addon) => {
  const status = getAddonStatus(addon);
  const tenantAddon = tenantAddons.value.find(ta => ta.addon.id === addon.id);
  
  switch (status) {
    case 'active':
      if (addon.addon_type === 'SERVICIO' && tenantAddon?.expiration_date) {
        return `Activo hasta ${new Date(tenantAddon.expiration_date).toLocaleDateString()}`;
      } else if (addon.addon_type === 'CONSUMO' && tenantAddon) {
        return `${tenantAddon.remaining_units} unidades disponibles`;
      }
      return 'Activo';
    case 'expired':
      return 'Expirado';
    case 'exhausted':
      return 'Agotado';
    default:
      return 'Disponible';
  }
};

// Methods
const loadAddons = async () => {
  try {
    console.log('🔄 Loading addons from /api/v1/addons/');
    const data = await fetchApi<any>('/api/v1/addons/');
    console.log('✅ Addons loaded:', data);
    console.log('📊 Data type:', typeof data);
    console.log('📊 Is array:', Array.isArray(data));
    
    // Handle pagination response
    let addonsList: any[] = [];
    if (Array.isArray(data)) {
      addonsList = data;
    } else if (data && data.results && Array.isArray(data.results)) {
      addonsList = data.results;
    }
    
    console.log('📊 Addons list length:', addonsList.length);
    if (addonsList.length > 0) {
      console.log('📊 First addon:', addonsList[0]);
      console.log('📊 First addon is_active:', addonsList[0].is_active);
    }
    addons.value = addonsList;
    console.log('📊 addons.value:', addons.value);
    console.log('📊 availableAddons:', availableAddons.value);
  } catch (error) {
    console.error('❌ Error loading addons:', error);
    notifyError('Error al cargar los add-ons disponibles');
  }
};

const loadTenantAddons = async () => {
  try {
    const data = await fetchApi<any>('/api/v1/tenant-addons/');
    
    // Handle pagination response
    let tenantAddonsList: any[] = [];
    if (Array.isArray(data)) {
      tenantAddonsList = data;
    } else if (data && data.results && Array.isArray(data.results)) {
      tenantAddonsList = data.results;
    }
    
    tenantAddons.value = tenantAddonsList;
  } catch (error) {
    console.error('Error loading tenant addons:', error);
    notifyError('Error al cargar tus add-ons activos');
  }
};

const purchaseAddon = async (addonId: string) => {
  purchasing.value = addonId;
  
  try {
    const response = await fetchApi<{ detail?: string }>('/api/v1/addons/purchase/', {
      method: 'POST',
      data: JSON.stringify({ addon_id: addonId })
    });
    
    if (response.detail) {
      notifySuccess(response.detail);
    } else {
      notifySuccess('Add-on adquirido exitosamente');
    }
    
    // Reload data
    await Promise.all([loadAddons(), loadTenantAddons()]);
    
  } catch (error: any) {
    console.error('Error purchasing addon:', error);
    const errorMessage = error?.detail || 'Error al adquirir el add-on';
    notifyError(errorMessage);
  } finally {
    purchasing.value = null;
  }
};

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadAddons(), loadTenantAddons()]);
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <ShoppingCart class="h-8 w-8 text-cyan-500" />
          Marketplace de Add-ons
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Adquiere módulos adicionales y packs de consumo para tu negocio.
        </p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
      >
        <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
        Recargar
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <RefreshCw class="h-8 w-8 animate-spin text-cyan-500" />
      <span class="ml-2 text-slate-600 dark:text-slate-400">Cargando marketplace...</span>
    </div>

    <!-- Add-ons Grid -->
    <div v-else-if="availableAddons.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="addon in availableAddons"
        :key="addon.id"
        class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]"
      >
        <!-- Status Badge -->
        <div class="absolute top-4 right-4">
          <span
            v-if="getAddonStatus(addon) === 'active'"
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          >
            <CheckCircle class="h-3 w-3 mr-1" />
            Activo
          </span>
          <span
            v-else-if="getAddonStatus(addon) === 'expired'"
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          >
            <AlertCircle class="h-3 w-3 mr-1" />
            Expirado
          </span>
          <span
            v-else-if="getAddonStatus(addon) === 'exhausted'"
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          >
            <AlertCircle class="h-3 w-3 mr-1" />
            Agotado
          </span>
        </div>

        <!-- Add-on Icon and Type -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl"
            :class="addon.addon_type === 'SERVICIO' 
              ? 'bg-purple-500/12 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300' 
              : 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'"
          >
            <component :is="addon.addon_type === 'SERVICIO' ? CreditCard : Package" class="h-6 w-6" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ addon.name }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ addon.code }}</p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {{ addon.description }}
        </p>

        <!-- Add-on Details -->
        <div class="space-y-2 mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500 dark:text-slate-400">Tipo:</span>
            <span class="font-medium text-slate-900 dark:text-white">
              {{ addon.addon_type === 'SERVICIO' ? 'Servicio Recurrente' : 'Pack de Consumo' }}
            </span>
          </div>
          
          <div v-if="addon.addon_type === 'SERVICIO'" class="flex items-center justify-between text-sm">
            <span class="text-slate-500 dark:text-slate-400">Duración:</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ addon.default_duration_days }} días</span>
          </div>
          
          <div v-else class="flex items-center justify-between text-sm">
            <span class="text-slate-500 dark:text-slate-400">Unidades:</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ addon.units_included }} unidades</span>
          </div>
        </div>

        <!-- Status Text -->
        <div class="mb-4">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ getAddonStatusText(addon) }}
          </p>
        </div>

        <!-- Price and Action -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">${{ addon.price }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">USD</p>
          </div>
          
          <button
            @click="purchaseAddon(addon.id)"
            :disabled="purchasing === addon.id || getAddonStatus(addon) === 'active'"
            class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium rounded-lg transition-colors"
            :class="[
              purchasing === addon.id || getAddonStatus(addon) === 'active'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                : 'bg-cyan-600 text-white hover:bg-cyan-700'
            ]"
          >
            <component :is="purchasing === addon.id ? RefreshCw : Plus" 
              :class="[purchasing === addon.id && 'animate-spin', 'h-4 w-4']" />
            {{ purchasing === addon.id ? 'Procesando...' : 'Adquirir' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Package class="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
        No hay add-ons disponibles
      </h3>
      <p class="text-slate-500 dark:text-slate-400">
        En este momento no hay add-ons disponibles para adquirir.
      </p>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 2;
  -moz-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
