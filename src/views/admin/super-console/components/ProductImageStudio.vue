<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <Camera class="w-4 h-4 text-gray-400" />
        <h2 class="text-sm font-normal text-gray-800">Estudio de Imagen</h2>
      </div>
      <button
        v-if="displaySrc"
        @click="resetAll"
        class="text-xs font-normal text-gray-400 hover:text-gray-600 transition-colors"
      >
        Restablecer
      </button>
    </div>

    <div class="flex flex-col lg:flex-row">

      <!-- ─── Left: Preview ─── -->
      <div class="flex-1 min-w-0 p-4 lg:p-5 flex items-center justify-center bg-gray-50/50">
        <template v-if="!sourceFile && !displaySrc">
          <div
            class="flex flex-col items-center gap-2 py-12 text-gray-300 cursor-pointer hover:text-gray-400 transition-colors"
            @click="triggerInput"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
          >
            <ImagePlus class="w-10 h-10" />
            <p class="text-sm font-light">Arrastra o haz clic para subir</p>
            <p class="text-xs text-gray-200">PNG, JPEG, WebP</p>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFile" />
          </div>
        </template>

        <!-- Removing background spinner -->
        <div v-else-if="removingBg" class="flex flex-col items-center gap-3 py-12 text-gray-400">
          <Loader2 class="w-6 h-6 animate-spin" />
          <p class="text-sm font-light">Eliminando fondo…</p>
        </div>

        <template v-else-if="displaySrc">
          <div class="relative w-full max-w-md">
            <div class="relative rounded-lg overflow-hidden" :class="{ 'cursor-crosshair': eraserMode }" :style="filterStyle">
              <Cropper
                ref="cropperRef"
                :src="displaySrc"
                :st-props="{ handles: false }"
                :default-size="{ width: 400, height: 400 }"
                :stencil-size="stencilSize"
                :resize-image="{ adjustStencil: false }"
                image-restriction="fill"
                class="cropper-light"
              />
              <!-- Eraser canvas overlay -->
              <canvas
                v-if="eraserMode"
                ref="eraserCanvas"
                class="absolute inset-0 z-10"
                @mousedown="startErase"
                @mousemove="doErase"
                @mouseup="stopErase"
                @mouseleave="stopErase"
                @touchstart.prevent="startTouchErase"
                @touchmove.prevent="doTouchErase"
                @touchend.prevent="stopErase"
              />
              <!-- Eraser mode indicator -->
              <div v-if="eraserMode" class="absolute top-2 left-2 z-20 bg-white/80 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-normal shadow-sm pointer-events-none">
                Borrador {{ eraserBrushSize }}px
              </div>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <span class="text-[11px] text-gray-400 font-normal w-8 text-right">–</span>
              <input type="range" min="0.1" max="3" step="0.05" :value="zoom" @input="onZoom" class="range-slider flex-1" />
              <span class="text-[11px] text-gray-400 font-normal w-8">+</span>
            </div>
          </div>
        </template>
      </div>

      <!-- ─── Right: Controls ─── -->
      <div v-if="displaySrc" class="w-full lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 p-5 space-y-5">

        <div>
          <h3 class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Ajustes</h3>
          <div class="space-y-3.5">
            <div v-for="adj in adjustments" :key="adj.key">
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-normal text-gray-500">{{ adj.label }}</label>
                <span class="text-[11px] font-mono text-gray-400 w-10 text-right">{{ values[adj.key] }}{{ adj.unit }}</span>
              </div>
              <input type="range" :min="adj.min" :max="adj.max" :step="adj.step" v-model.number="values[adj.key]" class="range-slider w-full" />
            </div>
          </div>
        </div>

        <!-- Background Removal (optional) -->
        <div>
          <h3 class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Fondo</h3>
          <button
            @click="removeBg"
            :disabled="removingBg || bgRemoved"
            class="w-full py-2 rounded-lg text-xs font-normal border transition-colors flex items-center justify-center gap-2"
            :class="bgRemoved
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
          >
            <Loader2 v-if="removingBg" class="w-3 h-3 animate-spin" />
            <Check v-else-if="bgRemoved" class="w-3 h-3" />
            <Eraser v-else class="w-3 h-3" />
            {{ bgRemoved ? 'Fondo eliminado' : 'Quitar fondo automático' }}
          </button>
        </div>

        <!-- Manual Eraser -->
        <div>
          <h3 class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Borrador Manual</h3>
          <button
            @click="eraserMode = !eraserMode"
            :class="[
              'w-full py-2 rounded-lg text-xs font-normal border transition-colors flex items-center justify-center gap-2',
              eraserMode
                ? 'border-orange-300 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            ]"
          >
            <Brush class="w-3 h-3" />
            {{ eraserMode ? 'Modo borrador activo' : 'Activar borrador manual' }}
          </button>
          <div v-if="eraserMode" class="mt-2 space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-normal text-gray-400">Tamaño</label>
              <span class="text-[11px] font-mono text-gray-400">{{ eraserBrushSize }}px</span>
            </div>
            <input type="range" min="4" max="60" step="2" v-model.number="eraserBrushSize" class="range-slider w-full" />
          </div>
        </div>

        <div>
          <h3 class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Recorte</h3>
          <p class="text-xs font-light text-gray-400">1:1 · Fondo blanco · WebP</p>
        </div>

        <div class="space-y-2 pt-2">
          <button
            @click="process"
            :disabled="processing || removingBg"
            class="w-full py-2.5 rounded-lg text-sm font-light text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-3.5 h-3.5 animate-spin" />
            <Check v-else class="w-3.5 h-3.5" />
            {{ processing ? 'Procesando…' : 'Procesar y Guardar' }}
          </button>
          <button
            @click="$emit('cancel')"
            :disabled="processing || removingBg"
            class="w-full py-2 rounded-lg text-sm font-normal text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <canvas ref="canvasRef" class="hidden" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { Camera, ImagePlus, Check, Loader2, Eraser, Brush } from 'lucide-vue-next';
