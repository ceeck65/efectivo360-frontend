<template>
  <div class="min-h-screen bg-slate-50">
    <div class="flex flex-col lg:flex-row">
      <!-- Mobile tab selector -->
      <div class="lg:hidden overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
        <div class="flex gap-1 whitespace-nowrap">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            :class="activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'">
            <component :is="tab.icon" class="w-3.5 h-3.5 inline mr-1" />
            {{ tab.shortLabel || tab.label }}
          </button>
        </div>
      </div>

      <!-- Desktop sidebar -->
      <aside class="hidden lg:block w-56 shrink-0 bg-white border-r border-slate-200 min-h-screen">
        <div class="px-4 py-5 border-b border-slate-100">
          <h2 class="text-sm font-semibold text-slate-800">Configuración</h2>
          <p class="text-[11px] text-slate-500 mt-0.5">{{ storeName || 'Mi Negocio' }}</p>
        </div>
        <nav class="p-3 space-y-0.5">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left"
            :class="activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'">
            <component :is="tab.icon" class="w-4 h-4 shrink-0" :class="activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'" />
            {{ tab.label }}
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0 p-4 lg:p-6 space-y-5">
        <!-- Header + KPIs -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 class="text-lg font-semibold text-slate-800">{{ storeName || 'Consola de Negocio' }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Configuración general de tu tienda</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-medium"
              :class="storeActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
              {{ storeActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <!-- KPIs -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div v-for="kpi in kpis" :key="kpi.label" class="text-center">
              <p class="text-2xl font-semibold text-slate-800">{{ kpi.value }}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ kpi.label }}</p>
            </div>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <TabBusinessInfo v-if="activeTab === 'info'" />
          <TabBusinessProfile v-if="activeTab === 'profile'" />
          <TabMonetaryMgmt v-if="activeTab === 'monetary'" />
          <TabFiscalConfig v-if="activeTab === 'fiscal'" />
          <TabTechnicalConfig v-if="activeTab === 'technical'" />
          <TabPrintPersonalization v-if="activeTab === 'print'" />
          <TabRolesPermissions v-if="activeTab === 'roles'" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Building2, Store, Wallet, Receipt, Monitor, Printer, Shield } from 'lucide-vue-next';
import TabBusinessInfo from './TabBusinessInfo.vue';
import TabBusinessProfile from './TabBusinessProfile.vue';
import TabMonetaryMgmt from './TabMonetaryMgmt.vue';
import TabFiscalConfig from './TabFiscalConfig.vue';
import TabTechnicalConfig from './TabTechnicalConfig.vue';
import TabPrintPersonalization from './TabPrintPersonalization.vue';
import TabRolesPermissions from './TabRolesPermissions.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const storeName = computed(() => auth.user?.tenant_name || auth.user?.tenant_commercial_name || '');
const storeActive = computed(() => auth.user?.tenant_is_configured || false);

const activeTab = ref('info');

const tabs = [
  { id: 'info', label: 'Información', shortLabel: 'Info', icon: Building2 },
  { id: 'profile', label: 'Perfil y Rubros', shortLabel: 'Rubros', icon: Store },
  { id: 'monetary', label: 'Monedas', shortLabel: 'Monedas', icon: Wallet },
  { id: 'fiscal', label: 'Fiscal', shortLabel: 'Fiscal', icon: Receipt },
  { id: 'technical', label: 'Técnico', shortLabel: 'Técnico', icon: Monitor },
  { id: 'print', label: 'Impresión', shortLabel: 'Impresión', icon: Printer },
  { id: 'roles', label: 'Equipo', shortLabel: 'Equipo', icon: Shield },
];

const kpis = [
  { label: 'Perfil', value: '85%' },
  { label: 'Monedas', value: '2' },
  { label: 'Usuarios', value: '3' },
  { label: 'Fiscal', value: 'OK' },
];
</script>
