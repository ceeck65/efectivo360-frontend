<template>
  <div class="relative">
    <!-- Trigger Button - Show if user has multiple tenants -->
    <button
      v-if="memberships && memberships.length > 0"
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
      :class="{ 'ring-2 ring-brand-primary/20': isOpen }"
    >
      <!-- Current Tenant Logo -->
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
        <span>{{ (currentTenant?.name || 'Tienda').charAt(0).toUpperCase() }}</span>
      </div>

      <!-- Tenant Name -->
      <div class="text-left">
        <div class="text-xs text-slate-500 font-medium">
          {{ currentTenant?.is_read_only ? 'Auditando' : 'Tienda Actual' }}
        </div>
        <div class="text-sm font-semibold text-slate-900 truncate max-w-[150px]">
          {{ currentTenant?.name || 'Seleccionar...' }}
        </div>
      </div>

      <!-- Read-Only Badge -->
      <span
        v-if="currentTenant?.is_read_only"
        class="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full"
      >
        Solo lectura
      </span>

      <!-- Chevron -->
      <ChevronDown
        class="w-4 h-4 text-slate-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
      >
        <!-- Search (if more than 5 tenants) -->
        <div v-if="memberships.length > 5" class="p-3 border-b border-slate-100">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar tiendas..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </div>

        <!-- Tenant List -->
        <div class="max-h-[300px] overflow-y-auto">
          <div
            v-for="membership in filteredMemberships"
            :key="membership.id"
            @click="handleSelectTenant(membership)"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
            :class="{ 'bg-brand-primary/5': membership.is_current }"
          >
            <!-- Tenant Logo -->
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
              <span>{{ membership.name.charAt(0).toUpperCase() }}</span>
            </div>

            <!-- Tenant Info -->
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-slate-900 truncate">
                {{ membership.name }}
              </div>
              <div class="flex items-center gap-2">
                <div class="text-xs text-slate-500">
                  {{ getRoleLabel(membership.role) }}
                </div>
                <!-- Read-Only Badge -->
                <span
                  v-if="membership.is_read_only"
                  class="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded"
                >
                  Solo lectura
                </span>
              </div>
            </div>

            <!-- Checkmark for current -->
            <Check
              v-if="membership.is_current"
              class="w-5 h-5 text-brand-primary flex-shrink-0"
            />
          </div>

          <!-- Empty State -->
          <div v-if="filteredMemberships.length === 0" class="px-4 py-8 text-center text-slate-500 text-sm">
            No se encontraron tiendas
          </div>
        </div>

        <!-- Create New Tenant Button (only for non-auditor users) -->
        <div v-if="!currentTenant?.is_read_only" class="p-3 border-t border-slate-100 bg-slate-50">
          <RouterLink
            to="/wizard/shop"
            @click="toggleDropdown"
            class="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
          >
            <Plus class="w-4 h-4" />
            Crear Nueva Tienda
          </RouterLink>
        </div>
      </div>
    </Transition>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ChevronDown, Search, Check, Plus, Loader2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { useNotify } from '@/composables/useNotify';

const { fetchApi } = useApi();
const authStore = useAuthStore();
const { success: notifySuccess, error: notifyError } = useNotify();

interface TenantMembership {
  id: string;
  ulid: string;
  name: string;
  slug: string;
  access_type: 'membership' | 'external_access';
  role: string;
  is_read_only: boolean;
  is_current: boolean;
}

const isOpen = ref(false);
const memberships = ref<TenantMembership[]>([]);
const searchQuery = ref('');
const isSwitching = ref(false);
const switchingToTenantName = ref('');

const ROLE_LABELS: Record<string, string> = {
  FOUNDER: 'Fundador',
  OWNER: 'Propietario',
  MANAGER: 'Gerente',
  SALES_CLERK: 'Cajero',
  WAREHOUSE: 'Almacén',
  EXTERNAL_AUDITOR: 'Auditor',
  CAJERO: 'Cajero',
  PROPIETARIO: 'Propietario',
  SUPER_ADMIN: 'Super Admin',
};

const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role] || role;
};

const currentTenant = computed(() => {
  return memberships.value.find(m => m.is_current) || memberships.value[0];
});

const filteredMemberships = computed(() => {
  if (!searchQuery.value) return memberships.value;
  const query = searchQuery.value.toLowerCase();
  return memberships.value.filter(m =>
    m.name.toLowerCase().includes(query) ||
    m.slug.toLowerCase().includes(query)
  );
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const loadMemberships = async () => {
  try {
    // Use new endpoint that supports both UserTenantMembership and UserTenantAccess
    const data = await fetchApi<{
      accessible_tenants: TenantMembership[];
      count: number;
      current_tenant_id: string | null;
      has_multiple_tenants: boolean;
    }>('/api/tenants/my-access/');
    memberships.value = data.accessible_tenants;
  } catch (e: any) {
    console.error('Failed to load accessible tenants:', e);
    // If user has no access (e.g., superadmin without tenant), handle gracefully
    memberships.value = [];
  }
};

const handleSelectTenant = async (membership: TenantMembership) => {
  if (membership.is_current) {
    isOpen.value = false;
    return;
  }

  isSwitching.value = true;
  switchingToTenantName.value = membership.name;
  isOpen.value = false;

  try {
    // Use switch-tenant endpoint which now supports UserTenantAccess
    await authStore.switchTenant(membership.id);
    
    // Show read-only warning for external auditors
    if (membership.is_read_only) {
      notifySuccess(`Auditando: ${membership.name} (Solo lectura)`);
    } else {
      notifySuccess(`Ahora estás operando en ${membership.name}`);
    }
    
    await loadMemberships(); // Reload to update is_current flags
  } catch (e: any) {
    console.error('Failed to switch tenant:', e);
    notifyError('Error al cambiar de tienda');
  } finally {
    isSwitching.value = false;
    switchingToTenantName.value = '';
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    isOpen.value = false;
  }
};

onMounted(() => {
  loadMemberships();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
