<template>
  <div class="space-y-6">
    <div><h3 class="text-base font-semibold text-slate-800">Gestión Monetaria</h3><p class="text-xs text-slate-500 mt-0.5">Configura las monedas aceptadas en tu tienda</p></div>
    <div class="space-y-3">
      <label v-for="c in currencies" :key="c.code" class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
        <div class="flex items-center gap-3"><span class="text-lg">{{ c.flag }}</span><div><p class="text-sm font-medium text-slate-800">{{ c.name }}</p><p class="text-[10px] text-slate-400">{{ c.code }}</p></div></div>
        <button @click="c.active = !c.active" :class="['relative w-10 h-5 rounded-full transition-colors', c.active ? 'bg-emerald-500' : 'bg-slate-300']">
          <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform', c.active ? 'translate-x-5 left-0.5' : 'left-0.5']" />
        </button>
      </label>
    </div>
    <div class="flex justify-end"><button class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500">Guardar Monedas</button></div>
  </div>
</template>
<script setup lang="ts">import { ref } from 'vue'; const currencies = ref([{ code:'VES',name:'Bolívares',flag:'🇻🇪',active:true},{ code:'USD',name:'Dólares',flag:'🇺🇸',active:true},{ code:'COP',name:'Pesos Colombianos',flag:'🇨🇴',active:false}]);</script>
