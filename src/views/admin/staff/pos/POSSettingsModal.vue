<template>
  <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end" @click.self="emit('close')">
    <aside class="w-full sm:w-[440px] h-full bg-white shadow-[-25px_0_60px_-15px_rgba(0,0,0,0.35)] flex flex-col text-slate-800 animate-[settings-slide-in_0.25s_ease]">

      <!-- Header -->
      <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Settings2 class="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Ajustes del Punto de Venta</h3>
            <p class="text-[10px] text-slate-400 font-medium">Personaliza tu experiencia de cobro</p>
          </div>
        </div>
        <button @click="emit('close')" aria-label="Cerrar ajustes"
          class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Cuerpo -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">

        <!-- ═══════ Interfaz ═══════ -->
        <section class="space-y-3">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Interfaz</h4>

          <!-- Switch: Teclado numérico virtual -->
          <div class="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
            <div class="flex items-start gap-2.5 min-w-0">
              <Keyboard class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-700">Mostrar Teclado Numérico Táctil en Cobro</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Desactívalo si usas computadora con teclado físico para ahorrar espacio en pantalla.</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox" class="sr-only peer" :checked="posSettingsStore.showVirtualKeypad"
                @change="updateKeypad(($event.target as HTMLInputElement).checked)" />
              <div class="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>

          <!-- Selector de layout -->
          <div class="space-y-1.5">
            <span class="text-xs font-bold text-slate-700 block">Distribución del Punto de Venta</span>
            <div class="grid grid-cols-1 gap-2">
              <button v-for="opt in layoutOptions" :key="opt.id" type="button" @click="updateLayout(opt.id)"
                class="relative flex items-center gap-3 border-2 rounded-xl px-3 py-2.5 text-left transition-all"
                :class="posSettingsStore.posLayout === opt.id ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'">

                <!-- Miniatura -->
                <div class="w-16 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex p-1 gap-0.5"
                  :class="opt.id === 'standard_left' ? 'flex-row-reverse' : 'flex-col'"
                  v-if="opt.id !== 'compact_grid'">
                  <div class="flex-1 grid grid-cols-3 gap-0.5 content-start">
                    <div v-for="i in 6" :key="i" class="h-2 rounded-[2px] bg-slate-300" />
                  </div>
                  <div class="w-4 rounded-[2px]" :class="posSettingsStore.posLayout === opt.id ? 'bg-blue-400' : 'bg-slate-300'" />
                </div>
                <div v-else class="w-16 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex flex-col p-1.5 gap-1">
                  <div class="h-2 rounded-[2px] w-2/3" :class="posSettingsStore.posLayout === opt.id ? 'bg-blue-400' : 'bg-slate-300'" />
                  <div v-for="i in 3" :key="i" class="h-1.5 rounded-[2px] bg-slate-300 w-full" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-slate-700">{{ opt.label }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ opt.desc }}</p>
                </div>

                <div v-if="posSettingsStore.posLayout === opt.id"
                  class="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Check class="w-2.5 h-2.5 text-white" stroke-width="3" />
                </div>
              </button>
            </div>
          </div>
        </section>

        <!-- ═══════ Interacción ═══════ -->
        <section class="space-y-3">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Interacción</h4>

          <div class="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
            <div class="flex items-start gap-2.5 min-w-0">
              <Eraser class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p class="text-xs font-bold text-slate-700">Limpiar buscador de productos tras agregar un ítem</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox" class="sr-only peer" :checked="posSettingsStore.clearSearchOnAdd"
                @change="updateClearSearch(($event.target as HTMLInputElement).checked)" />
              <div class="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>

          <div class="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
            <div class="flex items-start gap-2.5 min-w-0">
              <MousePointerClick class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p class="text-xs font-bold text-slate-700">Auto-seleccionar texto al enfocar campos numéricos</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox" class="sr-only peer" :checked="posSettingsStore.autoSelectNumericFields"
                @change="updateAutoSelectNumeric(($event.target as HTMLInputElement).checked)" />
              <div class="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>
        </section>

        <!-- ═══════ Personalización Visual ═══════ -->
        <section class="space-y-3">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Personalización Visual</h4>
          <div class="space-y-1.5">
            <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Palette class="w-3.5 h-3.5 text-slate-400" /> Color de Acento del POS
            </span>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="opt in themeOptions" :key="opt.id" type="button" @click="updateTheme(opt.id)"
                class="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all"
                :class="posSettingsStore.themeColor === opt.id ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'">
                <span class="relative w-7 h-7 rounded-full shadow-sm flex items-center justify-center" :class="opt.swatch">
                  <Check v-if="posSettingsStore.themeColor === opt.id" class="w-3.5 h-3.5 text-white" stroke-width="3" />
                </span>
                <span class="text-[9px] font-bold text-slate-600 text-center leading-tight">{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <span class="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Loader2 v-if="posSettingsStore.isSyncing" class="w-3 h-3 animate-spin text-slate-400" />
          {{ posSettingsStore.isSyncing ? 'Sincronizando…' : 'Los cambios se aplican al instante' }}
        </span>
        <button @click="handleSaveDefault" :disabled="saving"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
          <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          Guardar como mi preferencia por defecto
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X, Settings2, Keyboard, Eraser, MousePointerClick, Palette, Check, Save, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue3-toastify';
import { usePOSSettingsStore, type PosLayout, type PosThemeColor } from '@/stores/posSettings';

const emit = defineEmits<{
  close: [];
}>();

const posSettingsStore = usePOSSettingsStore();

const layoutOptions: { id: PosLayout; label: string; desc: string }[] = [
  { id: 'standard_right', label: 'Sidebar Derecha (Estándar)', desc: 'Carrito a la derecha, productos a la izquierda.' },
  { id: 'standard_left', label: 'Sidebar Izquierda', desc: 'Carrito a la izquierda, productos a la derecha.' },
  { id: 'compact_grid', label: 'Modo Lista / Escáner', desc: 'Enfoque directo en código de barras con lista densa.' },
];

const themeOptions: { id: PosThemeColor; label: string; swatch: string }[] = [
  { id: 'emerald', label: 'Verde Esmeralda', swatch: 'bg-emerald-500' },
  { id: 'blue', label: 'Azul Corporativo', swatch: 'bg-blue-600' },
  { id: 'violet', label: 'Violeta', swatch: 'bg-violet-500' },
  { id: 'dark', label: 'Oscuro', swatch: 'bg-slate-800' },
];

// Cada interacción aplica de inmediato (UI + localStorage) y se sincroniza con el
// servidor en segundo plano — no es necesario refrescar la página para verla reflejada.
function updateKeypad(value: boolean) {
  posSettingsStore.updatePreferences({ show_virtual_keypad: value });
}
function updateLayout(id: PosLayout) {
  posSettingsStore.setLayout(id);
}
function updateClearSearch(value: boolean) {
  posSettingsStore.updatePreferences({ clear_search_on_add: value });
}
function updateAutoSelectNumeric(value: boolean) {
  posSettingsStore.updatePreferences({ auto_select_numeric_fields: value });
}
function updateTheme(id: PosThemeColor) {
  posSettingsStore.updatePreferences({ theme_color: id });
}

// Botón explícito: re-confirma la sincronización completa con el servidor (útil si
// alguna sincronización individual falló por conexión) y cierra el panel.
const saving = ref(false);
async function handleSaveDefault() {
  saving.value = true;
  try {
    await posSettingsStore.updatePreferences({
      show_virtual_keypad: posSettingsStore.showVirtualKeypad,
      pos_layout: posSettingsStore.posLayout,
      theme_color: posSettingsStore.themeColor,
      clear_search_on_add: posSettingsStore.clearSearchOnAdd,
      auto_select_numeric_fields: posSettingsStore.autoSelectNumericFields,
    });
    toast.success('Preferencias guardadas como predeterminadas');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
@keyframes settings-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
