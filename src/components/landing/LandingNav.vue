<template>
  <header
    :class="[
      'fixed left-0 right-0 top-0 z-[100] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300',
      pastHero
        ? 'border-b border-slate-200 bg-black shadow-lg'
        : scrolled
          ? 'border-b border-white/[0.08] bg-[#030306]/82 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl'
          : 'border-b border-white/[0.04] bg-[#030306]/35 backdrop-blur-md'
    ]"
  >
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-8">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="group flex shrink-0 items-center gap-2"
      >
        <div class="relative w-9 h-9">
          <div class="absolute inset-0 rounded-full bg-gradient-to-r from-[#007BFF] to-[#00D492] blur-sm opacity-60" />
          <div class="relative w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden">
            <img
              src="/assets/logo-mark.svg"
              alt="Efectivo 360"
              class="w-8 h-8 object-contain"
            />
          </div>
        </div>
        <span class="text-sm font-semibold tracking-tight text-white md:text-base">
          Efectivo <span class="text-[#00D492]">360</span>
        </span>
      </RouterLink>

      <!-- Desktop Navigation -->
      <nav class="hidden items-center gap-1 md:flex" aria-label="Principal">
        <RouterLink
          v-for="item in navLinks"
          :key="item.href"
          :to="item.href"
          :class="[
            'rounded-lg px-3.5 py-2 text-sm font-medium transition hover:bg-white/[0.06]',
            pastHero ? 'text-slate-300 hover:text-white' : 'text-slate-300 hover:text-white'
          ]"
        >
          {{ item.label }}
        </RouterLink>
        
        <!-- Language Selector -->
        <div :class="[
          'ml-2 flex items-center gap-0.5 rounded-lg border p-0.5',
          pastHero ? 'border-slate-700 bg-slate-900/50' : 'border-white/[0.08] bg-white/[0.03]'
        ]">
          <button
            @click="setLang('es')"
            :class="[
              'rounded-md px-2.5 py-1.5 text-xs font-semibold transition',
              currentLang === 'es'
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-500 hover:text-slate-300'
            ]"
          >
            ES
          </button>
          <button
            @click="setLang('en')"
            :class="[
              'rounded-md px-2.5 py-1.5 text-xs font-semibold transition',
              currentLang === 'en'
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-500 hover:text-slate-300'
            ]"
          >
            EN
          </button>
        </div>
      </nav>

      <!-- CTA Buttons -->
      <div class="hidden items-center gap-2 md:flex">
        <a
          :href="demoHref"
          :class="[
            'rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.06] hover:text-white',
            pastHero ? 'text-slate-300' : 'text-slate-300'
          ]"
        >
          {{ copy.nav.ctaSecondary }}
        </a>
        <RouterLink
          to="/#registro"
          class="rounded-xl border border-sky-400/35 bg-gradient-to-r from-[#0070F3]/90 to-sky-600/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(56,189,248,0.5)] transition hover:border-sky-300/50 hover:shadow-[0_0_32px_-8px_rgba(56,189,248,0.55)]"
        >
          {{ copy.nav.ctaPrimary }}
        </RouterLink>
      </div>

      <!-- Mobile Menu Button -->
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-white backdrop-blur-sm transition hover:bg-white/[0.09] md:hidden"
        @click="open = true"
        :aria-expanded="open"
        aria-label="Abrir menú"
      >
        <Menu class="h-5 w-5" strokeWidth="1.75" />
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden"
          @click="open = false"
        />
      </Transition>
      
      <!-- Mobile Menu Panel -->
      <Transition name="slide-down">
        <div
          v-if="open"
          class="fixed left-4 right-4 top-[4.5rem] z-[120] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0d14]/95 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75)] backdrop-blur-2xl md:hidden"
        >
          <div class="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {{ copy.nav.menuTitle }}
            </span>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
              @click="open = false"
              aria-label="Cerrar menú"
            >
              <X class="h-5 w-5" strokeWidth="1.75" />
            </button>
          </div>
          
          <nav class="flex flex-col p-2" aria-label="Móvil">
            <RouterLink
              v-for="(item, i) in navLinks"
              :key="item.href"
              :to="item.href"
              class="block rounded-xl px-4 py-3.5 text-base font-medium text-slate-200 hover:bg-white/[0.06]"
              @click="open = false"
              :style="{ animationDelay: `${i * 0.04}s` }"
            >
              {{ item.label }}
            </RouterLink>
            
            <div class="my-2 border-t border-white/[0.06]" />
            
            <!-- Mobile Language Selector -->
            <div class="flex gap-2 px-2 pb-2">
              <button
                @click="setLang('es')"
                :class="[
                  'flex-1 rounded-xl py-3 text-center text-sm font-semibold',
                  currentLang === 'es'
                    ? 'border border-sky-400/40 bg-white/[0.08] text-white'
                    : 'border border-transparent text-slate-500'
                ]"
              >
                ES
              </button>
              <button
                @click="setLang('en')"
                :class="[
                  'flex-1 rounded-xl py-3 text-center text-sm font-semibold',
                  currentLang === 'en'
                    ? 'border border-sky-400/40 bg-white/[0.08] text-white'
                    : 'border border-transparent text-slate-500'
                ]"
              >
                EN
              </button>
            </div>
            
            <a
              :href="demoHref"
              class="mx-2 mb-2 block rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-300 hover:bg-white/[0.05]"
              @click="open = false"
            >
              {{ copy.nav.ctaSecondary }}
            </a>
            
            <RouterLink
              to="/login"
              class="mx-2 mb-3 block rounded-xl bg-gradient-to-r from-[#0070F3] to-sky-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
              @click="open = false"
            >
              {{ copy.nav.login }}
            </RouterLink>
          </nav>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Menu, X } from 'lucide-vue-next';

interface NavLink {
  href: string;
  label: string;
}

interface Copy {
  nav: {
    features: string;
    pricing: string;
    clients: string;
    ctaSecondary: string;
    ctaPrimary: string;
    menuTitle: string;
    login: string;
    openMenu: string;
    closeMenu: string;
  };
}

const props = defineProps<{
  lang: 'es' | 'en';
  copy: Copy;
}>();

const emit = defineEmits<{
  'update:lang': [lang: 'es' | 'en'];
}>();

const route = useRoute();
const open = ref(false);
const scrolled = ref(false);
const pastHero = ref(false);
const currentLang = computed({
  get: () => props.lang,
  set: (val) => emit('update:lang', val)
});

// REGLA DINÁMICA: Array de enlaces del menú - NO están hardcodeados en el template
const navLinks = computed<NavLink[]>(() => [
  { href: '/#features', label: props.copy.nav.features },
  { href: '/pricing', label: props.copy.nav.pricing },
  { href: '/#clientes', label: props.copy.nav.clients },
]);

const demoHref = computed(() => {
  const subject = currentLang.value === 'es' ? 'Demo Efectivo 360' : 'Efectivo 360 demo';
  return `mailto:hola@efectivo360.com?subject=${encodeURIComponent(subject)}`;
});

// Sticky Header con efectos de transparencia al scroll
const handleScroll = () => {
  const scrollY = window.scrollY;
  scrolled.value = scrollY > 16;
  pastHero.value = scrollY > window.innerHeight * 0.8;
};

onMounted(() => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// Lock body scroll when mobile menu is open
watch(open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close menu on route change
watch(() => route.path, () => {
  open.value = false;
});

const setLang = (lang: 'es' | 'en') => {
  currentLang.value = lang;
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
