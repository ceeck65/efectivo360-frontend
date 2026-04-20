<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header Section -->
    <div class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Consola de Auditor</h1>
            <p class="text-sm text-slate-500 mt-1">
              Acceso transversal de solo lectura a todas tus cuentas fiscales
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700 rounded-full">
              Solo lectura
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Quick Access Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Facturas -->
        <RouterLink
          to="/admin/invoices"
          class="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-primary hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Receipt class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Facturas</h3>
              <p class="text-sm text-slate-500">Ver todas las facturas</p>
            </div>
          </div>
        </RouterLink>

        <!-- Ventas -->
        <RouterLink
          to="/admin/sales"
          class="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-primary hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <TrendingUp class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Ventas</h3>
              <p class="text-sm text-slate-500">Reportes de ventas</p>
            </div>
          </div>
        </RouterLink>

        <!-- Reportes -->
        <RouterLink
          to="/admin/reports"
          class="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-primary hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <BarChart3 class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Reportes</h3>
              <p class="text-sm text-slate-500">Análisis financieros</p>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Authorized Stores Section -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Tiendas Autorizadas</h2>
              <p class="text-sm text-slate-500 mt-1">
                {{ accessibleTenants.length }} tienda(s) con acceso de auditoría
              </p>
            </div>
            <!-- Search -->
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar tiendas..."
                class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary w-64"
              />
            </div>
          </div>
        </div>

        <!-- Store List -->
        <div class="divide-y divide-slate-100">
          <div
            v-for="tenant in filteredTenants"
            :key="tenant.id"
            class="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            :class="{ 'bg-brand-primary/5': tenant.is_current }"
          >
            <div class="flex items-center gap-4">
              <!-- Store Logo/Initial -->
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center text-white font-semibold">
                {{ tenant.name.charAt(0).toUpperCase() }}
              </div>

              <!-- Store Info -->
              <div>
                <div class="font-semibold text-slate-900">
                  {{ tenant.name }}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500">{{ getRoleLabel(tenant.role) }}</span>
                  <span
                    v-if="tenant.is_read_only"
                    class="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded"
                  >
                    Solo lectura
                  </span>
                  <span
                    v-if="tenant.is_current"
                    class="px-1.5 py-0.5 text-[9px] font-semibold bg-green-100 text-green-700 rounded"
                  >
                    Activo
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-400">
                    {{ tenant.slug }}
                  </span>
                  <span class="text-xs text-slate-400">•</span>
                  <span class="text-xs text-slate-400">
                    {{ tenant.access_type === 'external_access' ? 'Acceso externo' : 'Membresía' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Select Button -->
            <button
              @click="handleSelectTenant(tenant)"
              :disabled="tenant.is_current"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="[
                tenant.is_current
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-brand-primary/90'
              ]"
            >
              <Eye v-if="!tenant.is_current" class="w-4 h-4" />
              {{ tenant.is_current ? 'Seleccionado' : 'Ver' }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="filteredTenants.length === 0" class="p-12 text-center">
            <Building2 class="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No hay tiendas asignadas</h3>
            <p class="text-slate-500 max-w-sm mx-auto">
              No tienes acceso a ninguna tienda en este momento. Contacta al administrador del sistema para solicitar acceso.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Screen Loader -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSwitching"
        class="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex items-center justify-center"
      >
        <div class="text-center">
          <Loader2 class="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
          <div class="text-lg font-semibold text-slate-900 mb-2">
            Cambiando a {{ switchingToTenantName }}...
          </div>
          <div class="text-sm text-slate-500">
            Reconstruyendo tu espacio de trabajo
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Receipt, TrendingUp, BarChart3, Search, Building2, Loader2, Eye } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { useNotify } from '@/composables/useNotify';

const { fetchApi } = useApi();
const router = useRouter();
const authStore = useAuthStore();
const { success: notifySuccess, error: notifyError } = useNotify();

interface TenantAccess {
  id: string;
  ulid: string;
  name: string;
  slug: string;
  access_type: 'membership' | 'external_access';
  role: string;
  is_read_only: boolean;
  is_current: boolean;
}

const accessibleTenants = ref<TenantAccess[]>([]);
const searchQuery = ref('');
const isSwitching = ref(false);
const switchingToTenantName = ref('');

const ROLE_LABELS: Record<string, string> = {
  EXTERNAL_AUDITOR: 'Auditor',
  PROPIETARIO: 'Propietario',
  CAJERO: 'Cajero',
  SUPER_ADMIN: 'Super Admin',
};

const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role] || role;
};

const filteredTenants = computed(() => {
  if (!searchQuery.value) return accessibleTenants.value;
  const query = searchQuery.value.toLowerCase();
  return accessibleTenants.value.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.slug.toLowerCase().includes(query)
  );
});

const loadAccessibleTenants = async () => {
  try {
    const data = await fetchApi<{
      accessible_tenants: TenantAccess[];
      count: number;
      current_tenant_id: string | null;
      has_multiple_tenants: boolean;
    }>('/api/tenants/my-access/');
    accessibleTenants.value = data.accessible_tenants;
  } catch (e: any) {
    console.error('Failed to load accessible tenants:', e);
    accessibleTenants.value = [];
  }
};

const handleSelectTenant = async (tenant: TenantAccess) => {
  if (tenant.is_current) {
    return;
  }

  isSwitching.value = true;
  switchingToTenantName.value = tenant.name;

  try {
    await authStore.switchTenant(tenant.id);
    notifySuccess(`Auditando: ${tenant.name} (Solo lectura)`);
    await loadAccessibleTenants();
    window.location.reload();
  } catch (e: any) {
    console.error('Failed to switch tenant:', e);
    notifyError('Error al cambiar de tienda');
  } finally {
    isSwitching.value = false;
    switchingToTenantName.value = '';
  }
};

onMounted(() => {
  loadAccessibleTenants();
});
</script>
