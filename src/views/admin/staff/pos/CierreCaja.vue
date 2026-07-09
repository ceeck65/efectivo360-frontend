<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Cierre de Caja</h2>
              <p class="text-[11px] text-slate-300/80 font-medium">Arqueo ciego — Ingrese el conteo físico del dinero en mano</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-5">
          <div v-if="cajaStore.error"
            class="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p class="text-red-600 text-xs font-medium">{{ cajaStore.error }}</p>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <svg class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-[11px] text-amber-700 font-medium">
              Ingrese el dinero físico que tiene en mano. El sistema no mostrará montos esperados — esto es un arqueo ciego para fines de auditoría.
            </p>
          </div>

          <!-- Efectivo USD -->
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Efectivo en USD
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input v-model="cashUsd" type="number" step="0.01" min="0" placeholder="0.00"
                class="w-full h-12 pl-8 pr-4 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all" />
            </div>
          </div>

          <!-- Efectivo VES -->
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Efectivo en Bs
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Bs</span>
              <input v-model="cashVes" type="number" step="0.01" min="0" placeholder="0.00"
                class="w-full h-12 pl-10 pr-4 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all" />
            </div>
          </div>

          <!-- Notas opcionales -->
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Notas (opcional)
            </label>
            <textarea v-model="notas" rows="2" placeholder="Comentario de cierre..."
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all resize-none" />
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <button @click="$emit('close')" :disabled="cajaStore.loading"
              class="flex-1 h-12 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]">
              Cancelar
            </button>
            <button @click="confirmarCierre" :disabled="cajaStore.loading"
              class="flex-1 h-12 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              :class="!cajaStore.loading
                ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-500/30'
                : 'bg-slate-400 cursor-not-allowed'">
              <div v-if="cajaStore.loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <template v-else>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirmar y Cerrar Turno
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAlert } from '@/composables/useAlert';
import { useCajaStore } from '@/stores/caja';
import { usePosStore } from '@/stores/pos';

const emit = defineEmits<{ close: [] }>();

const cajaStore = useCajaStore();
const posStore = usePosStore();
const router = useRouter();
const { showSuccess, showError } = useAlert();

const cashUsd = ref<number | null>(null);
const cashVes = ref<number | null>(null);
const notas = ref('');

async function confirmarCierre() {
  const turno = cajaStore.turnoActivo;
  if (!turno?.id) {
    showError('Error', 'No hay un turno activo para cerrar');
    return;
  }

  const ok = await cajaStore.cerrarTurno(turno.id, {
    physical_cash_usd: cashUsd.value ?? 0,
    physical_cash_ves: cashVes.value ?? 0,
    notes: notas.value || 'Cierre desde POS',
  });

  if (ok) {
    posStore.reset();
    await showSuccess('Turno cerrado', 'Cierre de caja registrado correctamente');
    emit('close');
    router.push('/admin/dashboard');
  } else {
    showError('Error al cerrar turno', cajaStore.error || 'Error desconocido');
  }
}
</script>