import Swal from 'sweetalert2';

const emit = defineEmits<{
  processed: [blob: Blob, previewUrl: string];
  cancel: [];
}>();

const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const sourceFile = ref<File | null>(null);
const displaySrc = ref<string | null>(null);
const removingBg = ref(false);
const bgRemoved = ref(false);
const processing = ref(false);
const dragOver = ref(false);
const zoom = ref(1);
const eraserMode = ref(false);
const eraserBrushSize = ref(20);
const eraserCanvas = ref<HTMLCanvasElement | null>(null);
const isErasing = ref(false);

const stencilSize = { width: 400, height: 400 };

const adjustments = [
  { key: 'brightness', label: 'Brillo', min: 0, max: 200, step: 1, unit: '%', default: 100 },
  { key: 'saturation', label: 'Saturación', min: 0, max: 200, step: 1, unit: '%', default: 100 },
  { key: 'contrast', label: 'Contraste', min: 0, max: 200, step: 1, unit: '%', default: 100 },
] as const;

const values = reactive<Record<string, number>>({});
for (const a of adjustments) values[a.key] = a.default;

const filterStyle = computed(() => ({
  filter: `brightness(${values.brightness}%) saturate(${values.saturation}%) contrast(${values.contrast}%)`,
}));

// ── File handling ──

function triggerInput() { fileInput.value?.click(); }

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadFile(file);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

async function loadFile(file: File) {
  sourceFile.value = file;
  displaySrc.value = URL.createObjectURL(file);
  bgRemoved.value = false;
}

function onZoom(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  zoom.value = val;
  cropperRef.value?.setCoordinates({ width: val * 200, height: val * 200 });
}

function resetAll() {
  for (const a of adjustments) values[a.key] = a.default;
  zoom.value = 1;
  displaySrc.value = null;
  sourceFile.value = null;
  bgRemoved.value = false;
  eraserMode.value = false;
  clearEraserCanvas();
}

// ── Background removal ──

async function removeBg() {
  if (!displaySrc.value || removingBg.value) return;

  const result = await Swal.fire({
    title: 'Quitar fondo',
    text: 'Esta operación puede tardar unos segundos dependiendo del tamaño de la imagen. No cierres el panel hasta que finalice.',
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#64748b',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar',
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;

  removingBg.value = true;
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    const resultBlob = await removeBackground(displaySrc.value);
    if (resultBlob) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = URL.createObjectURL(resultBlob);
      });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      displaySrc.value = canvas.toDataURL('image/png');
      bgRemoved.value = true;
    }
  } catch (e) {
    console.warn('Background removal failed', e);
  } finally {
    removingBg.value = false;
  }
}

// ── Manual Eraser ──

function initEraserCanvas() {
  if (!eraserCanvas.value) return;
  const parent = eraserCanvas.value.parentElement;
  if (!parent) return;
  eraserCanvas.value.width = parent.clientWidth;
  eraserCanvas.value.height = parent.clientHeight;
}

function clearEraserCanvas() {
  if (!eraserCanvas.value) return;
  const ctx = eraserCanvas.value.getContext('2d')!;
  ctx.clearRect(0, 0, eraserCanvas.value.width, eraserCanvas.value.height);
}

