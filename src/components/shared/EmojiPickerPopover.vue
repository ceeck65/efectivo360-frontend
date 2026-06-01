<template>
  <div ref="containerRef" class="relative inline-block">
    <!-- Trigger -->
    <button type="button" @click="isOpen = !isOpen"
      class="flex items-center justify-center transition-all duration-200 cursor-pointer"
      :class="currentTriggerClass">
      <span v-if="modelValue" class="leading-none">{{ modelValue }}</span>
      <Smile v-else class="text-slate-400" :class="currentIconSizeClass" />
    </button>

    <!-- Popover -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[100]" @click.self="isOpen = false">
        <div class="absolute bg-white border border-slate-200 rounded-2xl shadow-xl w-80 max-h-96 flex flex-col overflow-hidden"
          :style="popoverStyle">
          <!-- Header -->
          <div class="shrink-0 px-3 pt-3 pb-2 border-b border-slate-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Emoji</span>
              <button @click="isOpen = false" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X class="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input v-model="searchQuery" type="text" placeholder="Buscar emoji..."
                class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <!-- Categories tabs -->
          <div class="shrink-0 flex gap-1 px-3 pt-2 overflow-x-auto scrollbar-thin">
            <button v-for="cat in emojiCategories" :key="cat.key" type="button"
              @click="activeTab = cat.key"
              class="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md transition-all whitespace-nowrap"
              :class="activeTab === cat.key ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'">
              {{ cat.label }}
            </button>
          </div>

          <!-- Emoji grid -->
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="filteredEmojis.length === 0" class="text-center py-6 text-xs text-slate-400">
              Sin resultados
            </div>
            <div v-else class="grid grid-cols-8 gap-1">
              <button v-for="emoji in filteredEmojis" :key="emoji" type="button"
                @click="selectEmoji(emoji)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all hover:bg-slate-100 hover:scale-110 active:scale-95"
                :class="modelValue === emoji ? 'bg-blue-100 ring-2 ring-blue-400/50' : ''">
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="shrink-0 px-3 py-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[10px] text-slate-400">{{ filteredEmojis.length }} emojis</span>
            <button v-if="modelValue" type="button" @click="selectEmoji('')"
              class="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { X, Search, Smile } from 'lucide-vue-next';

interface Props {
  modelValue?: string;
  triggerClass?: string;
  iconSizeClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  triggerClass: 'w-12 h-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-2xl',
  iconSizeClass: 'w-5 h-5',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const currentTriggerClass = computed(() => props.triggerClass);
const currentIconSizeClass = computed(() => props.iconSizeClass);

const isOpen = ref(false);
const searchQuery = ref('');
const activeTab = ref('all');
const containerRef = ref<HTMLElement | null>(null);

const popoverStyle = computed(() => {
  const base: Record<string, string> = { position: 'fixed' };
  if (!containerRef.value) return base;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < 380) {
    base.top = `${rect.top - 8}px`;
    base.right = `${window.innerWidth - rect.right}px`;
    base.transform = 'translateY(-100%)';
  } else {
    base.top = `${rect.bottom + 8}px`;
    base.left = `${rect.left}px`;
  }
  return base;
});

const emojiCategories = [
  { key: 'all', label: 'Todos' },
  { key: 'retail', label: 'Retail' },
  { key: 'food', label: 'Alimentos' },
  { key: 'fashion', label: 'Moda' },
  { key: 'tech', label: 'Tecnología' },
  { key: 'health', label: 'Salud' },
  { key: 'home', label: 'Hogar' },
  { key: 'general', label: 'General' },
];

const emojiDataset: Record<string, string[]> = {
  retail: ['🛍️', '🛒', '🏪', '🏬', '🏷️', '💰', '💳', '🧾', '📦', '📫', '🎁', '🏷️'],
  food: ['🥩', '🧀', '🍞', '🍎', '🥛', '🧃', '🍿', '🥗', '🍕', '🍔', '☕', '🧋', '🍺', '🥤', '🍯', '🌾', '🌽', '🥕', '🥚', '🐟'],
  fashion: ['👟', '👠', '👕', '👗', '🧥', '🧣', '👜', '💍', '🧢', '👔', '🩴', '🧦'],
  tech: ['💻', '📱', '🖥️', '🖨️', '🔋', '🎧', '📷', '🎮', '🕹️', '💾', '🔌', '📡'],
  health: ['💊', '🩺', '🧴', '🩹', '❤️', '🏥', '💉', '🧬', '🩻', '🧪'],
  home: ['🏠', '🛋️', '🧹', '🪟', '🛏️', '🧺', '🍽️', '🔧', '🔨', '🪣', '💡', '🕯️'],
  general: ['📦', '⭐', '🔥', '🎯', '📊', '🏢', '🔧', '⚡', '💎', '🏆', '📋', '🗂️', '📁', '🔖', '✅', '❗', '💫', '🌟', '🎯', '📌'],
};

const allEmojis = computed(() => {
  const set = new Set<string>();
  for (const emojis of Object.values(emojiDataset)) {
    for (const e of emojis) set.add(e);
  }
  return Array.from(set);
});

const filteredEmojis = computed(() => {
  let pool: string[];
  if (activeTab.value === 'all') {
    pool = allEmojis.value;
  } else {
    pool = emojiDataset[activeTab.value] || [];
  }
  return pool;
});

function selectEmoji(emoji: string) {
  emit('update:modelValue', emoji);
  isOpen.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));

watch(isOpen, (v) => { if (!v) searchQuery.value = ''; });
</script>
