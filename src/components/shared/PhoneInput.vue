<template>
  <div>
    <div class="flex gap-2">
      <select v-model="country" class="w-[6rem] h-9 px-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
        <option v-for="(cfg, code) in config" :key="code" :value="code">{{ cfg.flag }} {{ cfg.prefix }}</option>
      </select>
      <input
        :value="displayValue"
        @input="onInput"
        :placeholder="config[country]?.placeholder || '(0000) 000-0000'"
        :maxlength="config[country]?.maxInput || 15"
        class="flex-1 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        :class="modelValue.trim() && displayValue.length > 0 && !valid ? 'border-red-300 bg-red-50' : ''"
      />
    </div>
    <!-- Operator info for Venezuela -->
    <p v-if="country === 'VE' && veCodeInfo" class="text-[10px] mt-1 ml-[6.5rem]" :class="veCodeInfo.tipo === 'móvil' ? 'text-blue-500' : 'text-slate-500'">
      {{ veCodeInfo.tipo === 'móvil' ? '📱' : '🏢' }} {{ veCodeInfo.empresa || veCodeInfo.estado }}
    </p>
    <p v-if="country === 'VE' && veError" class="text-[10px] text-red-500 mt-1 ml-[6.5rem]">{{ veError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const country = ref('VE');
const number = ref('');

const veCodes = [
  { codigo: '0412', tipo: 'móvil', empresa: 'Digitel' },
  { codigo: '0422', tipo: 'móvil', empresa: 'Digitel (Expansión)' },
  { codigo: '0414', tipo: 'móvil', empresa: 'Movistar' },
  { codigo: '0424', tipo: 'móvil', empresa: 'Movistar (Expansión)' },
  { codigo: '0416', tipo: 'móvil', empresa: 'Movilnet' },
  { codigo: '0426', tipo: 'móvil', empresa: 'Movilnet (Expansión)' },
  { codigo: '0212', tipo: 'fijo', estado: 'Distrito Capital, Miranda, La Guaira' },
  { codigo: '0241', tipo: 'fijo', estado: 'Carabobo (Valencia)' },
  { codigo: '0242', tipo: 'fijo', estado: 'Carabobo (Puerto Cabello)' },
  { codigo: '0245', tipo: 'fijo', estado: 'Carabobo (Guacara / San Diego)' },
  { codigo: '0243', tipo: 'fijo', estado: 'Aragua (Maracay)' },
  { codigo: '0244', tipo: 'fijo', estado: 'Aragua (Zonas Internas)' },
  { codigo: '0246', tipo: 'fijo', estado: 'Guárico' },
  { codigo: '0248', tipo: 'fijo', estado: 'Amazonas' },
  { codigo: '0251', tipo: 'fijo', estado: 'Lara (Barquisimeto)' },
  { codigo: '0252', tipo: 'fijo', estado: 'Lara (Carora)' },
  { codigo: '0253', tipo: 'fijo', estado: 'Lara (El Tocuyo)' },
  { codigo: '0254', tipo: 'fijo', estado: 'Yaracuy' },
  { codigo: '0258', tipo: 'fijo', estado: 'Cojedes' },
  { codigo: '0259', tipo: 'fijo', estado: 'Falcón' },
  { codigo: '0261', tipo: 'fijo', estado: 'Zulia (Maracaibo)' },
  { codigo: '0262', tipo: 'fijo', estado: 'Zulia (Zonas Internas)' },
  { codigo: '0263', tipo: 'fijo', estado: 'Zulia (Costa Oriental - Norte)' },
  { codigo: '0264', tipo: 'fijo', estado: 'Zulia (Costa Oriental - Sur)' },
  { codigo: '0265', tipo: 'fijo', estado: 'Zulia (Cabimas / Lagunillas)' },
  { codigo: '0266', tipo: 'fijo', estado: 'Zulia (Zonas Occidentales)' },
  { codigo: '0267', tipo: 'fijo', estado: 'Zulia (Zonas Sur)' },
  { codigo: '0271', tipo: 'fijo', estado: 'Trujillo' },
  { codigo: '0273', tipo: 'fijo', estado: 'Barinas' },
  { codigo: '0274', tipo: 'fijo', estado: 'Mérida' },
  { codigo: '0275', tipo: 'fijo', estado: 'Zulia (Sur del Lago)' },
  { codigo: '0276', tipo: 'fijo', estado: 'Táchira (San Cristóbal)' },
  { codigo: '0277', tipo: 'fijo', estado: 'Táchira (Zonas Internas)' },
  { codigo: '0278', tipo: 'fijo', estado: 'Apure' },
  { codigo: '0279', tipo: 'fijo', estado: 'Portuguesa' },
  { codigo: '0281', tipo: 'fijo', estado: 'Anzoátegui (Barcelona / Puerto La Cruz)' },
  { codigo: '0282', tipo: 'fijo', estado: 'Anzoátegui (Zonas Centrales)' },
  { codigo: '0283', tipo: 'fijo', estado: 'Anzoátegui (El Tigre)' },
  { codigo: '0285', tipo: 'fijo', estado: 'Bolívar (Ciudad Bolívar)' },
  { codigo: '0286', tipo: 'fijo', estado: 'Bolívar (Ciudad Guayana / Puerto Ordaz)' },
  { codigo: '0287', tipo: 'fijo', estado: 'Delta Amacuro' },
  { codigo: '0288', tipo: 'fijo', estado: 'Bolívar (Zonas del Sur)' },
  { codigo: '0291', tipo: 'fijo', estado: 'Monagas (Maturín)' },
  { codigo: '0292', tipo: 'fijo', estado: 'Monagas (Zonas Internas)' },
  { codigo: '0293', tipo: 'fijo', estado: 'Sucre (Cumaná)' },
  { codigo: '0294', tipo: 'fijo', estado: 'Sucre (Carúpano)' },
  { codigo: '0295', tipo: 'fijo', estado: 'Nueva Esparta (Margarita)' },
];

const config: Record<string, { prefix: string; placeholder: string; maxInput: number; maxDigits: number; mask: string; flag: string }> = {
  VE: { prefix: '+58', placeholder: '(0412) 000-0000', maxInput: 14, maxDigits: 11, mask: '(####) ###-####', flag: '🇻🇪' },
  CO: { prefix: '+57', placeholder: '300 000 0000', maxInput: 12, maxDigits: 10, mask: '### ### ####', flag: '🇨🇴' },
  PE: { prefix: '+51', placeholder: '900 000 000', maxInput: 11, maxDigits: 9, mask: '### ### ###', flag: '🇵🇪' },
  CL: { prefix: '+56', placeholder: '9 0000 0000', maxInput: 9, maxDigits: 9, mask: '# #### ####', flag: '🇨🇱' },
  US: { prefix: '+1', placeholder: '(000) 000-0000', maxInput: 14, maxDigits: 10, mask: '(###) ###-####', flag: '🇺🇸' },
  OT: { prefix: '+XX', placeholder: 'Número', maxInput: 20, maxDigits: 15, mask: '', flag: '🌐' },
};

watch(() => props.modelValue, (v) => {
  if (!v) { number.value = ''; return; }
  for (const [code, cfg] of Object.entries(config)) {
    if (v.startsWith(cfg.prefix)) {
      country.value = code;
      number.value = v.slice(cfg.prefix.length);
      return;
    }
  }
  number.value = v;
}, { immediate: true });

const displayValue = computed(() => number.value);

const veCodeInfo = computed(() => {
  if (country.value !== 'VE') return null;
  const digits = number.value.replace(/\D/g, '');
  if (digits.length < 4) return null;
  return veCodes.find(c => c.codigo === digits.slice(0, 4)) || null;
});

const veError = computed(() => {
  if (country.value !== 'VE') return '';
  const digits = number.value.replace(/\D/g, '');
  if (digits.length < 4) return '';
  if (!veCodeInfo.value) return 'Código de área u operadora no válido en Venezuela';
  return '';
});

const valid = computed(() => {
  if (!number.value) return false;
  const digits = number.value.replace(/\D/g, '');
  const cfg = config[country.value];
  if (!cfg) return false;
  if (country.value === 'VE' && !veCodeInfo.value) return digits.length < 4;
  return digits.length >= Math.max(cfg.maxDigits - 1, 7);
});

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  let digits = v.replace(/\D/g, '');
  const cfg = config[country.value];
  if (!cfg) { number.value = digits; emit('update:modelValue', digits); return; }
  digits = digits.slice(0, cfg.maxDigits);
  const mask = cfg.mask;
  if (!mask) { number.value = digits; emit('update:modelValue', cfg.prefix + digits); return; }

  let out = ''; let di = 0;
  for (const ch of mask) {
    if (di >= digits.length) break;
    if (ch === '#') out += digits[di++] || '';
    else out += ch;
  }
  number.value = out;
  emit('update:modelValue', cfg.prefix + digits);
}

watch(country, () => { number.value = ''; emit('update:modelValue', ''); });
</script>
