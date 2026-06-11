<template>
  <div v-if="scanning" class="relative rounded-lg overflow-hidden border border-slate-300 dark:border-white/[0.08] bg-black" :class="containerClass">
    <div :id="id" class="w-full" :class="heightClass" />
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="border-2 rounded-lg relative overflow-hidden" :class="[overlayClass, overlayBorder]">
        <div class="absolute left-0 right-0 h-0.5 animate-scan-line" :class="scanLineClass" />
      </div>
    </div>
    <button @click="handleClose" class="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90">
      <X class="w-4 h-4" />
    </button>
    <p class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 bg-black/60 px-3 py-1 rounded-full whitespace-nowrap">
      Apunta al código de barras
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';
import { X } from 'lucide-vue-next';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const props = withDefaults(defineProps<{
  id: string;
  scanning: boolean;
  includeQR?: boolean;
  includeExtended?: boolean;
  qrboxWidth?: number;
  qrboxHeight?: number;
  aspectRatio?: number;
  overlayClass?: string;
  heightClass?: string;
  containerClass?: string;
  overlayBorder?: string;
  scanLineClass?: string;
}>(), {
  includeQR: false,
  includeExtended: false,
  qrboxWidth: 280,
  qrboxHeight: 100,
  aspectRatio: 1.75,
  overlayClass: 'w-56 h-20 sm:w-72 sm:h-24',
  heightClass: 'h-56 sm:h-72',
  containerClass: '',
  overlayBorder: 'border-blue-400/60',
  scanLineClass: 'bg-blue-400/80',
});

const emit = defineEmits<{
  scan: [code: string];
  close: [];
  error: [message: string];
}>();

const scannerInstance = ref<Html5Qrcode | null>(null);

async function startScanner() {
  await nextTick();
  try {
    const formats = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
    ];
    if (props.includeQR) formats.push(Html5QrcodeSupportedFormats.QR_CODE);
    if (props.includeExtended) {
      formats.push(
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.QR_CODE,
      );
    }
    const scanner = new Html5Qrcode(props.id, {
      formatsToSupport: formats,
      verbose: false,
    });
    scannerInstance.value = scanner;
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: props.qrboxWidth, height: props.qrboxHeight },
        aspectRatio: props.aspectRatio,
      },
      (txt) => {
        emit('scan', txt);
        stopScanner();
        emit('close');
      },
      () => {},
    );
  } catch (e: any) {
    emit('error', e?.message || 'No se pudo acceder a la cámara');
    scannerInstance.value = null;
    emit('close');
  }
}

function stopScanner() {
  if (scannerInstance.value) {
    scannerInstance.value.stop()
      .then(() => {
        scannerInstance.value?.clear();
        scannerInstance.value = null;
      })
      .catch(() => {});
  }
}

function handleClose() {
  stopScanner();
  emit('close');
}

watch(() => props.scanning, (v) => {
  if (v) startScanner();
  else stopScanner();
});

onUnmounted(() => {
  if (scannerInstance.value?.isScanning) {
    scannerInstance.value.stop().catch(() => {});
  }
  scannerInstance.value = null;
});
</script>

<style scoped>
@keyframes scan-line {
  0%, 100% { top: 0; }
  50% { top: calc(100% - 2px); }
}
.animate-scan-line { animation: scan-line 1.5s ease-in-out infinite; }
</style>
