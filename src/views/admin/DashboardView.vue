<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Monitor,
  CreditCard,
  Boxes,
  Gauge,
  Tag,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShoppingCart,
  PackageMinus,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { t } from '@/lib/navigation';
import { useApi } from '@/composables/useApi';
import StaffDashboard from './StaffDashboard.vue';

// Types
interface ShortcutTile {
  href: string;
  label: string;
  description: string;
  icon: typeof Monitor;
  disabled?: boolean;
  color?: string;
}

interface KpiData {
  accent: 'sales' | 'credits' | 'fx';
  title: string;
  value: string;
  sub: string;
  trend: number;
}

interface PendingSale {
  id: string;
  label: string;
  since: string;
  total: number;
}

interface LowStockItem {
  id: string;
  name: string;
  current: number;
  minimum: number;
}

// Composables
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { fetchApi } = useApi();

// Check if user is staff (SaaS/admin users)
const isStaff = computed(() => authStore.user?.is_staff || false);

// State
const loading = ref(true);
const salesToday = ref(0);
const salesTrend = ref(0);
const creditsReceivable = ref(0);
const creditsTrend = ref(0);
const bcvRate = ref<number | null>(null);
const bcvStatus = ref<'ok' | 'degraded'>('ok');
const bcvTrend = ref(0);
const dismissed = ref(false);

// Mock billing status
const billingStatus = ref<{ days_left: number; status: 'TRIAL' | 'PAID' | 'FREE'; is_near_expiry: boolean } | null>(null);

// Mock data
const pendingSales = ref<PendingSale[]>([
  { id: '1', label: 'Juan Pérez', since: '2h', total: 1250.50 },
  { id: '2', label: 'María García', since: '4h', total: 890.00 },
  { id: '3', label: 'Carlos López', since: '1d', total: 2340.00 },
]);

const lowStockItems = ref<LowStockItem[]>([
  { id: '1', name: 'Café Premium 500g', current: 3, minimum: 10 },
  { id: '2', name: 'Azúcar 1kg', current: 5, minimum: 15 },
  { id: '3', name: 'Leche Entera', current: 8, minimum: 20 },
]);

// Preview mode from query params
const previewRole = computed(() => route.query.previewRole as string | undefined);
const userRole = computed(() => authStore.user?.role ?? null);
const canPreview = computed(() => {
  const role = userRole.value;
  return role === 'OWNER' || role === 'FOUNDER' || authStore.user?.user_type === 'ADMIN';
});
const isPreview = computed(() => canPreview.value && previewRole.value && previewRole.value !== userRole.value);

// Exit preview
const exitPreview = () => {
  const query = { ...route.query };
  delete query.previewRole;
  router.replace({ query });
};

// KPI accent colors (matching React exactly)
const accentIcon: Record<KpiData['accent'], typeof TrendingUp> = {
  sales: TrendingUp,
  credits: HandCoins,
  fx: Gauge,
};

const accentIconShell: Record<KpiData['accent'], string> = {
  sales: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30',
  credits: 'bg-indigo-500/12 text-indigo-600 ring-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/30',
  fx: 'bg-sky-500/12 text-sky-600 ring-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
};

const accentGlow: Record<KpiData['accent'], string> = {
  sales: 'bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(16,185,129,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(52,211,153,0.12),transparent_55%)]',
  credits: 'bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(99,102,241,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(129,140,248,0.1),transparent_55%)]',
  fx: 'bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(14,165,233,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_100%_-20%,rgba(56,189,248,0.1),transparent_55%)]',
};

const accentBorder: Record<KpiData['accent'], string> = {
  sales: 'border-emerald-200/60 hover:border-emerald-400/35 hover:shadow-[0_20px_48px_-12px_rgba(16,185,129,0.18)] dark:border-emerald-500/15 dark:hover:border-emerald-400/25 dark:hover:shadow-[0_0_40px_-8px_rgba(52,211,153,0.12)]',
  credits: 'border-indigo-200/60 hover:border-indigo-400/35 hover:shadow-[0_20px_48px_-12px_rgba(99,102,241,0.16)] dark:border-indigo-500/15 dark:hover:border-indigo-400/25 dark:hover:shadow-[0_0_40px_-8px_rgba(129,140,248,0.1)]',
  fx: 'border-sky-200/60 hover:border-sky-400/35 hover:shadow-[0_20px_48px_-12px_rgba(14,165,233,0.16)] dark:border-sky-500/15 dark:hover:border-sky-400/25 dark:hover:shadow-[0_0_40px_-8px_rgba(56,189,248,0.1)]',
};

