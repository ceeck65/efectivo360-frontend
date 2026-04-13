<template>
  <div v-if="isVisible" class="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center relative overflow-hidden z-50 fixed inset-0">
    <!-- Subtle gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#007BFF]/5 via-transparent to-[#00D492]/5" />

    <!-- Animated background orbs -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-[#007BFF]/10 rounded-full blur-3xl animate-pulse" />
    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#00D492]/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s" />

    <div class="relative z-10 flex flex-col items-center">
      <!-- Logo with breathing animation -->
      <div class="relative mb-8 animate-breathe">
        <!-- Outer glow ring -->
        <div class="absolute inset-0 rounded-full bg-gradient-to-r from-[#007BFF] to-[#00D492] blur-xl opacity-40" />

        <!-- Logo container -->
        <div class="relative w-24 h-24 rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/assets/efectivo360/logo-mark.svg"
            alt="Efectivo 360"
            class="w-20 h-20 object-contain"
          />
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-48 h-1 bg-white/10 rounded-full overflow-hidden mb-6">
        <div
          class="h-full bg-gradient-to-r from-[#007BFF] to-[#00D492] rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        />
      </div>

      <!-- Loading text -->
      <p class="text-white/70 text-sm font-medium tracking-wide animate-pulse-text">
        Sincronizando tu comercio...
      </p>
    </div>
  </div>

  <!-- Slot content rendered when splash is hidden -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isVisible = ref(true);
const progress = ref(0);

const emit = defineEmits<{
  complete: [];
}>();

onMounted(() => {
  // Simulate loading progress
  const interval = setInterval(() => {
    progress.value += Math.random() * 15;
    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(interval);
      // Hide splash after a brief delay at 100%
      setTimeout(() => {
        isVisible.value = false;
        emit('complete');
      }, 300);
    }
  }, 200);
});
</script>

<style scoped>
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.animate-breathe {
  animation: breathe 2s ease-in-out infinite;
}

.animate-pulse-text {
  animation: pulse-text 2s ease-in-out infinite;
}
</style>
