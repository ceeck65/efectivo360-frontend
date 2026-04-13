<template>
  <div class="min-h-screen py-24 px-4">
    <div class="mx-auto max-w-6xl">
      <h1 class="text-center text-4xl font-bold text-white sm:text-5xl">
        {{ isSpanish ? 'Planes y Precios' : 'Plans & Pricing' }}
      </h1>
      <p class="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-400">
        {{ isSpanish 
          ? 'Elige el plan que mejor se adapte a tus necesidades.' 
          : 'Choose the plan that best fits your needs.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const lang = computed(() => route.params.lang as 'es' | 'en');
const isSpanish = computed(() => lang.value === 'es');
</script>
