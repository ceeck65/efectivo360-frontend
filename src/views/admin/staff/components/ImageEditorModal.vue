<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleClose" />
      <div class="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 rounded-t-2xl sticky top-0 z-10">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <ImagePlus class="w-4 h-4 text-cyan-500" /> Editor de Imagen
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">{{ productName }}</p>
          </div>
          <button @click="handleClose" :disabled="uploading" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 disabled:opacity-40">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Studio -->
        <div class="bg-white rounded-b-2xl">
          <ProductImageStudio ref="studioRef" @processed="handleProcessed" @cancel="handleClose" />
        </div>

        <!-- Uploading overlay -->
        <div v-if="uploading" class="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-slate-600">
            <Loader2 class="w-6 h-6 animate-spin" />
            <span class="text-xs font-medium">Guardando imagen...</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { X, ImagePlus, Loader2 } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import ProductImageStudio from '@/views/admin/super-console/components/ProductImageStudio.vue';

const props = defineProps<{
  visible: boolean;
  productId: string;
  currentImageUrl: string | null;
  productName: string;
}>();

const emit = defineEmits<{
  close: [];
  'image-saved': [product: any];
}>();

const { success, error: notifyError } = useNotify();

const studioRef = ref<InstanceType<typeof ProductImageStudio> | null>(null);
const uploading = ref(false);

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al guardar la imagen';
}

async function handleProcessed(blob: Blob) {
  if (!props.productId || uploading.value) return;
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('image', blob, 'product-image.webp');
    const res = await fetchApi<any>(`/api/v1/admin/global-catalog/products/${props.productId}/update-image/`, {
      method: 'PATCH',
      data: fd,
    });
    success('Imagen actualizada correctamente.');
    emit('image-saved', res);
    emit('close');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    uploading.value = false;
  }
}

function handleClose() {
  if (uploading.value) return;
  emit('close');
}

watch(() => props.visible, async (v) => {
  if (!v) return;
  uploading.value = false;
  await nextTick();
  if (props.currentImageUrl) {
    studioRef.value?.loadFromUrl(props.currentImageUrl);
  }
});
</script>
