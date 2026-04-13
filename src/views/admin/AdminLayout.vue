<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
// import { useRoute } from 'vue-router';
import Sidebar from '@/components/sidebar/Sidebar.vue';
import BackofficeHeader from '@/components/header/BackofficeHeader.vue';
import EfiChatWidget from '@/components/efi/EfiChatWidget.vue';
// import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

interface ForexRateResponse {
  rate: number;
  currency: string;
  source: string;
  status: 'ok' | 'degraded';
  updated_at: string;
  last_success_at: string;
}

// const route = useRoute();
// const authStore = useAuthStore();
const { fetchApi } = useApi();

// Sidebar state
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

// Forex rate
const forexRate = ref<ForexRateResponse | null>(null);

// Sidebar width calculation (same as React: 224px expanded, 56px collapsed)
const sidebarWidth = computed(() => (isSidebarCollapsed.value ? 56 : 224));

// Load sidebar collapsed state from localStorage
onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('erp.sidebarCollapsed');
    if (saved !== null) {
      isSidebarCollapsed.value = saved === 'true';
    }
    loadForexRate();
  }
});

// Persist sidebar collapsed state
watch(isSidebarCollapsed, (newValue) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('erp.sidebarCollapsed', String(newValue));
  }
});

// Load forex rate
const loadForexRate = async () => {
  try {
    const data = await fetchApi<ForexRateResponse>('/api/v1/forex/rate/');
    forexRate.value = data;
  } catch {
    // silent
  }
};

// Refresh forex rate every 5 minutes
onMounted(() => {
  const interval = window.setInterval(loadForexRate, 5 * 60 * 1000);
  return () => window.clearInterval(interval);
});

const handleOpenSidebar = () => {
  isSidebarOpen.value = true;
};

const handleCloseSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<template>
  <div class="relative flex min-h-screen bg-brand-light text-slate-900 dark:bg-[#0A0A0B] dark:text-slate-100">
    <!-- Background Effects (Dark Mode Only) -->
    <div
      class="pointer-events-none fixed inset-0 z-0 hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,112,243,0.1),transparent)] dark:block"
      aria-hidden
    />
    <div
      class="pointer-events-none fixed bottom-0 left-1/2 z-0 hidden h-96 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.05),transparent_70%)] dark:block"
      aria-hidden
    />

    <!-- Sidebar -->
    <Sidebar
      :is-open="isSidebarOpen"
      @close="handleCloseSidebar"
      v-model:is-collapsed="isSidebarCollapsed"
      variant="glass"
    />

    <!-- Main Content Area -->
    <div
      class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 lg:ml-0"
      :style="{ marginLeft: `${sidebarWidth}px` }"
    >
      <!-- Header (Fixed) -->
      <BackofficeHeader
        :on-open-sidebar="handleOpenSidebar"
        :forex-rate="forexRate"
      />

      <!-- Main Content (Scrollable) -->
      <main class="backoffice-shell flex-1 overflow-y-auto space-y-6 px-4 py-5 md:px-6 md:py-6">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>

    <!-- Efi Chat Widget -->
    <EfiChatWidget />
  </div>
</template>

<style>
/* Heading styles matching React */
.backoffice-shell :deep(h1) {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: #0f172a;
}

.dark .backoffice-shell :deep(h1) {
  color: #ffffff;
}
</style>
