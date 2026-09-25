<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next';

// Lightbox de zoom interactivo (estilo Mercado Libre): clic para acercar centrado en el
// punto tocado, arrastrar para mover, rueda del mouse para zoom, y navegación entre fotos.
const props = withDefaults(defineProps<{ images: string[]; initialIndex?: number }>(), { initialIndex: 0 });
const emit = defineEmits<{ (e: 'close'): void }>();

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_ON_CLICK = 2.5;

const active = ref(props.initialIndex);
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const dragging = ref(false);
let dragStart = { x: 0, y: 0 };
let offsetStart = { x: 0, y: 0 };
let didDrag = false;

function resetZoom() {
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
}

watch(active, resetZoom);

function go(delta: number) {
  active.value = (active.value + delta + props.images.length) % props.images.length;
}

function onImageClick(event: MouseEvent) {
  if (didDrag) {
    didDrag = false;
    return;
  }
  if (scale.value > 1) {
    resetZoom();
    return;
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width - 0.5;
  const py = (event.clientY - rect.top) / rect.height - 0.5;
  scale.value = ZOOM_ON_CLICK;
  offset.value = { x: -px * rect.width * (scale.value - 1), y: -py * rect.height * (scale.value - 1) };
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value - event.deltaY * 0.0015));
  if (scale.value === MIN_SCALE) offset.value = { x: 0, y: 0 };
}

function onPointerDown(event: PointerEvent) {
  if (scale.value <= 1) return;
  dragging.value = true;
  didDrag = false;
  dragStart = { x: event.clientX, y: event.clientY };
  offsetStart = { ...offset.value };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  if (Math.abs(event.clientX - dragStart.x) > 3 || Math.abs(event.clientY - dragStart.y) > 3) didDrag = true;
  offset.value = { x: offsetStart.x + (event.clientX - dragStart.x), y: offsetStart.y + (event.clientY - dragStart.y) };
}

function onPointerUp() {
  dragging.value = false;
}

function onKeydown(event: KeyboardEvent) {
  // Captura antes que el listener de teclado del modal padre, para que Escape solo
  // cierre este lightbox (la capa superior) y no también el detalle de producto debajo.
  if (event.key === 'Escape') {
    event.stopPropagation();
    emit('close');
  } else if (event.key === 'ArrowLeft') go(-1);
  else if (event.key === 'ArrowRight') go(1);
}

onMounted(() => window.addEventListener('keydown', onKeydown, true));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true));
</script>

<template>
  <div class="fixed inset-0 z-[70] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
    <div class="flex shrink-0 items-center justify-between px-4 py-3 text-white">
      <span class="text-sm text-white/70">{{ active + 1 }} / {{ images.length }}</span>
      <button type="button" class="rounded-full p-2 hover:bg-white/10" title="Cerrar" @click="emit('close')">
        <X :size="22" />
      </button>
    </div>

    <div class="relative min-h-0 flex-1 overflow-hidden" @wheel="onWheel">
      <img
        :key="images[active]"
        :src="images[active]"
        alt=""
        class="absolute left-1/2 top-1/2 h-auto w-[min(92vw,900px)] max-w-none select-none"
        :class="scale > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'"
        :style="{
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'none',
        }"
        draggable="false"
        @click="onImageClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      />

      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          title="Anterior"
          @click.stop="go(-1)"
        >
          <ChevronLeft :size="24" />
        </button>
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          title="Siguiente"
          @click.stop="go(1)"
        >
          <ChevronRight :size="24" />
        </button>
      </template>
    </div>

    <p class="shrink-0 pb-4 text-center text-xs text-white/50">
      {{ scale > 1 ? 'Arrastra para mover · clic para alejar' : 'Clic para acercar · rueda del mouse para zoom' }}
    </p>
  </div>
</template>