const accentTopBar: Record<KpiData['accent'], string> = {
  sales: 'from-emerald-400/90 via-teal-500/70 to-cyan-600/45',
  credits: 'from-indigo-400/85 via-violet-500/65 to-indigo-700/45',
  fx: 'from-sky-400/90 via-blue-500/70 to-indigo-600/50',
};

// KPIs data
const kpis = computed<KpiData[]>(() => [
  {
    accent: 'sales',
    title: t('backoffice.kpiSalesToday', 'Ventas hoy'),
    value: new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(salesToday.value),
    sub: t('backoffice.kpiSalesSub', 'vs. ayer'),
    trend: salesTrend.value,
  },
  {
    accent: 'credits',
    title: t('backoffice.kpiCredits', 'Créditos pendientes'),
    value: new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(creditsReceivable.value),
    sub: t('backoffice.kpiCreditsSub', 'CxC total'),
    trend: creditsTrend.value,
  },
  {
    accent: 'fx',
    title: t('backoffice.kpiBcv', 'Tasa BCV'),
    value: bcvRate.value != null ? `${bcvRate.value.toFixed(2)} VES` : '—',
    sub: bcvStatus.value === 'degraded' ? t('backoffice.kpiBcvDegraded', 'Actualizando...') : t('backoffice.kpiBcvSub', 'Oficial'),
    trend: bcvTrend.value,
  },
]);

// Shortcuts data
const shortcuts = computed<ShortcutTile[]>(() => [
  { href: '/admin/pos', label: t('dashboard.shortcut.pos', 'Caja registradora'), description: t('dashboard.shortcut.posDesc', 'Venta rápida con teclado táctil y tickets.'), icon: Monitor },
  { href: '/admin/billing', label: t('dashboard.shortcut.billing', 'Facturación'), description: t('dashboard.shortcut.billingDesc', 'Emite facturas y controla pagos.'), icon: CreditCard },
  { href: '/admin/inventory', label: t('dashboard.shortcut.inventory', 'Inventario'), description: t('dashboard.shortcut.inventoryDesc', 'Precios, stock y catálogo.'), icon: Boxes },
  { href: '/admin/exchange-rates', label: t('dashboard.shortcut.exchangeRates', 'Tasas de Cambio'), description: t('dashboard.shortcut.exchangeRatesDesc', 'Actualiza tasa USD/VES.'), icon: Gauge },
  { href: '/admin/receivables', label: t('dashboard.shortcut.receivables', 'Cuentas por Cobrar'), description: t('dashboard.shortcut.receivablesDesc', 'Gestion de cobranza y saldos.'), icon: Tag },
  { href: '/admin/customers', label: t('dashboard.shortcut.customers', 'Clientes'), description: t('dashboard.shortcut.customersDesc', 'Listado y gestion de clientes.'), icon: Users },
  { href: '/admin/team', label: t('dashboard.shortcut.team', 'Gestion de Equipo'), description: t('dashboard.shortcut.teamDesc', 'Crea y administra usuarios.'), icon: BarChart3 },
  { href: '/admin/settings', label: t('dashboard.shortcut.settings', 'Licencia y Modulos'), description: t('dashboard.shortcut.settingsDesc', 'Activa o desactiva modulos.'), icon: Settings },
]);

// Shortcut colors
const shortcutTopBar = [
  'from-sky-400 via-blue-500 to-indigo-600',
  'from-indigo-400 via-violet-500 to-purple-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-slate-400 via-slate-500 to-slate-600',
];

