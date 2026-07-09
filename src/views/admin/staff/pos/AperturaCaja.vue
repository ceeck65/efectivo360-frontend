<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-300 shadow-lg shadow-blue-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Apertura de Caja</h1>
        <p class="text-sm text-blue-200/70 mt-1.5 font-medium">Selecciona la caja e ingresa el fondo inicial</p>
      </div>

      <div v-if="cajaStore.loading && cajaStore.terminales.length === 0"
        class="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-blue-200/60">Cargando cajas...</p>
      </div>

      <div v-else-if="cajaStore.error && cajaStore.terminales.length === 0"
        class="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-red-400/20 text-center">
        <p class="text-red-300 text-sm mb-4">{{ cajaStore.error }}</p>
        <button @click="cargarTerminales"
          class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all text-sm">
          Reintentar
        </button>
      </div>

      <form v-else @submit.prevent="iniciarTurno"
        class="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-5 shadow-2xl">

        <!-- Selector de Caja -->
        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Caja
          </label>
          <div class="relative">
            <select v-model="terminalId"
              class="w-full h-12 pl-4 pr-10 text-sm font-semibold bg-white/10 border border-white/20 rounded-xl text-white appearance-none outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all cursor-pointer"
              :class="terminalId ? 'text-white' : 'text-white/40'">
              <option value="" disabled class="bg-slate-800 text-white/40">Seleccione una caja</option>
              <option v-for="t in cajaStore.terminales" :key="t.id" :value="t.id"
                :disabled="t.status === 'OPEN' || t.is_locked_by_user"
                class="bg-slate-800 text-white">
                {{ t.name }} {{ t.is_locked_by_user ? '(en uso por otro cajero)' : t.status === 'OPEN' ? '(turno abierto)' : '' }}
              </option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p v-if="cajaBloqueada" class="mt-2 text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
            </svg>
            Esta caja está siendo utilizada por otro cajero actualmente.
          </p>
        </div>

        <!-- Monto Inicial USD -->
        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Fondo Inicial en USD
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">$</span>
            <input v-model="montoUsd" type="number" step="0.01" min="0" placeholder="0.00"
              class="w-full h-12 pl-8 pr-4 text-sm font-bold bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all" />
          </div>
        </div>

        <!-- Monto Inicial VES -->
        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Fondo Inicial en Bs
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">Bs</span>
            <input v-model="montoVes" type="number" step="0.01" min="0" placeholder="0.00"
              class="w-full h-12 pl-10 pr-4 text-sm font-bold bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all" />
          </div>
        </div>

        <!-- Notas opcionales -->
        <div>
          <label class="block text-xs font-bold text-blue-200/80 uppercase tracking-wider mb-2">
            Notas (opcional)
          </label>
          <input v-model="notas" type="text" placeholder="Comentario de apertura..."
            class="w-full h-10 px-4 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all" />
        </div>

        <!-- Error message -->
        <div v-if="cajaStore.error"
          class="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
          <p class="text-red-300 text-xs font-medium">{{ cajaStore.error }}</p>
        </div>

        <!-- Submit button -->
        <button type="submit" :disabled="!puedeIniciar || cajaStore.loading"
          class="w-full h-13 rounded-xl text-sm font-black text-white tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          :class="puedeIniciar && !cajaStore.loading
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/30'
            : 'bg-slate-600/50 cursor-not-allowed'">
          <div v-if="cajaStore.loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Iniciar Turno y Facturar
          </template>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAlert } from '@/composables/useAlert';
import { useCajaStore } from '@/stores/caja';

const cajaStore = useCajaStore();
const router = useRouter();
const { showSuccess, showError } = useAlert();

const terminalId = ref<number | ''>('');
const montoUsd = ref<number | null>(null);
const montoVes = ref<number | null>(null);
const notas = ref('');

const cajaBloqueada = computed(() => {
  if (!terminalId.value) return false;
  const t = cajaStore.terminales.find(t => t.id === terminalId.value);
  return t?.is_locked_by_user === true;
});

const puedeIniciar = computed(() => {
  return terminalId.value !== '' && !cajaBloqueada.value;
});

async function cargarTerminales() {
  await cajaStore.obtenerTerminales();
}

async function iniciarTurno() {
  if (!puedeIniciar.value) return;

  const ok = await cajaStore.abrirCaja({
    terminal_id: terminalId.value as number,
    initial_cash_usd: (montoUsd.value ?? 0).toFixed(2),
    initial_cash_ves: (montoVes.value ?? 0).toFixed(2),
    opening_notes: notas.value || undefined,
  });

  if (ok) {
    await showSuccess('Caja abierta', 'Turno iniciado correctamente');
    router.push('/admin/pos');
  } else {
    showError('Error al abrir caja', cajaStore.error || 'Error desconocido');
  }
}

onMounted(() => {
  cargarTerminales();
});
</script>
