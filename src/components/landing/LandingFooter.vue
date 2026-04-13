<template>
  <footer
    id="contacto"
    class="relative z-[1] border-t border-white/[0.08] bg-[#020204] px-4 py-16 md:px-8"
  >
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <!-- Brand Column -->
        <div>
          <p class="text-lg font-semibold tracking-tight text-white">Efectivo 360</p>
          <p class="mt-2 max-w-xs text-sm text-slate-500">{{ copy.footer.tagline }}</p>
        </div>

        <!-- Product Links -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {{ copy.footer.product }}
          </p>
          <ul class="mt-4 space-y-2">
            <li v-for="key in productLinks" :key="key">
              <a
                v-if="key === 'features'"
                href="#features"
                class="text-sm text-slate-400 transition-colors hover:text-[#00D492]"
              >
                {{ copy.footer.links[key] }}
              </a>
              <RouterLink
                v-else-if="key === 'pricing'"
                :to="`/${currentLang}/pricing`"
                class="text-sm text-slate-400 transition-colors hover:text-[#00D492]"
              >
                {{ copy.footer.links[key] }}
              </RouterLink>
              <a
                v-else
                :href="`mailto:hola@efectivo360.com?subject=${encodeURIComponent(copy.footer.links[key])}`"
                class="text-sm text-slate-400 transition-colors hover:text-[#00D492]"
              >
                {{ copy.footer.links[key] }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Company Links -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {{ copy.footer.company }}
          </p>
          <ul class="mt-4 space-y-2">
            <li v-for="key in companyLinks" :key="key">
              <a
                :href="`mailto:hola@efectivo360.com?subject=${encodeURIComponent(copy.footer.links[key])}`"
                class="text-sm text-slate-400 transition-colors hover:text-[#00D492]"
              >
                {{ copy.footer.links[key] }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal & Language -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {{ copy.footer.legal }}
          </p>
          <ul class="mt-4 space-y-2">
            <li v-for="key in legalLinks" :key="key">
              <span class="cursor-not-allowed text-sm text-slate-600">{{ copy.footer.links[key] }}</span>
            </li>
          </ul>

          <!-- Language Selector -->
          <div class="mt-8">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {{ copy.footer.language }}
            </p>
            <div class="mt-2 flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1 text-xs font-medium backdrop-blur-md">
              <button
                @click="$emit('update:lang', 'es')"
                :class="[
                  'rounded-md px-3 py-1.5 transition-all',
                  lang === 'es'
                    ? 'border border-sky-400/40 bg-white/[0.08] text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)]'
                    : 'text-slate-500 hover:text-slate-300'
                ]"
              >
                ES
              </button>
              <button
                @click="$emit('update:lang', 'en')"
                :class="[
                  'rounded-md px-3 py-1.5 transition-all',
                  lang === 'en'
                    ? 'border border-sky-400/40 bg-white/[0.08] text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)]'
                    : 'text-slate-500 hover:text-slate-300'
                ]"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-slate-600 md:flex-row">
        <p>
          © {{ currentYear }} Efectivo 360. {{ copy.footer.rights }}
        </p>
        <RouterLink
          to="/login"
          class="text-slate-500 transition-colors hover:text-[#00D492]"
        >
          {{ copy.nav.ctaPrimary }}
        </RouterLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Copy {
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    language: string;
    rights: string;
    links: Record<string, string>;
  };
  nav: {
    ctaPrimary: string;
  };
}

const props = defineProps<{
  lang: 'es' | 'en';
  copy: Copy;
}>();

defineEmits<{
  'update:lang': [lang: 'es' | 'en'];
}>();

// REGLA DINÁMICA: Links organizados en arrays - NO hardcodeados en el template
const productLinks = ['features', 'pricing', 'security'] as const;
const companyLinks = ['about', 'careers', 'contact'] as const;
const legalLinks = ['privacy', 'terms'] as const;

const currentLang = computed(() => props.lang);
const currentYear = computed(() => new Date().getFullYear());
</script>
