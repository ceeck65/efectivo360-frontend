<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  CreditCard,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-vue-next';

// Types
interface Tenant {
  id: string;
  name: string;
  commercial_name: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  industry_type: string;
}

interface HealthMetric {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  last_check: string;
}

interface Stats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_revenue: number;
  monthly_growth: number;
}

// Composables
const authStore = useAuthStore();
const { fetchApi } = useApi();

// State
const tenants = ref<Tenant[]>([]);
const health = ref<HealthMetric[]>([]);
const stats = ref<Stats | null>(null);
const loading = ref(true);
const refreshInterval = ref<number | null>(null);

// Permission check
const user = computed(() => authStore.user);
const isStaff = computed(() => user.value?.is_staff || false);

// Load data
const loadData = async () => {
  try {
    loading.value = true;
    const [tenantsData, healthData, statsData] = await Promise.all([
      fetchApi<unknown>('/api/master/tenants/'),
      fetchApi<unknown>('/api/master/health/'),
      fetchApi<unknown>('/api/master/stats/').catch(() => null),
    ]);

    // Handle tenants data - API returns {results: [...]} or might return unexpected format
    let tenantList: Tenant[] = [];
    try {
      const tenantsResponse = tenantsData as { results?: Tenant[]; count?: number } | Tenant[];
      if (Array.isArray(tenantsResponse)) {
        tenantList = tenantsResponse;
      } else if (tenantsResponse && typeof tenantsResponse === 'object') {
        tenantList = tenantsResponse.results ?? [];
      }
    } catch (e) {
      tenantList = [];
    }
    tenants.value = tenantList;

    // Transform health data from API format to HealthMetric array
    let healthMetrics: HealthMetric[] = [];
    try {
      const apiHealth = healthData as { tenants?: unknown; users?: unknown; bcv_job?: { status?: string; last_run?: string } };
      if (apiHealth && typeof apiHealth === 'object') {
        healthMetrics = [
          {
            service: 'tenants',
            status: apiHealth.tenants ? 'healthy' : 'unhealthy',
            latency: 0,
            last_check: new Date().toISOString(),
          },
          {
            service: 'users',
            status: apiHealth.users ? 'healthy' : 'unhealthy',
            latency: 0,
            last_check: new Date().toISOString(),
          },
          {
            service: 'bcv_job',
            status: apiHealth.bcv_job?.status === 'ok' ? 'healthy' : 'degraded',
            latency: 0,
            last_check: apiHealth.bcv_job?.last_run ?? new Date().toISOString(),
          },
        ];
      }
    } catch (e) {
      healthMetrics = [];
    }
    health.value = healthMetrics;

    stats.value = statsData as Stats | null;
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

// Status helpers
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'degraded':
      return AlertCircle;
    default:
      return XCircle;
  }
};

const getStatusIconClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-emerald-500';
    case 'degraded':
      return 'text-amber-500';
    default:
      return 'text-rose-500';
  }
};

const getPlanBadgeClass = (plan: string) => {
  const variants: Record<string, string> = {
    BASIC: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    PRO: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    ENTERPRISE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };
  return variants[plan] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
};

const getHealthBadgeClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    case 'degraded':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    default:
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300';
  }
};

const getHealthLabel = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'Óptimo';
    case 'degraded':
      return 'Degradado';
    default:
      return 'Crítico';
  }
};

// Lifecycle
onMounted(() => {
  loadData();
  refreshInterval.value = window.setInterval(loadData, 60000); // Refresh every minute
});

