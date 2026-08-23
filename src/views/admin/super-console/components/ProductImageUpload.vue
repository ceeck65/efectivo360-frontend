<template>
  <div>
    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
      {{ label }}
    </label>
    <div
      @click="openStudio"
      class="group/imgpick relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
      :class="previewUrl
        ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-500/[0.04]'
        : 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/[0.15]'"
    >
      <img v-if="previewUrl" :src="previewUrl" class="max-h-full max-w-full object-contain p-2" alt="Vista previa" />
      <div v-else class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 px-2 text-center">
        <ImagePlus class="w-6 h-6" />
        <span class="text-[11px] font-medium">Editar con Estudio de Imagen</span>
        <span class="text-[10px]">Recorte cuadrado, fondo blanco, WebP</span>
      </div>
      <div v-if="previewUrl" class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/imgpick:bg-black/20 transition-colors">
        <Pencil class="w-4 h-4 text-white opacity-0 group-hover/imgpick:opacity-100 transition-opacity drop-shadow" />
      </div>
    </div>
    <div v-if="previewUrl" class="flex items-center justify-between mt-1.5">
      <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 truncate">
        <CheckCircle2 class="w-3.5 h-3.5 shrink-0" /> Imagen lista
      </span>
      <button @click.stop="removeImage" type="button" class="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors shrink-0">
        <Trash2 class="w-3.5 h-3.5" /> Eliminar
      </button>
    </div>

    <!-- Editing surface: ProductImageStudio.vue is the one editor used system-wide for image upload/crop/background removal. -->
    <Teleport to="body">
      <div v-if="showStudio" class="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showStudio = false" />
        <div class="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
          <div class="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 rounded-t-2xl sticky top-0 z-10">
            <h3 class="text-sm font-semibold text-slate-800">{{ label }}</h3>
            <button @click="showStudio = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="bg-white rounded-b-2xl">
            <ProductImageStudio ref="studioRef" @processed="handleProcessed" @cancel="showStudio = false" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { ImagePlus, CheckCircle2, Trash2, Pencil, X } from 'lucide-vue-next';
import ProductImageStudio from './ProductImageStudio.vue';

const props = withDefaults(defineProps<{
  /** File selected/edited by the user (raw, for FormData) — null when cleared. */
  modelValue: File | null;
  /** Existing image URL to show as the initial preview and to pre-load into the editor. */
  existingUrl?: string | null;
  label?: string;
}>(), {
  existingUrl: null,
  label: 'Fotografía Oficial',
});
const emit = defineEmits<{
  'update:modelValue': [file: File | null];
}>();

const studioRef = ref<InstanceType<typeof ProductImageStudio> | null>(null);
const showStudio = ref(false);
const objectUrl = ref('');
const removedExisting = ref(false);

const previewUrl = computed(() => {
  if (objectUrl.value) return objectUrl.value;
  if (!removedExisting.value && props.existingUrl) return props.existingUrl;
  return '';
});

function revokeObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
  }
}

async function openStudio() {
  showStudio.value = true;
  await nextTick();
  if (!objectUrl.value && !removedExisting.value && props.existingUrl) {
    studioRef.value?.loadFromUrl(props.existingUrl);
  }
}

function handleProcessed(blob: Blob, previewSrc: string) {
  revokeObjectUrl();
  objectUrl.value = previewSrc;
  removedExisting.value = false;
  const file = new File([blob], 'image.webp', { type: 'image/webp' });
  emit('update:modelValue', file);
  showStudio.value = false;
}

function removeImage() {
  revokeObjectUrl();
  removedExisting.value = true;
  emit('update:modelValue', null);
}

watch(() => props.modelValue, (file) => {
  if (!file) revokeObjectUrl();
});

// A different existingUrl means the parent selected a different record —
// drop any locally-picked file/removal state from the previous one.
watch(() => props.existingUrl, () => {
  revokeObjectUrl();
  removedExisting.value = false;
});

onBeforeUnmount(() => revokeObjectUrl());
</script>
