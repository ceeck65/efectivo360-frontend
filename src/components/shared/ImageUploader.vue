<template>
  <div>
    <div
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      class="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
      :class="imagePreview
        ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-500/[0.04]'
        : dragOver
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/[0.06]'
          : 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/[0.15]'"
    >
      <img v-if="imagePreview" :src="imagePreview" class="max-h-full max-w-full object-contain p-2" alt="Preview" />
      <div v-else class="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
        <ImagePlus class="w-8 h-8" />
        <span class="text-xs font-medium">Arrastra una imagen o haz clic para seleccionar</span>
        <span class="text-[10px]">Recomendado: 400x400px, formato cuadrado</span>
      </div>
    </div>
    <div v-if="imagePreview" class="flex items-center justify-between mt-2">
      <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
        <CheckCircle2 class="w-3.5 h-3.5" /> Imagen cargada
      </span>
      <button @click="removeImage" type="button" class="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors">
        <Trash2 class="w-3.5 h-3.5" /> Eliminar
      </button>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFile" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ImagePlus, CheckCircle2, Trash2 } from 'lucide-vue-next';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref('');
const dragOver = ref(false);

watch(() => props.modelValue, (val) => {
  if (!val) imagePreview.value = '';
});

function triggerFileInput() {
  if (!imagePreview.value) fileInput.value?.click();
}

function handleFile(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) processFile(target.files[0]);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  if (e.dataTransfer?.files?.[0]) processFile(e.dataTransfer.files[0]);
}

function processFile(file: File) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    imagePreview.value = dataUrl;
    emit('update:modelValue', dataUrl);
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  imagePreview.value = '';
  emit('update:modelValue', '');
  if (fileInput.value) fileInput.value.value = '';
}
</script>
