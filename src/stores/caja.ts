import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchApi } from '@/composables/useApi';

export interface CajaTerminal {
  id: number;
  name: string;
  is_active: boolean;
  status: string;
  is_locked_by_user?: boolean;
}

export interface TurnoActivo {
  id: string | number;
  terminal_id: number;
  terminal_name?: string;
  status: string;
  opening_float_usd: number;
  opening_float_ves: number;
  opened_at: string;
}

export type CajaStep = 'verificar' | 'apertura' | 'pos';

export const useCajaStore = defineStore('caja', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const turnoActivo = ref<TurnoActivo | null>(null);
  const terminales = ref<CajaTerminal[]>([]);
  const terminalSeleccionadoId = ref<number | null>(null);
  const step = ref<CajaStep>('verificar');

  const cajaAbierta = computed(() => turnoActivo.value !== null);

  async function verificarTurnoActivo(): Promise<TurnoActivo | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetchApi<any>('/api/v1/cash-sessions/active/', { method: 'GET' });
      if (res?.id && res?.status === 'OPEN') {
        turnoActivo.value = res as TurnoActivo;
        step.value = 'pos';
        return res;
      }
      turnoActivo.value = null;
      step.value = 'apertura';
      return null;
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        turnoActivo.value = null;
        step.value = 'apertura';
        return null;
      }
      error.value = e?.message || 'Error al verificar turno activo';
      step.value = 'apertura';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function obtenerTerminales(): Promise<CajaTerminal[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetchApi<any[]>('/api/v1/pos-terminals/status/', { method: 'GET' });
      const list = Array.isArray(res) ? res : [];
      terminales.value = list.filter((t: CajaTerminal) => t.is_active);
      return terminales.value;
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar terminales';
      terminales.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function abrirCaja(payload: {
    terminal_id: number;
    initial_cash_usd: string;
    initial_cash_ves: string;
    opening_notes?: string;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetchApi<any>('/api/v1/cash-sessions/open/', {
        method: 'POST',
        data: payload,
      });
      if (res?.id) {
        turnoActivo.value = res as TurnoActivo;
        step.value = 'pos';
        return true;
      }
      error.value = 'Respuesta inválida del servidor';
      return false;
    } catch (e: any) {
      const detail = e?.data?.detail || e?.response?.data?.detail || e?.message;
      error.value = detail || 'Error al abrir caja';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function cerrarTurno(shiftId: string | number, reconciliation: {
    physical_cash_usd: number;
    physical_cash_ves: number;
    notes?: string;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await fetchApi(`/api/v1/shifts/${shiftId}/close/`, {
        method: 'POST',
        data: reconciliation,
      });
      turnoActivo.value = null;
      terminalSeleccionadoId.value = null;
      step.value = 'apertura';
      return true;
    } catch (e: any) {
      const detail = e?.data?.detail || e?.response?.data?.detail || e?.message;
      error.value = detail || 'Error al cerrar turno';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function marcarCajaCerrada() {
    turnoActivo.value = null;
    terminalSeleccionadoId.value = null;
    step.value = 'apertura';
  }

  function $reset() {
    loading.value = false;
    error.value = null;
    turnoActivo.value = null;
    terminales.value = [];
    terminalSeleccionadoId.value = null;
    step.value = 'verificar';
  }

  return {
    loading,
    error,
    turnoActivo,
    terminales,
    terminalSeleccionadoId,
    step,
    cajaAbierta,
    verificarTurnoActivo,
    obtenerTerminales,
    abrirCaja,
    cerrarTurno,
    marcarCajaCerrada,
    $reset,
  };
});