const shortcutIconRing = [
  'from-sky-500/20 to-blue-600/10 text-sky-600 ring-sky-500/20 dark:from-sky-400/20 dark:to-blue-600/15 dark:text-sky-300 dark:ring-sky-400/25',
  'from-indigo-500/20 to-violet-600/10 text-indigo-600 ring-indigo-500/20 dark:from-indigo-400/20 dark:to-violet-600/15 dark:text-indigo-300 dark:ring-indigo-400/25',
  'from-emerald-500/20 to-teal-600/10 text-emerald-700 ring-emerald-500/20 dark:from-emerald-400/20 dark:to-teal-600/15 dark:text-emerald-300 dark:ring-emerald-400/25',
  'from-slate-500/15 to-slate-700/10 text-slate-700 ring-slate-400/25 dark:from-slate-500/20 dark:to-slate-700/15 dark:text-slate-300 dark:ring-slate-500/30',
];

// Sale avatar gradient based on ID
const hueFromId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const base = 200 + (Math.abs(h) % 56);
  return { h1: base, h2: (base + 18) % 360 };
};

// Load dashboard data
const loadDashboardData = async () => {
  loading.value = true;
  try {
    const forexData = await fetchApi<{ rate: number; status: 'ok' | 'degraded' }>('/api/v1/forex/rate/');
    if (forexData) {
      bcvRate.value = forexData.rate;
      bcvStatus.value = forexData.status;
    }
    salesToday.value = 1250.50;
    salesTrend.value = 5.2;
    creditsReceivable.value = 3450.00;
    creditsTrend.value = -2.1;
    bcvTrend.value = 0.5;
    billingStatus.value = { days_left: 7, status: 'TRIAL', is_near_expiry: true };
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <!-- Staff Dashboard for SaaS/admin users -->
  <StaffDashboard v-if="isStaff" />

  <!-- Regular Dashboard for tenant users -->
  <div v-else class="space-y-5 md:space-y-6">
    <!-- Preview Mode Banner -->
    <div
      v-if="isPreview"
      class="flex items-center justify-between rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/30 dark:text-amber-50"
    >
      <div>{{ t('dashboard.preview', 'Previsualizando como') }} <strong>{{ previewRole }}</strong></div>
      <button type="button" @click="exitPreview" class="rounded-xl border border-amber-600/40 px-3 py-1 text-xs font-semibold dark:border-amber-300/40">
        {{ t('dashboard.previewExit', 'Salir de previsualización') }}
      </button>
    </div>

    <!-- Subscription Alert Banner -->
    <div
      v-if="billingStatus && !dismissed"
      :class="[
        'relative rounded-lg border px-4 py-3 shadow-sm',
        billingStatus.is_near_expiry || billingStatus.days_left <= 3
          ? 'bg-red-50 border-red-200 text-red-800'
          : billingStatus.days_left <= 7
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
      ]"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle v-if="billingStatus.is_near_expiry || billingStatus.days_left <= 3" class="mt-0.5 h-5 w-5 flex-shrink-0" />
        <Clock v-else class="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-sm font-medium">
            {{ billingStatus.is_near_expiry 
              ? (billingStatus.days_left === 1 ? 'Tu suscripción vence mañana. ¡Renueva ahora para no perder el acceso!' : `Tu suscripción vence en ${billingStatus.days_left} días. ¡Renueva ahora!`)
              : `Tu prueba termina en ${billingStatus.days_left} días. ¡No pierdas el acceso!` 
            }}
          </p>
          <p class="mt-1 text-xs opacity-90">Activa tu plan para continuar usando todas las funciones de Efectivo 360.</p>
          <button class="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-white/80 hover:bg-white transition-colors border border-current shadow-sm">
            <CreditCard class="h-3.5 w-3.5" />
            Ver planes de pago
          </button>
        </div>
        <button @click="dismissed = true" class="rounded p-1 hover:bg-black/5 transition-colors" aria-label="Cerrar alerta">
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Welcome Section -->
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
        {{ t('dashboard.welcome', '¿Qué deseas hacer hoy?') }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('backoffice.subtitle', 'Resumen ejecutivo de inventario y facturación.') }}</p>
    </div>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="kpi in kpis"
        :key="kpi.title"
        :class="[
          'group relative flex flex-col justify-between overflow-hidden rounded-[12px] border p-5 backdrop-blur-xl transition-all duration-300',
          'bg-gradient-to-br from-white via-white to-slate-50/80 dark:from-[#131722] dark:via-[#10141d] dark:to-[#0c0f16]',
          'hover:-translate-y-0.5',
          accentBorder[kpi.accent]
        ]"
      >
        <!-- Top accent bar -->
        <div :class="['pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95', accentTopBar[kpi.accent]]" />
        <!-- Glow effect -->
        <div :class="['pointer-events-none absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100', accentGlow[kpi.accent]]" />
        <div class="relative z-[2] space-y-3">
          <div class="flex items-start justify-between gap-3">
            <p class="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ kpi.title }}</p>
            <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', accentIconShell[kpi.accent]]" aria-hidden>
              <component :is="accentIcon[kpi.accent]" class="h-[18px] w-[18px]" stroke-width="1.5" />
            </div>
          </div>
          <div class="flex items-end justify-between gap-2">
            <p class="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">{{ loading ? '—' : kpi.value }}</p>
            <!-- Trend Badge -->
            <span v-if="!loading" class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              :class="kpi.trend > 0 ? 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-500/12 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'">
              <ArrowUpRight v-if="kpi.trend > 0" class="h-3 w-3" stroke-width="1.5" />
              <ArrowDownRight v-else-if="kpi.trend < 0" class="h-3 w-3" stroke-width="1.5" />
              <Minus v-else class="h-3 w-3" stroke-width="1.5" />
              {{ Math.abs(kpi.trend).toFixed(1) }}%
            </span>
          </div>
          <p v-if="kpi.sub" class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">{{ kpi.sub }}</p>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
      <!-- Sales Area Chart -->
      <div class="min-h-0 lg:col-span-8">
        <div class="relative overflow-hidden rounded-[12px] border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_60px_-20px_rgba(14,165,233,0.15)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(56,189,248,0.1),0_28px_60px_-20px_rgba(0,0,0,0.6)] flex h-full min-h-[300px] flex-col">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-sky-400/90 via-blue-500/70 to-indigo-600/50" />
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(14,165,233,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.07),transparent_55%)]" />
          <div class="relative z-[2] mb-4 flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 ring-1 ring-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30" aria-hidden>
              <TrendingUp class="h-[18px] w-[18px] stroke-[1.5]" />
            </div>
            <div>
              <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('backoffice.chartTitle', 'Ventas últimos 30 días') }}</h3>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ t('backoffice.chartSubtitle', 'Comparativa diaria') }}</p>
            </div>
          </div>
          <div class="relative z-[2] flex flex-1 items-end justify-around px-2">
            <div v-for="i in 12" :key="i" class="w-8 rounded-t-sm bg-gradient-to-t from-sky-500/80 to-sky-300/60 dark:from-sky-600 dark:to-sky-400" :style="{ height: `${20 + (i * 5) % 60}%`, opacity: 0.6 + (i % 4) * 0.1 }" />
          </div>
        </div>
      </div>

      <!-- Pending Sales Widget -->
      <div class="min-h-0 lg:col-span-4">
        <div class="relative overflow-hidden rounded-[12px] border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_50px_-18px_rgba(245,158,11,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(251,191,36,0.08),0_28px_55px_-18px_rgba(0,0,0,0.55)] flex h-full min-h-[240px] flex-col">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-amber-400/85 via-orange-500/60 to-amber-700/40" />
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(251,191,36,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(251,191,36,0.07),transparent_48%)]" />
          <div class="relative z-[2] mb-3 flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/30" aria-hidden>
              <ShoppingCart class="h-[18px] w-[18px] stroke-[1.5]" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('backoffice.pendingTitle', 'Ventas pendientes') }}</h3>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ t('backoffice.pendingSubtitle', 'Por cobrar') }}</p>
            </div>
          </div>
          <ul class="relative z-[2] flex flex-1 flex-col gap-2 overflow-auto pr-0.5">
            <li v-for="sale in pendingSales" :key="sale.id" class="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2.5 transition-colors hover:border-amber-200/80 hover:bg-amber-50/40 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-amber-500/20 dark:hover:bg-amber-500/[0.06]">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-inner ring-2 ring-sky-500/20" :style="{ background: `linear-gradient(135deg, hsl(${hueFromId(sale.id).h1}, 45%, 38%), hsl(${hueFromId(sale.id).h2}, 42%, 28%))` }">
                {{ sale.label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900 dark:text-white">{{ sale.label }}</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Hace {{ sale.since }}</p>
              </div>
              <span class="shrink-0 tabular-nums text-xs font-semibold text-sky-600 dark:text-sky-300">{{ new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(sale.total) }}</span>
            </li>
            <li v-if="pendingSales.length === 0" class="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 py-8 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
              Sin ventas en espera
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Low Stock Widget -->
    <div class="relative overflow-hidden rounded-[12px] border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_50px_-18px_rgba(239,68,68,0.1)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(248,113,113,0.08),0_28px_55px_-18px_rgba(0,0,0,0.55)] flex h-full flex-col">
      <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-amber-400/85 via-orange-500/60 to-amber-700/40" />
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_0%_0%,rgba(251,113,133,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_50%_at_0%_0%,rgba(248,113,113,0.08),transparent_50%)]" />
      <div class="relative z-[2] mb-3 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/30" aria-hidden>
          <PackageMinus class="h-[18px] w-[18px] stroke-[1.5]" />
        </div>
        <div>
          <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{{ t('backoffice.lowStockTitle', 'Stock bajo') }}</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ t('backoffice.lowStockSubtitle', 'Productos por agotarse') }}</p>
        </div>
      </div>
      <div class="relative z-[2] grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in lowStockItems.slice(0, 6)" :key="item.id" class="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-2.5 transition-colors hover:border-rose-200/90 hover:bg-rose-50/30 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-rose-500/25 dark:hover:bg-rose-500/[0.05]">
          <!-- Circular Gauge -->
          <div class="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <svg class="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="3" class="text-slate-200 dark:text-slate-700" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" :stroke-dasharray="`${Math.min(100, (item.current / Math.max(item.minimum, 1)) * 100) * 1.005} 101`" class="text-rose-500 dark:text-rose-400" />
            </svg>
            <span class="absolute text-[9px] font-semibold text-slate-700 dark:text-slate-300">{{ Math.round((item.current / Math.max(item.minimum, 1)) * 100) }}%</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium leading-tight text-slate-900 dark:text-white">{{ item.name }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">{{ item.current }} / mín. {{ item.minimum }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Access Shortcuts -->
    <div>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">{{ t('backoffice.quickAccess', 'Accesos rápidos') }}</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <RouterLink
          v-for="(shortcut, i) in shortcuts"
          :key="shortcut.href"
          :to="shortcut.href"
          :class="[
            'group relative h-full overflow-hidden rounded-[12px] border p-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.15)] backdrop-blur-xl transition-all duration-300',
            'bg-gradient-to-br from-white via-white to-slate-50/90 dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.05),0_20px_50px_-18px_rgba(0,0,0,0.5)]',
            shortcut.disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:border-sky-300/50 hover:shadow-[0_24px_50px_-12px_rgba(14,165,233,0.2)] dark:hover:border-sky-500/25'
          ]"
        >
          <div :class="['pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-90', shortcutTopBar[i % 4]]" />
          <div :class="['absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100', shortcut.color ?? 'bg-gradient-to-br from-sky-500/[0.06] via-transparent to-transparent dark:from-sky-400/[0.08]']" />
          <div class="relative flex items-start gap-3 pt-0.5">
            <div :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset', shortcutIconRing[i % 4]]">
              <component :is="shortcut.icon" class="h-[18px] w-[18px] stroke-[1.5]" />
            </div>
            <div class="min-w-0 space-y-1">
              <p class="font-semibold leading-snug tracking-tight text-slate-900 dark:text-white">{{ shortcut.label }}</p>
              <p class="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{{ shortcut.description }}</p>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
