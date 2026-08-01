<template>
  <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] p-4"
    @click.self="$emit('close')">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 overflow-hidden"
      @click.stop>
      <!-- Header -->
      <div class="p-5 pb-3 text-center">
        <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
          <PauseCircle class="w-5 h-5 text-amber-600" />
        </div>
        <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Pausar Venta</h3>
        <p class="text-[11px] text-slate-400 mt-1">
          La venta se pausará y el inventario se reservará por
          <strong class="text-slate-600">{{ ttlMinutes }} minutos</strong>
        </p>
      </div>

      <!-- Body -->
      <div class="px-5 pb-5">
        <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Referencia (opcional)
        </label>
        <input ref="aliasInput" v-model="alias"
          class="w-full px-3 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400"
          placeholder="Ej: Mesa 3, Señora de azul, Esperando pago..."
          maxlength="100"
          @keydown.enter="confirm" />

        <div class="flex items-center justify-between mt-1.5">
          <span class="text-[10px] text-slate-400">
            <span v-if="alias.trim()" class="text-emerald-600 font-semibold">Referencia personalizada</span>
            <span v-else>Se generará automáticamente</span>
          </span>
          <span class="text-[10px] text-slate-300 font-mono">{{ alias.length }}/100</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex border-t border-slate-100">
        <button @click="$emit('close')"
          class="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all rounded-bl-2xl">
          Cancelar
        </button>
        <button @click="confirm"
          class="flex-1 py-3 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 transition-all rounded-br-2xl flex items-center justify-center gap-2 uppercase tracking-wider"
          :disabled="pausing">
          <svg v-if="pausing" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{{ pausing ? 'Reservando...' : 'Pausar Venta' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PauseCircle } from 'lucide-vue-next';

const emit = defineEmits<{
  close: [];
  pause: [alias: string];
}>();

const alias = ref('');
const aliasInput = ref<HTMLInputElement | null>(null);
const pausing = ref(false);
const ttlMinutes = 20;

onMounted(() => {
  setTimeout(() => aliasInput.value?.focus(), 100);
});

async function confirm() {
  if (pausing.value) return;
  pausing.value = true;
  emit('pause', alias.value.trim());
}
</script>
