<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Truck class="w-4 h-4 text-blue-500" /> Alta Rápida de Proveedor
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Se seleccionará automáticamente en la factura</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              RIF / DNI <span class="text-red-400">*</span>
            </label>
            <input
              ref="rifInput"
              v-model="rif"
              type="text"
              placeholder="Ej: J-123456780"
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter.prevent="focusNext"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Nombre Comercial <span class="text-red-400">*</span>
            </label>
            <input
              ref="nameInput"
              v-model="name"
              type="text"
              placeholder="Ej: Distribuidora El Mayorista C.A."
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter.prevent="submit"
            />
          </div>
          <p class="text-[11px] text-slate-400">
            Presiona <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter</kbd>
            en Nombre Comercial para guardar.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || saving"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Guardando...' : 'Crear y Seleccionar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Truck, Save, Loader2 } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

export interface QuickCreatedSupplier {
  id: string;
  name: string;
  rif: string;
}

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  created: [supplier: QuickCreatedSupplier];
}>();

const { error: notifyError } = useNotify();

const rifInput = ref<HTMLInputElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const rif = ref('');
const name = ref('');
const saving = ref(false);

const canSubmit = computed(() => rif.value.trim().length > 0 && name.value.trim().length > 0);

function focusNext() {
  nameInput.value?.focus();
}

function resetForm() {
  rif.value = '';
  name.value = '';
  saving.value = false;
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al crear el proveedor';
}

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/suppliers/quick-create/', {
      method: 'POST',
      data: {
        rif_or_dni: rif.value.trim(),
        name: name.value.trim(),
      },
    });
    emit('created', { id: res.id, name: res.name, rif: res.rif });
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  if (saving.value) return;
  emit('close');
}

watch(() => props.visible, (v) => {
  if (v) {
    resetForm();
    nextTick(() => rifInput.value?.focus());
  }
});
</script>
