# Frontend Vue - Efectivo 360

Proyecto Vue 3 + Vite + Tailwind CSS migrado desde React.

## Arquitectura

### Reglas de Oro (Cero Tolerancia al Hardcoding)

1. **Cero Datos Estáticos**: El frontend es una cáscara vacía. No hay objetos como `DEFAULT_CURRENCIES`, `BANKS_LIST` o `ICONS_MAP`.

2. **Initial Bootstrap Store (Pinia)**: Al cargar la app, se llama a un endpoint de configuración global (`/api/v1/global-config/`) que trae:
   - Monedas (reglas, símbolos, decimales)
   - Categorías de pago
   - Iconos
   - Configuración del Tenant

3. **Componentes Atómicos**: Look & Feel migrado usando Tailwind CSS con lógica reactiva de Vue 3.

4. **Helper de Formateo**: Plugin global `formatMoney` que consume el Store de Pinia.

## Estructura del Proyecto

```
frontend-vue/
├── src/
│   ├── components/
│   │   ├── payment-methods/     # Componentes del catálogo
│   │   │   ├── ColorPicker.vue
│   │   │   ├── MetadataBuilder.vue
│   │   │   ├── TemplateCard.vue
│   │   │   └── TemplateFormModal.vue
│   │   └── ui/                  # Componentes UI base
│   ├── composables/             # Composables reutilizables
│   │   └── useApi.ts            # HTTP client con Axios
│   ├── plugins/                 # Plugins Vue
│   │   └── formatMoney.ts       # Plugin de formato de moneda
│   ├── router/                  # Configuración de rutas
│   ├── stores/                  # Pinia stores
│   │   ├── config.ts            # Bootstrap global
│   │   └── auth.ts              # Autenticación
│   ├── types/                   # Typescript types
│   ├── utils/                   # Utilidades
│   ├── views/                   # Vistas
│   │   ├── admin/
│   │   │   ├── AdminLayout.vue
│   │   │   ├── DashboardView.vue
│   │   │   └── GlobalPaymentMethodsView.vue
│   │   └── auth/
│   │       └── LoginView.vue
│   ├── App.vue
│   └── main.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Configuración del Store Global

El store `config.ts` es el corazón de la arquitectura. En el `main.ts`:

```typescript
const configStore = useConfigStore();
configStore.initialize(); // Carga monedas, categorías, iconos de la API
```

## Uso del Plugin formatMoney

### En Templates:
```vue
<template>
  <span>{{ $formatMoney(amount, 'VES') }}</span>
</template>
```

### En Setup:
```typescript
import { useFormatMoney } from '@/plugins/formatMoney';

const { formatMoney } = useFormatMoney();
const formatted = formatMoney(1234.56, 'USD');
```

## Instalación

```bash
cd frontend-vue
npm install
npm run dev
```

## Migración desde React

| React | Vue 3 |
|-------|-------|
| `useState` | `ref` / `reactive` |
| `useEffect` | `onMounted` / `watch` |
| Props drilling | `provide` / `inject` |
| Redux/Zustand | Pinia |
| React Query | Vue Query |
