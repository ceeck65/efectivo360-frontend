import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

export type TipoPlan = 'gratis' | 'emprendedor' | 'custom_pack';

export interface TransactionPackage {
  tipo_plan: TipoPlan;
  tickets_disponibles: number;
  es_ilimitado_por_fecha: boolean;
  fecha_vencimiento_plan: string | null;
}

export interface AcquiredModules {
  [key: string]: boolean;
}

export interface TenantMetadata {
  paquete_transaccional: TransactionPackage;
  modulos_adquiridos: AcquiredModules;
}

const DEFAULT_METADATA: TenantMetadata = {
  paquete_transaccional: {
    tipo_plan: 'gratis',
    tickets_disponibles: 10,
    es_ilimitado_por_fecha: false,
    fecha_vencimiento_plan: null,
  },
  modulos_adquiridos: {},
};

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: 'operaciones' | 'reportes' | 'ventas' | 'administracion';
}

export const KNOWN_MODULES: ModuleDefinition[] = [
  {
    key: 'multi_sucursal',
    name: 'Multi-sucursal',
    description: 'Gestiona múltiples sucursales desde una sola plataforma. Control centralizado de inventario, ventas y personal.',
    price: 29,
    icon: 'Building2',
    category: 'operaciones',
  },
  {
    key: 'rutas_despacho',
    name: 'Rutas de Despacho',
    description: 'Planifica y controla las rutas de entrega y despacho de productos con asignación a repartidores.',
    price: 19,
    icon: 'Route',
    category: 'operaciones',
  },
  {
    key: 'inventario_avanzado',
    name: 'Inventario Avanzado',
    description: 'Lotes, fechas de expiración, números de serie, códigos de barras y control de inventario por ubicación.',
    price: 24,
    icon: 'PackageSearch',
    category: 'operaciones',
  },
  {
    key: 'reportes_avanzados',
    name: 'Reportes Avanzados',
    description: 'Dashboards personalizados, exportación de datos, reportes fiscales y análisis de tendencias.',
    price: 15,
    icon: 'BarChart3',
    category: 'reportes',
  },
  {
    key: 'control_despacho',
    name: 'Control de Despacho',
    description: 'Gestión completa de órdenes de despacho, guías de entrega y seguimiento en tiempo real.',
    price: 22,
    icon: 'Truck',
    category: 'operaciones',
  },
  {
    key: 'facturacion_electronica',
    name: 'Facturación Electrónica',
    description: 'Facturación electrónica SENIAT con firma digital, documentos fiscales y Libros IVA.',
    price: 34,
    icon: 'FileText',
    category: 'ventas',
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Gestión de relaciones con clientes, historial de compras, embudos de venta y campañas.',
    price: 18,
    icon: 'Users',
    category: 'ventas',
  },
  {
    key: 'bodega_multiple',
    name: 'Bodega Múltiple',
    description: 'Control de inventario por múltiples almacenes con transferencias entre bodegas.',
    price: 20,
    icon: 'Warehouse',
    category: 'operaciones',
  },
];

function parseMetadata(raw: Record<string, unknown> | null | undefined): TenantMetadata {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_METADATA, modulos_adquiridos: { ...DEFAULT_METADATA.modulos_adquiridos } };
  }
  const tx = (raw as any).paquete_transaccional;
  const paquete: TransactionPackage = tx && typeof tx === 'object'
    ? {
        tipo_plan: validTipoPlan(tx.tipo_plan),
        tickets_disponibles: typeof tx.tickets_disponibles === 'number' ? tx.tickets_disponibles : 0,
        es_ilimitado_por_fecha: !!tx.es_ilimitado_por_fecha,
        fecha_vencimiento_plan: typeof tx.fecha_vencimiento_plan === 'string' ? tx.fecha_vencimiento_plan : null,
      }
    : { ...DEFAULT_METADATA.paquete_transaccional };

  const mods = (raw as any).modulos_adquiridos;
  const modulos_adquiridos: AcquiredModules = mods && typeof mods === 'object'
    ? { ...mods }
    : { ...DEFAULT_METADATA.modulos_adquiridos };

  return { paquete_transaccional: paquete, modulos_adquiridos };
}

