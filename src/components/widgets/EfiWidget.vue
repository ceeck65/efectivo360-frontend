<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sparkles, Brain, Star, AlertTriangle } from 'lucide-vue-next';

interface EfiTip {
  id: string;
  message: string;
  category: 'sales' | 'inventory' | 'pricing' | 'general' | 'category_mismatch';
  priority: 'high' | 'medium' | 'low';
}

const props = defineProps<{
  tips?: EfiTip[];
  industryType?: string;
  mismatchedCategories?: string[];
}>();

const tips = props.tips || [];

// Detectar categorías que no coinciden con el tipo de negocio
const mismatchedCategories = props.mismatchedCategories || [];

// Generar tip de categoría incorrecta si hay categorías que no pertenecen
const categoryMismatchTip = computed<EfiTip | null>(() => {
  if (mismatchedCategories.length === 0) return null;
  
  const categoryList = mismatchedCategories.slice(0, 3).join(', ');
  const moreText = mismatchedCategories.length > 3 ? ` y ${mismatchedCategories.length - 3} más` : '';
  
  return {
    id: 'category-mismatch',
    message: `Detecté categorías que no corresponden a tu tipo de negocio: ${categoryList}${moreText}. ¿Quieres recategorizarlas o eliminarlas?`,
    category: 'category_mismatch',
    priority: 'high',
  };
});

// Combinar tips proporcionados con el de categoría incorrecta
const allTips = computed<EfiTip[]>(() => {
  const baseTips = [...tips];
  if (categoryMismatchTip.value) {
    baseTips.unshift(categoryMismatchTip.value);
  }
  return baseTips.length > 0 ? baseTips : [
    {
      id: 'default',
      message: 'Noté que los jueves vendes más calzado deportivo. ¿Quieres crear una oferta especial para ese día?',
      category: 'sales',
      priority: 'high',
    },
  ];
});

const currentTipIndex = ref(0);
const currentTip = computed(() => allTips.value[currentTipIndex.value]);

const nextTip = () => {
  currentTipIndex.value = (currentTipIndex.value + 1) % allTips.value.length;
};

const prevTip = () => {
  currentTipIndex.value = currentTipIndex.value === 0 ? allTips.value.length - 1 : currentTipIndex.value - 1;
};

const categoryColors = {
  sales: 'from-blue-500/20 to-indigo-500/10',
  inventory: 'from-emerald-500/20 to-teal-500/10',
  pricing: 'from-amber-500/20 to-orange-500/10',
  general: 'from-slate-500/20 to-gray-500/10',
  category_mismatch: 'from-red-500/20 to-rose-500/10',
};

const categoryIcons = {
  sales: Star,
  inventory: Brain,
  pricing: Sparkles,
  general: Sparkles,
  category_mismatch: AlertTriangle,
};
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_50px_-18px_rgba(139,92,246,0.2)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0a0d14] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_28px_55px_-18px_rgba(0,0,0,0.55)]">
    <!-- Gradient background -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:via-purple-500/8 dark:to-indigo-500/10" />
    <!-- Top accent bar with gradient -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-violet-500 via-purple-500 to-indigo-500" />
    <!-- Glow effect -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(167,139,250,0.12),transparent_55%)]" />
    
    <div class="relative z-[2]">
      <!-- Header -->
      <div class="mb-4 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 ring-1 ring-violet-500/25 dark:from-violet-500/15 dark:to-indigo-500/15 dark:text-violet-300 dark:ring-violet-400/30" aria-hidden>
          <Brain class="h-[18px] w-[18px] stroke-[1.5]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Tip de Efi</h3>
            <Sparkles class="h-3.5 w-3.5 text-violet-500" />
          </div>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">IA + Fiscal Intelligence</p>
        </div>
      </div>

      <!-- Tip Content -->
      <div :class="['relative rounded-xl border p-4 backdrop-blur-sm transition-all', 'border-violet-200/60 bg-gradient-to-br', categoryColors[currentTip.category]]">
        <div class="flex items-start gap-3">
          <component :is="categoryIcons[currentTip.category]" class="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <p class="flex-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {{ currentTip.message }}
          </p>
        </div>
        
        <!-- Priority Badge -->
        <div class="mt-3 flex items-center justify-between">
          <span :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', 
            currentTip.priority === 'high' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' : 
            currentTip.priority === 'medium' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' : 
            'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400']">
            {{ currentTip.priority === 'high' ? 'Prioridad Alta' : currentTip.priority === 'medium' ? 'Prioridad Media' : 'Informativo' }}
          </span>
          
          <!-- Navigation dots -->
          <div class="flex items-center gap-1.5">
            <button 
              @click="prevTip"
              class="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-700/50 dark:hover:text-slate-300 transition-colors"
              aria-label="Tip anterior"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ currentTipIndex + 1 }} / {{ allTips.length }}</span>
            <button 
              @click="nextTip"
              class="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-700/50 dark:hover:text-slate-300 transition-colors"
              aria-label="Siguiente tip"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <button class="mt-3 w-full rounded-lg border border-violet-200/60 bg-violet-50/50 px-3 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20">
        Aplicar recomendación
      </button>
    </div>
  </div>
</template>
