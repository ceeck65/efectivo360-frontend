<template>
  <div class="space-y-6">
    <div><h3 class="text-base font-semibold text-slate-800">Configuración Fiscal</h3><p class="text-xs text-slate-500 mt-0.5">Alícuotas de impuestos y retenciones</p></div>
    <label class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
      <div><p class="text-sm font-medium text-slate-800">Contribuyente Especial</p><p class="text-[11px] text-slate-500">Activa retenciones de IVA</p></div>
      <button :class="['relative w-10 h-5 rounded-full transition-colors', special ? 'bg-blue-500' : 'bg-slate-300']" @click="special = !special"><span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform', special ? 'translate-x-5 left-0.5' : 'left-0.5']" /></button>
    </label>
    <div class="space-y-2"><div v-for="t in taxes" :key="t.label" class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"><span class="text-sm text-slate-700">{{ t.label }}</span><span class="text-sm font-medium text-slate-800">{{ t.rate }}%</span></div></div>
  </div>
</template>
<script setup lang="ts">import { ref } from 'vue'; const special = ref(false); const taxes = [{ label:'IVA General',rate:16 },{ label:'IVA Reducido',rate:8 },{ label:'Exento',rate:0 },{ label:'IGTF',rate:3 }];</script>
