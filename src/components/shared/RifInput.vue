<template>
  <div class="flex gap-2">
    <select v-model="rifType" class="w-[4.5rem] h-9 px-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
      <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
    </select>
    <input
      :value="displayValue"
      @input="onInput"
      :placeholder="placeholder"
      :maxlength="maxLen"
      class="flex-1 h-9 px-3 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors"
      :class="modelValue.trim() && !valid ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500 focus:border-blue-500'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  label?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const types = ['V', 'E', 'J', 'G'];
const rifType = ref('J');
const rifNumber = ref('');

// Parse initial value
watch(() => props.modelValue, (v) => {
  if (!v) { rifType.value = 'J'; rifNumber.value = ''; return; }
  const clean = v.replace(/[^VJEG0-9]/g, '');
  const match = clean.match(/^([VJEG])(\d.*)$/);
  if (match) {
    rifType.value = match[1];
    rifNumber.value = match[2] || '';
  } else {
    rifType.value = 'J';
    rifNumber.value = clean;
  }
}, { immediate: true });

const maxLen = computed(() => rifType.value === 'V' || rifType.value === 'E' ? 12 : 14);

const placeholder = computed(() => rifType.value === 'V' || rifType.value === 'E' ? '26.789.123' : '40.123.456-7');

const displayValue = computed(() => rifNumber.value);

const valid = computed(() => {
  const digits = rifNumber.value.replace(/\D/g, '');
  const min = rifType.value === 'V' || rifType.value === 'E' ? 7 : 8;
  return digits.length >= min;
});

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  let digits = v.replace(/[^0-9]/g, '');
  const isCI = rifType.value === 'V' || rifType.value === 'E';
  const max = isCI ? 8 : 9;
  if (digits.length > max) digits = digits.slice(0, max);

  let formatted = '';
  if (isCI) {
    if (digits.length <= 3) formatted = digits;
    else if (digits.length <= 6) formatted = digits.slice(0, -3) + '.' + digits.slice(-3);
    else formatted = digits.slice(0, -6) + '.' + digits.slice(-6, -3) + '.' + digits.slice(-3);
  } else {
    if (digits.length <= 2) formatted = digits;
    else if (digits.length <= 5) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
    else if (digits.length <= 8) formatted = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
    else formatted = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '-' + digits.slice(8);
  }
  rifNumber.value = formatted;
  emit('update:modelValue', rifType.value + digits);
}

watch(rifType, () => { rifNumber.value = ''; });
</script>