onUnmounted(() => {
  if (refreshInterval.value) {
    window.clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div v-if="!isStaff" class="flex h-full items-center justify-center">
    <p class="text-slate-500 dark:text-slate-400">No tiene permisos para acceder a esta página.</p>
  </div>

  <div v-else class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Global</h1>
        <p class="text-slate-500 dark:text-slate-400">Panel de control del sistema ERP Efectivo 360</p>
      </div>
      <button
        @click="loadData"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.06] dark:bg-[#141824] dark:text-slate-300 dark:hover:bg-[#1a1f2e]"
      >
        <Activity class="h-4 w-4" />
        {{ loading ? 'Actualizando...' : 'Actualizar' }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Active Tenants Card -->
      <div class="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />
        <div class="p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Tiendas Activas</p>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/10 ring-1 ring-sky-500/20 dark:from-sky-400/20 dark:to-blue-600/15 dark:ring-sky-400/25">
              <Building2 class="h-4 w-4 text-sky-600 dark:text-sky-300" />
            </div>
          </div>
          <div class="mt-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ stats?.active_tenants ?? tenants.filter(t => t.is_active).length }}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">de {{ stats?.total_tenants ?? tenants.length }} totales</p>
          </div>
        </div>
      </div>

      <!-- Total Users Card -->
      <div class="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-600" />
        <div class="p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Usuarios Totales</p>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/10 ring-1 ring-indigo-500/20 dark:from-indigo-400/20 dark:to-violet-600/15 dark:ring-indigo-400/25">
              <Users class="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <div class="mt-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats?.total_users ?? '-' }}</div>
            <p class="text-xs text-slate-500 dark:text-slate-400">En todas las tiendas</p>
          </div>
        </div>
      </div>

      <!-- Monthly Revenue Card -->
      <div class="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600" />
        <div class="p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Ingresos Mensuales</p>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/10 ring-1 ring-emerald-500/20 dark:from-emerald-400/20 dark:to-teal-600/15 dark:ring-emerald-400/25">
              <DollarSign class="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
          <div class="mt-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              ${{ stats?.total_revenue?.toLocaleString() ?? '-' }}
            </div>
            <p v-if="stats?.monthly_growth" class="text-xs">
              <span :class="stats.monthly_growth >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                {{ stats.monthly_growth >= 0 ? '+' : '' }}{{ stats.monthly_growth }}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- System Health Card -->
      <div class="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
        <div class="p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Salud del Sistema</p>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500/15 to-slate-700/10 ring-1 ring-slate-400/25 dark:from-slate-500/20 dark:to-slate-700/15 dark:ring-slate-500/30">
              <Activity class="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
          <div class="mt-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ health.filter(h => h.status === 'healthy').length }}/{{ health.length }}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Servicios activos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tenants -->
    <div class="rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="border-b border-slate-200/60 p-6 dark:border-white/[0.06]">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Tiendas Recientes</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">Últimas tiendas registradas en el sistema</p>
          </div>
          <RouterLink
            to="/admin/master/tenants"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#141824] dark:text-slate-300 dark:hover:bg-[#1a1f2e]"
          >
            Ver todas
            <ArrowRight class="h-4 w-4" />
          </RouterLink>
        </div>
      </div>
      <div class="p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200/60 dark:border-white/[0.06]">
                <th class="pb-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Tienda</th>
                <th class="pb-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Plan</th>
                <th class="pb-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Industria</th>
                <th class="pb-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Estado</th>
                <th class="pb-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              <tr v-for="tenant in tenants.slice(0, 5)" :key="tenant.id" class="group">
                <td class="py-3">
                  <div class="font-medium text-slate-900 dark:text-white">{{ tenant.commercial_name || tenant.name }}</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ tenant.name }}</div>
                </td>
                <td class="py-3">
                  <span :class="['inline-flex rounded-full px-2 py-1 text-xs font-medium', getPlanBadgeClass(tenant.plan_type || 'BASIC')]">
                    {{ tenant.plan_type || 'BASIC' }}
                  </span>
                </td>
                <td class="py-3 text-sm capitalize text-slate-600 dark:text-slate-400">
                  {{ (tenant.industry_type || 'RETAIL').toLowerCase().replace('_', ' ') }}
                </td>
                <td class="py-3">
                  <span :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    tenant.is_active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  ]">
                    {{ tenant.is_active ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="py-3 text-sm text-slate-600 dark:text-slate-400">
                  {{ new Date(tenant.created_at).toLocaleDateString('es-VE') }}
                </td>
              </tr>
              <tr v-if="tenants.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay tiendas registradas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="border-b border-slate-200/60 p-6 dark:border-white/[0.06]">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Salud del Sistema</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">Estado actual de los servicios</p>
      </div>
      <div class="p-6">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="metric in health"
            :key="metric.service"
            class="flex items-center justify-between rounded-lg border border-slate-200/60 p-4 dark:border-white/[0.06]"
          >
            <div class="flex items-center gap-3">
              <component :is="getStatusIcon(metric.status)" :class="['h-5 w-5', getStatusIconClass(metric.status)]" />
              <div>
                <p class="font-medium capitalize text-slate-900 dark:text-white">{{ metric.service }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ metric.latency }}ms</p>
              </div>
            </div>
            <span :class="['inline-flex rounded-full px-2 py-1 text-xs font-medium', getHealthBadgeClass(metric.status)]">
              {{ getHealthLabel(metric.status) }}
            </span>
          </div>
          <div v-if="health.length === 0" class="col-span-full py-4 text-center text-slate-500 dark:text-slate-400">
            No hay métricas de salud disponibles
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <RouterLink to="/admin/master/currencies">
        <div class="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#141824] dark:hover:bg-[#1a1f2e]">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/10 ring-1 ring-sky-500/20 dark:from-sky-400/20 dark:to-blue-600/15 dark:ring-sky-400/25">
              <DollarSign class="h-5 w-5 text-sky-600 dark:text-sky-300" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-white">Monedas</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Gestionar monedas y pagos</p>
            </div>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/admin/master/support">
        <div class="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#141824] dark:hover:bg-[#1a1f2e]">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-600" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/10 ring-1 ring-indigo-500/20 dark:from-indigo-400/20 dark:to-violet-600/15 dark:ring-indigo-400/25">
              <Users class="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-white">Soporte</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Tickets de soporte</p>
            </div>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/admin/master/payments">
        <div class="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#141824] dark:hover:bg-[#1a1f2e]">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/10 ring-1 ring-emerald-500/20 dark:from-emerald-400/20 dark:to-teal-600/15 dark:ring-emerald-400/25">
              <CreditCard class="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-white">Pagos</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Pagos recibidos</p>
            </div>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/admin/master/plans">
        <div class="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/50 dark:border-white/[0.06] dark:bg-[#141824] dark:hover:bg-[#1a1f2e]">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500/15 to-slate-700/10 ring-1 ring-slate-400/25 dark:from-slate-500/20 dark:to-slate-700/15 dark:ring-slate-500/30">
              <TrendingUp class="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-white">Planes</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Configuración de planes</p>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
