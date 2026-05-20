<script setup lang="ts">
import { ref } from 'vue';
import { CreditCard, Wallet, Building2 } from 'lucide-vue-next';
import PaymentBlueprintsDashboard from '@/modules/vaults/views/PaymentBlueprintsDashboard.vue';
import VaultTemplatesSection from './sections/VaultTemplatesSection.vue';
import BankEntitiesSection from './sections/BankEntitiesSection.vue';

const tabs = [
  { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
  { id: 'vaults', label: 'Plantillas de Bóveda', icon: Wallet },
  { id: 'banks', label: 'Entidades Bancarias', icon: Building2 },
] as const;
const activeTab = ref<typeof tabs[number]['id']>('payments');
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-[#0D0F14]">
    <!-- Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] px-6">
      <div class="max-w-7xl mx-auto flex gap-1">
        <button
          v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="['px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
            activeTab === tab.id ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300']">
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <PaymentBlueprintsDashboard v-if="activeTab === 'payments'" />
    <div v-else class="p-6 max-w-7xl mx-auto">
      <VaultTemplatesSection v-if="activeTab === 'vaults'" />
      <BankEntitiesSection v-if="activeTab === 'banks'" />
    </div>
  </div>
</template>
