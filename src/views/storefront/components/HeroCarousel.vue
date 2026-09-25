<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  text: string;
  imageUrl: string;
  showOverlay: boolean;
  cta: { label: string; url: string } | null; // url vacía = ir a los productos
}

const props = withDefaults(defineProps<{ slides: HeroSlide[]; interval?: number }>(), { interval: 6000 });
const emit = defineEmits<{ (e: 'cta', slide: HeroSlide): void }>();

const index = ref(0);
const paused = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
let touchStartX = 0;

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function go(target: number) {
  index.value = (target + props.slides.length) % props.slides.length;
}

const next = () => go(index.value + 1);
const prev = () => go(index.value - 1);

onMounted(() => {
  if (reducedMotion || props.slides.length < 2) return;
  timer = setInterval(() => {
    if (!paused.value) next();
  }, props.interval);
});

onBeforeUnmount(() => clearInterval(timer));

function onTouchStart(event: TouchEvent) {
  touchStartX = event.changedTouches[0].clientX;
}

function onTouchEnd(event: TouchEvent) {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
}
</script>

<template>
  <section
    class="relative overflow-hidden rounded-2xl shadow-lg"
    aria-roledescription="carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="flex transition-transform duration-700 ease-out" :style="{ transform: `translateX(-${index * 100}%)` }">
      <article
        v-for="(slide, i) in slides"
        :key="slide.id"
        class="relative flex h-56 w-full shrink-0 items-center overflow-hidden bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-dark)] px-6 sm:h-72 sm:px-12 lg:h-80"
        :aria-hidden="i !== index"
      >
        <template v-if="slide.imageUrl">
          <img :src="slide.imageUrl" alt="" class="absolute inset-0 h-full w-full object-cover" :loading="i === 0 ? 'eager' : 'lazy'" />
          <div v-if="slide.showOverlay" class="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/35 to-transparent" />
        </template>
        <div
          v-else
          class="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 sm:h-96 sm:w-96"
        />
        <div
          v-if="slide.eyebrow || slide.title || slide.text || slide.cta"
          class="relative max-w-xl"
          :class="slide.imageUrl ? 'text-white' : 'text-[color:var(--on-brand)]'"
        >
          <p v-if="slide.eyebrow" class="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            {{ slide.eyebrow }}
          </p>
          <h2 v-if="slide.title" class="text-2xl font-extrabold leading-tight sm:text-4xl">{{ slide.title }}</h2>
          <p v-if="slide.text" class="mt-2 text-sm opacity-90 sm:text-base">{{ slide.text }}</p>
          <button
            v-if="slide.cta"
            type="button"
            class="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow transition hover:scale-105 hover:shadow-lg"
            :tabindex="i === index ? 0 : -1"
            @click="emit('cta', slide)"
          >
            {{ slide.cta.label }}
          </button>
        </div>
      </article>
    </div>

    <template v-if="slides.length > 1">
      <button
        type="button"
        class="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur hover:bg-white/40 sm:block"
        title="Anterior"
        @click="prev"
      >
        <ChevronLeft :size="20" />
      </button>
      <button
        type="button"
        class="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur hover:bg-white/40 sm:block"
        title="Siguiente"
        @click="next"
      >
        <ChevronRight :size="20" />
      </button>

      <div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          class="h-2 rounded-full transition-all"
          :class="i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'"
          :title="slide.title"
          @click="go(i)"
        />
      </div>
    </template>
  </section>
</template>
