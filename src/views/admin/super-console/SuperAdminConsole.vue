<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Shield class="h-8 w-8 text-cyan-500" />
          Consola de Super-Admin
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona la infraestructura de Efectivo 360: tipos de negocio, categorías y blueprints.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="loadAllData"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Recargar
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Blueprints"
        :value="blueprintCount"
        icon="Building2"
        color="cyan"
      />
      <StatsCard
        title="Categorías"
        :value="categoryCount"
        icon="Boxes"
        color="emerald"
      />
      <StatsCard
        title="Atributos"
        :value="attributeCount"
        icon="FileCode"
        color="purple"
      />
      <StatsCard
        title="Tenants"
        :value="tenantCount"
        icon="Building"
        color="amber"
      />
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06]">
      <nav class="flex gap-8 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
          :class="activeTab === tab.id
            ? 'border-brand-primary text-brand-primary'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'"
        >
          <component :is="tab.icon" class="w-4 h-4 inline-block mr-2" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Sections -->
    <BlueprintsSection v-if="activeTab === 'blueprints'" />
    <CategoriesSection v-if="activeTab === 'categories'" />
    <PlansSection v-if="activeTab === 'plans'" />
    <ModulesSection v-if="activeTab === 'modules'" />
    <AddonsSection v-if="activeTab === 'addons'" />
    <AttributesSection v-if="activeTab === 'attributes'" />
    <BlueprintConfigSection v-if="activeTab === 'blueprint-config'" />
    <BrandManageView v-if="activeTab === 'brands'" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Shield, Building2, Boxes, RefreshCw, CreditCard, Target, Package, Settings, FileCode, Tag } from 'lucide-vue-next';
import BlueprintsSection from './components/BlueprintsSection.vue';
import CategoriesSection from './components/CategoryTreeView.vue';
import PlansSection from './components/PlansSection.vue';
import AddonsSection from './components/AddonsSection.vue';
import ModulesSection from './components/ModulesSection.vue';
import AttributesSection from './components/AttributesSection.vue';
import BlueprintConfigSection from './components/BlueprintConfigSection.vue';
import BrandManageView from './components/BrandManagementView.vue';
import StatsCard from './components/StatsCard.vue';
import { useApi } from '@/composables/useApi';

const { fetchApi } = useApi();

const loading = ref(false);
const activeTab = ref<string>('blueprints');
const tenantCount = ref(0);
const blueprintCount = ref(0);
const categoryCount = ref(0);
const attributeCount = ref(0);

const tabs = [
  { id: 'blueprints', label: 'Tipos de Negocio', icon: Building2 },
  { id: 'categories', label: 'Categorías Inteligentes', icon: Boxes },
  { id: 'plans', label: 'Planes', icon: CreditCard },
  { id: 'modules', label: 'Módulos', icon: Package },
  { id: 'addons', label: 'Add-ons', icon: Target },
  { id: 'attributes', label: 'Atributos', icon: FileCode },
  { id: 'blueprint-config', label: 'Panel de Blueprints', icon: Settings },
  { id: 'brands', label: 'Marcas', icon: Tag },
];

async function loadAllData() {
  loading.value = true;
  try {
    const [bp, cat, attr, tenants] = await Promise.all([
      fetchApi<{ count: number }>('/api/v1/industry-blueprints/'),
      fetchApi<{ count: number }>('/api/v1/categories/'),
      fetchApi<{ count: number }>('/api/v1/admin/master-attributes/'),
      fetchApi<{ count: number }>('/api/v1/tenants/'),
    ]);
    blueprintCount.value = bp.count || 0;
    categoryCount.value = cat.count || 0;
    attributeCount.value = attr.count || 0;
    tenantCount.value = tenants.count || 0;
  } catch (e) {
    console.error('Error loading stats:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadAllData);
</script>