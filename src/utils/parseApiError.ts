/**
 * Normaliza errores de Axios/API a un único string legible para mostrar al usuario.
 * Soporta tanto errores crudos de Axios (`error.response.{status,data}`) como los
 * errores normalizados que lanza `fetchApi` (`error.{status,data}`).
 */

interface ApiErrorLike {
  response?: { status?: number; data?: unknown };
  status?: number;
  data?: unknown;
  message?: string;
}

function flattenErrorValue(value: unknown, prefix = ''): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return [];
    return [prefix ? `${prefix}: ${text}` : text];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenErrorValue(item, prefix));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenErrorValue(nested, prefix ? `${prefix}.${key}` : key)
    );
  }

  return [prefix ? `${prefix}: ${String(value)}` : String(value)];
}

export function parseApiError(error: unknown): string {
  const apiError = error as ApiErrorLike;
  const response = apiError?.response
    ?? (apiError?.status !== undefined ? { status: apiError.status, data: apiError.data } : undefined);

  if (!response) {
    return 'Error de conexión con el servidor.';
  }

  const { status, data } = response;

  if (status === 404) {
    return 'El endpoint o recurso no existe (404).';
  }

  if (status === 500) {
    return 'Error interno en el servidor.';
  }

  if (status === 400 || status === 422) {
    if (typeof data === 'string' && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === 'object') {
      const payload = data as Record<string, unknown>;
      const source = 'error' in payload ? payload.error : 'detail' in payload ? payload.detail : payload;

      if (typeof source === 'string' && source.trim()) {
        return source.trim();
      }

      const messages = flattenErrorValue(source);
      if (messages.length) {
        return messages.join(' — ');
      }
    }

    return 'Solicitud inválida. Verifica los datos e intenta de nuevo.';
  }

  return apiError?.message || 'Ocurrió un error inesperado al procesar la solicitud.';
}