function getEraserPos(e: MouseEvent | Touch): { x: number; y: number } {
  if (!eraserCanvas.value) return { x: 0, y: 0 };
  const rect = eraserCanvas.value.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function drawEraserDot(x: number, y: number) {
  if (!eraserCanvas.value) return;
  const ctx = eraserCanvas.value.getContext('2d')!;
  const r = eraserBrushSize.value / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function startErase(e: MouseEvent) { isErasing.value = true; drawEraserDot(getEraserPos(e).x, getEraserPos(e).y); }
function doErase(e: MouseEvent) { if (isErasing.value) drawEraserDot(getEraserPos(e).x, getEraserPos(e).y); }
function stopErase() { isErasing.value = false; }

function startTouchErase(e: TouchEvent) {
  isErasing.value = true;
  if (e.touches[0]) { const p = getEraserPos(e.touches[0]); drawEraserDot(p.x, p.y); }
}
function doTouchErase(e: TouchEvent) {
  if (isErasing.value && e.touches[0]) { const p = getEraserPos(e.touches[0]); drawEraserDot(p.x, p.y); }
}

// ── Process (crop + canvas + WebP) ──

async function process() {
  if (!cropperRef.value || !canvasRef.value) return;
  processing.value = true;

  try {
    const result = cropperRef.value.getResult();
    if (!result?.canvas) throw new Error('No crop result');

    const croppedCanvas = result.canvas;
    const out = canvasRef.value;
    const ctx = out.getContext('2d')!;

    const size = 800;
    out.width = size;
    out.height = size;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw cropped image centered
    const srcW = croppedCanvas.width;
    const srcH = croppedCanvas.height;
    const scale = Math.min(size / srcW, size / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;

    ctx.drawImage(croppedCanvas, dx, dy, dw, dh);

    // Apply pixel-level adjustments
    const imageData = ctx.getImageData(0, 0, size, size);
    const b = values.brightness / 100;
    const s = values.saturation / 100;
    const c = values.contrast / 100;
    const data = imageData.data;

    // Precompute eraser mask if active
    const eraserMask: boolean[] = [];
    if (eraserCanvas.value) {
      const eCtx = eraserCanvas.value.getContext('2d')!;
      const eData = eCtx.getImageData(0, 0, eraserCanvas.value.width, eraserCanvas.value.height);
      const eScaleX = size / eraserCanvas.value.width;
      const eScaleY = size / eraserCanvas.value.height;
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const ex = Math.floor(px / eScaleX);
          const ey = Math.floor(py / eScaleY);
          const ei = (ey * eraserCanvas.value.width + ex) * 4;
          eraserMask[py * size + px] = ei < eData.data.length && eData.data[ei + 3] > 0;
        }
      }
    }

    for (let i = 0; i < data.length; i += 4) {
      const pixelIdx = i / 4;

      // Apply manual eraser: paint white
      if (eraserMask[pixelIdx]) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        continue;
      }

      let r = data[i];
      let g = data[i + 1];
      let bv = data[i + 2];

      r *= b;
      g *= b;
      bv *= b;

      r = ((r / 255 - 0.5) * c + 0.5) * 255;
      g = ((g / 255 - 0.5) * c + 0.5) * 255;
      bv = ((bv / 255 - 0.5) * c + 0.5) * 255;

      const gray = 0.2989 * r + 0.587 * g + 0.114 * bv;
      r = gray + (r - gray) * s;
      g = gray + (g - gray) * s;
      bv = gray + (bv - gray) * s;

      data[i] = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(bv);
    }
    ctx.putImageData(imageData, 0, 0);

    out.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        emit('processed', blob, url);
      }
      processing.value = false;
    }, 'image/webp', 0.85);
  } catch (e) {
    console.error('Processing error', e);
    processing.value = false;
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

watch(eraserMode, async (on) => {
  if (on) {
    await nextTick();
    initEraserCanvas();
  } else {
    clearEraserCanvas();
  }
});
</script>

<style scoped>
.cropper-light :deep(.vue-simple-handler) {
  background: transparent !important;
  border: none !important;
}
.cropper-light :deep(.vue-simple-line) {
  border-color: rgba(255, 255, 255, 0.5) !important;
}
.cropper-light :deep(.move) {
  border: 1.5px dashed rgba(255, 255, 255, 0.6) !important;
}

.range-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: border-color 0.15s;
}
.range-slider::-webkit-slider-thumb:hover {
  border-color: #9ca3af;
}
.range-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}
.range-slider:focus::-webkit-slider-thumb {
  border-color: #6b7280;
}
</style>