function validTipoPlan(v: unknown): TipoPlan {
  if (v === 'gratis' || v === 'emprendedor' || v === 'custom_pack') return v;
  return 'gratis';
}

export function useTenantMetadata() {
  const authStore = useAuthStore();
  const { fetchApi } = useApi();
  const localTickets = ref<number | null>(null);

  const metadata = computed<TenantMetadata>(() =>
    parseMetadata(authStore.user?.tenant_settings)
  );

  const ticketsDisponibles = computed(() => {
    if (localTickets.value !== null) return localTickets.value;
    return metadata.value.paquete_transaccional.tickets_disponibles;
  });

  const tipoPlan = computed(() => metadata.value.paquete_transaccional.tipo_plan);
  const esIlimitado = computed(() => metadata.value.paquete_transaccional.es_ilimitado_por_fecha);
  const sinVencimiento = computed(() =>
    tipoPlan.value === 'custom_pack' && !metadata.value.paquete_transaccional.fecha_vencimiento_plan
  );

  const canCharge = computed(() => ticketsDisponibles.value > 0 || esIlimitado.value);

  const isPlanGratis = computed(() => tipoPlan.value === 'gratis');

  function consumirTicket(): number {
    const current = ticketsDisponibles.value;
    if (current <= 0 || esIlimitado.value) return current;
    const next = current - 1;
    localTickets.value = next;
    return next;
  }

  function hasModule(key: string): boolean {
    return metadata.value.modulos_adquiridos[key] === true;
  }

  function isModuleLocked(key: string): boolean {
    return metadata.value.modulos_adquiridos[key] !== true;
  }

  function isModuleActive(key: string): boolean {
    return hasModule(key);
  }

  function modules(): AcquiredModules {
    return { ...metadata.value.modulos_adquiridos };
  }

  async function persistTickets(): Promise<boolean> {
    const current = { ...(authStore.user?.tenant_settings || {}) } as any;
    current.paquete_transaccional = {
      ...(current.paquete_transaccional || {}),
      tickets_disponibles: localTickets.value ?? metadata.value.paquete_transaccional.tickets_disponibles,
    };
    try {
      await fetchApi<any>('/api/v1/tenants/update-settings/', {
        method: 'PATCH',
        data: { tenant_settings: current },
      });
      if (authStore.user) {
        authStore.user.tenant_settings = current;
        localStorage.setItem('efectivo360_user', JSON.stringify(authStore.user));
      }
      return true;
    } catch {
      return false;
    }
  }

  async function acquireModule(key: string): Promise<boolean> {
    const current = { ...(authStore.user?.tenant_settings || {}) };
    const raw = current as any;
    if (!raw.modulos_adquiridos || typeof raw.modulos_adquiridos !== 'object') {
      raw.modulos_adquiridos = {};
    }
    raw.modulos_adquiridos[key] = true;

    try {
      const result = await fetchApi<any>('/api/v1/tenants/update-settings/', {
        method: 'PATCH',
        data: { tenant_settings: current },
      });
      if (result) {
        if (authStore.user) {
          authStore.user.tenant_settings = current as Record<string, unknown>;
          localStorage.setItem('efectivo360_user', JSON.stringify(authStore.user));
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  async function updateTransactionPackage(data: Partial<TransactionPackage>): Promise<boolean> {
    const current = { ...(authStore.user?.tenant_settings || {}) } as any;
    current.paquete_transaccional = {
      ...(current.paquete_transaccional || {}),
      ...data,
    };

    try {
      const result = await fetchApi<any>('/api/v1/tenants/update-settings/', {
        method: 'PATCH',
        data: { tenant_settings: current },
      });
      if (result) {
        if (authStore.user) {
          authStore.user.tenant_settings = current;
          localStorage.setItem('efectivo360_user', JSON.stringify(authStore.user));
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  return {
    metadata,
    ticketsDisponibles,
    tipoPlan,
    esIlimitado,
    sinVencimiento,
    canCharge,
    isPlanGratis,
    consumirTicket,
    persistTickets,
    hasModule,
    isModuleLocked,
    isModuleActive,
    modules,
    acquireModule,
    updateTransactionPackage,
    knownModules: KNOWN_MODULES,
  };
}
