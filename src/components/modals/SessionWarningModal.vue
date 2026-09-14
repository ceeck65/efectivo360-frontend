<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div class="px-6 pt-7 pb-2 text-center">
          <div class="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Clock class="w-7 h-7 text-amber-500" />
          </div>
          <h3 class="text-base font-semibold text-slate-800">Tu sesión está por expirar</h3>
          <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Por tu seguridad, tu sesión expirará en
            <span class="font-mono font-bold text-amber-600 text-base tabular-nums">{{ formattedTime }}</span>
            {{ secondsRemaining === 1 ? 'segundo' : 'segundos' }} por inactividad.
          </p>
        </div>

        <div class="px-6 pb-1 pt-3">
          <div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-amber-500 transition-[width] duration-1000 ease-linear" :style="{ width: progressPct + '%' }" />
          </div>
        </div>

        <div class="flex items-center gap-2 px-6 py-5">
          <button type="button" @click="$emit('logout')"
            class="flex-1 h-11 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
            <LogOut class="w-4 h-4" /> Cerrar sesión
          </button>
          <button type="button" @click="$emit('extend')"
            class="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <RefreshCw class="w-4 h-4" /> Mantener sesión activa
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock, RefreshCw, LogOut } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  visible: boolean;
  secondsRemaining: number;
  /** Countdown length in seconds, for the progress bar (matches IDLE_LOGOUT_TIME - IDLE_WARNING_TIME). */
  totalSeconds?: number;
}>(), {
  totalSeconds: 60,
});

defineEmits<{
  extend: [];
  logout: [];
}>();

const formattedTime = computed(() => {
  const m = Math.floor(props.secondsRemaining / 60).toString().padStart(2, '0');
  const s = (props.secondsRemaining % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

const progressPct = computed(() => {
  if (props.totalSeconds <= 0) return 0;
  return Math.max(0, Math.min(100, (props.secondsRemaining / props.totalSeconds) * 100));
});
</script>
