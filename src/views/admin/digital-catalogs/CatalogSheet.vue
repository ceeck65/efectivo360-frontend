<script setup lang="ts">
import { computed } from 'vue';
import { iconDataUri } from './brandIcons';
import { formatStock, formatVes, priceParts, type CatalogItem, type SheetOptions } from './catalog';

// Una hoja A4 (794 x 1123 px a 96 dpi). Es puramente presentacional: la usa tanto la
// vista previa en vivo como la exportación a PDF, así lo que ves es lo que se descarga.
// Los textos largos se truncan por caracteres (sin line-clamp) para que el alto de las tarjetas sea
// predecible y la hoja siempre quepa en una página. Todo va con estilos en línea para que el
// rasterizado (html-to-image) no dependa de Tailwind ni del modo oscuro.
const props = defineProps<{
  products: CatalogItem[];
  pageIndex: number;
  pageCount: number;
  options: SheetOptions;
}>();

const first = computed(() => props.pageIndex === 0);
const brand = computed(() => props.options.brand);
const year = new Date().getFullYear();

function parseHex(hex: string): number[] {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
}

const onBrand = computed(() => {
  const [r, g, b] = parseHex(brand.value);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#0f172a' : '#ffffff';
});

function shorten(text: string, max: number): string {
  const value = String(text || '').trim();
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function prices(product: CatalogItem) {
  return priceParts(product, props.options.currencyMode, props.options.rate);
}

function stockStyle(product: CatalogItem) {
  return { color: product.stock > 0 ? '#15803d' : '#b91c1c', fontWeight: 700, whiteSpace: 'nowrap' };
}

// Categoría y marca en una sola línea sobre el nombre.
function tagLine(product: CatalogItem): string {
  const parts = [product.category, props.options.showBrand ? product.brand : ''].filter(Boolean);
  return parts.join(' · ');
}

const gridConfig = computed(() =>
  props.options.layout === 'grid3'
    ? { cols: 3, rows: 3, gap: 14, compact: true }
    : { cols: 2, rows: 2, gap: 20, compact: false }
);

const gridStyle = computed(() => ({
  display: 'grid',
  height: '100%',
  gap: `${gridConfig.value.gap}px`,
  gridTemplateColumns: `repeat(${gridConfig.value.cols}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${gridConfig.value.rows}, minmax(0, 1fr))`,
}));

// Cada dato de contacto se muestra con su ícono (sin etiquetas de texto).
const contactItems = computed(() => {
  const c = props.options.contact;
  const color = brand.value;
  return [
    c.phone && { icon: iconDataUri('whatsapp', color), text: c.phone },
    c.address && { icon: iconDataUri('pin', color), text: c.address },
    c.instagram && { icon: iconDataUri('instagram', color), text: c.instagram },
    c.tiktok && { icon: iconDataUri('tiktok', color), text: c.tiktok },
    c.facebook && { icon: iconDataUri('facebook', color), text: c.facebook },
  ].filter(Boolean) as { icon: string; text: string }[];
});

const showRate = computed(() => !!props.options.rate && props.options.currencyMode !== 'USD');
const rateText = computed(() => (props.options.rate ? `1 USD = ${formatVes(props.options.rate)}` : ''));
const storeInitial = computed(() => (props.options.store.name || 'T').charAt(0).toUpperCase());
</script>

<template>
  <section
    data-pdf-page
    style="display: flex; flex-direction: column; background: #fff; color: #1e293b; width: 794px; height: 1123px; overflow: hidden; font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  >
    <!-- Encabezado principal (primera hoja) -->
    <header
      v-if="first"
      :style="{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '20px', background: brand, color: onBrand, padding: '28px 40px' }"
    >
      <img
        v-if="options.store.logo"
        :src="options.store.logo"
        :alt="options.store.name"
        style="height: 72px; width: 96px; object-fit: contain; background: #fff; border-radius: 12px; padding: 4px"
      />
      <div
        v-else
        :style="{ display: 'flex', height: '72px', width: '72px', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#fff', color: brand, fontSize: '32px', fontWeight: 800 }"
      >
        {{ storeInitial }}
      </div>
      <div style="min-width: 0; flex: 1">
        <p v-if="options.store.name" style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85">
          {{ options.store.name }}
        </p>
        <h1 style="font-size: 26px; font-weight: 800; line-height: 1.15">{{ options.title || 'Catálogo' }}</h1>
        <p v-if="options.subtitle" style="margin-top: 4px; font-size: 14px; opacity: 0.92">{{ options.subtitle }}</p>
      </div>
      <div style="text-align: right; font-size: 12px; line-height: 1.5">
        <p style="font-weight: 600">{{ options.date }}</p>
        <template v-if="showRate">
          <p>Tasa de referencia</p>
          <p style="font-weight: 700">{{ rateText }}</p>
        </template>
      </div>
    </header>

    <!-- Encabezado compacto (hojas siguientes) -->
    <header
      v-else
      :style="{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '12px', borderBottom: `4px solid ${brand}`, padding: '16px 40px' }"
    >
      <img
        v-if="options.store.logo"
        :src="options.store.logo"
        alt=""
        style="height: 36px; width: 48px; object-fit: contain"
      />
      <p style="flex: 1; font-size: 15px; font-weight: 700">{{ options.title }}</p>
      <p style="font-size: 12px; color: #64748b">Hoja {{ pageIndex + 1 }} de {{ pageCount }}</p>
    </header>

    <!-- Cuerpo -->
    <div style="flex: 1; min-height: 0; padding: 24px 40px">
      <div
        v-if="!products.length"
        style="display: flex; height: 100%; align-items: center; justify-content: center; color: #94a3b8; font-size: 15px"
      >
        Selecciona productos para armar el catálogo.
      </div>

      <!-- Grid 2x2 / 3x3 -->
      <div v-else-if="options.layout !== 'list'" :style="gridStyle">
        <article
          v-for="product in products"
          :key="product.id"
          style="display: flex; min-height: 0; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff"
        >
          <div style="position: relative; min-height: 0; flex: 1; background: #f1f5f9">
            <img
              v-if="product.image"
              :src="product.image"
              :alt="product.name"
              style="position: absolute; inset: 0; height: 100%; width: 100%; object-fit: contain; background: #fff"
            />
            <div
              v-else
              style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 12px"
            >
              Sin imagen
            </div>
          </div>

          <div :style="{ flexShrink: 0, padding: gridConfig.compact ? '9px 11px 10px' : '12px 14px 14px' }">
            <p
              v-if="tagLine(product)"
              :style="{
                marginBottom: '3px',
                color: brand,
                fontSize: gridConfig.compact ? '9px' : '10px',
                fontWeight: 700,
                lineHeight: 1.4,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }"
            >
              {{ shorten(tagLine(product), gridConfig.compact ? 34 : 48) }}
            </p>
            <p :style="{ fontSize: gridConfig.compact ? '12px' : '16px', fontWeight: 700, lineHeight: 1.25 }">
              {{ shorten(product.name, gridConfig.compact ? 50 : 60) }}
            </p>
            <p v-if="options.showSku && product.sku" style="margin-top: 2px; font-size: 10px; color: #94a3b8">SKU: {{ product.sku }}</p>
            <div style="margin-top: 8px; display: flex; align-items: flex-end; justify-content: space-between; gap: 6px">
              <div>
                <p :style="{ color: brand, fontSize: gridConfig.compact ? '15px' : '22px', fontWeight: 800, lineHeight: 1.1 }">
                  {{ prices(product).main }}
                </p>
                <p
                  v-if="prices(product).sub"
                  :style="{ marginTop: '2px', color: '#64748b', fontSize: gridConfig.compact ? '10px' : '12px' }"
                >
                  {{ prices(product).sub }}
                </p>
              </div>
              <span v-if="options.showStock" :style="{ ...stockStyle(product), fontSize: '11px' }">
                {{ formatStock(product) }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- Lista -->
      <div v-else style="display: flex; flex-direction: column; gap: 8px">
        <article
          v-for="product in products"
          :key="product.id"
          style="display: flex; height: 84px; align-items: center; gap: 14px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 14px 8px 8px"
        >
          <div style="position: relative; height: 66px; width: 66px; flex-shrink: 0; overflow: hidden; border-radius: 8px; background: #f1f5f9">
            <img
              v-if="product.image"
              :src="product.image"
              :alt="product.name"
              style="position: absolute; inset: 0; height: 100%; width: 100%; object-fit: contain; background: #fff"
            />
          </div>

          <div style="min-width: 0; flex: 1">
            <p style="font-size: 14px; font-weight: 700; line-height: 1.25">
              {{ shorten(product.name, 60) }}
            </p>
            <p style="margin-top: 2px; font-size: 10px; color: #94a3b8; white-space: nowrap">
              <span v-if="options.showSku && product.sku">SKU: {{ product.sku }}</span>
              <span v-if="options.showSku && product.sku && tagLine(product)"> · </span>
              <span v-if="tagLine(product)" :style="{ color: brand, fontWeight: 600 }">{{ shorten(tagLine(product), 60) }}</span>
            </p>
          </div>

          <div style="flex-shrink: 0; text-align: right">
            <p :style="{ color: brand, fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }">{{ prices(product).main }}</p>
            <p v-if="prices(product).sub" style="margin-top: 2px; font-size: 11px; color: #64748b">{{ prices(product).sub }}</p>
            <span v-if="options.showStock" :style="{ ...stockStyle(product), display: 'inline-block', marginTop: '3px', fontSize: '11px' }">
              {{ formatStock(product) }}
            </span>
          </div>
        </article>
      </div>
    </div>

    <!-- Pie de página -->
    <footer style="flex-shrink: 0; border-top: 1px solid #e2e8f0; padding: 14px 40px 18px; font-size: 11px; color: #64748b">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px">
        <div style="min-width: 0; flex: 1">
          <div v-if="contactItems.length" style="display: flex; flex-wrap: wrap; gap: 4px 18px">
            <span
              v-for="(item, index) in contactItems"
              :key="index"
              style="display: inline-flex; align-items: center; gap: 6px; line-height: 1.5"
            >
              <img :src="item.icon" alt="" style="height: 14px; width: 14px" />{{ item.text }}
            </span>
          </div>
          <p v-if="options.contact.note" style="margin-top: 3px; font-size: 10px; font-style: italic; color: #94a3b8">
            {{ options.contact.note }}
          </p>
        </div>
        <div style="flex-shrink: 0; text-align: right; font-size: 10px; line-height: 1.5; color: #94a3b8">
          <p>© {{ year }} {{ options.store.name }} · {{ pageIndex + 1 }} / {{ pageCount }}</p>
          <p>Generado con <span :style="{ color: brand, fontWeight: 700 }">Efectivo 360</span></p>
        </div>
      </div>
    </footer>
  </section>
</template>
