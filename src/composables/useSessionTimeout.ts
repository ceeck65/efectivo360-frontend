import { watch } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

// Access tokens live 30 min server-side (SIMPLE_JWT.ACCESS_TOKEN_LIFETIME).
// Warn well before that, banking-style: a confirm dialog with a live countdown,
// not a silent kick to the login page.
const IDLE_WARNING_AFTER_MS = 20 * 60 * 1000;
const COUNTDOWN_SECONDS = 60;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
// Idle-timer resets don't need per-pixel precision — throttle to avoid churn.
const ACTIVITY_THROTTLE_MS = 5000;

/**
 * Proactive inactivity warning ("como los sistemas bancarios"): after
 * IDLE_WARNING_AFTER_MS with no user activity, shows a blocking SweetAlert
 * with a countdown asking whether to extend the session or close it. If the
 * countdown reaches zero with no response, the session is closed and the
 * user is told explicitly why.
 *
 * Complements — does not replace — the reactive fix in useApi.ts, which
 * handles the "otro motivo" case (session invalidated/expired server-side,
 * discovered only when an API call actually fails).
 *
 * Call once, from App.vue's root setup.
 */
export function useSessionTimeout() {
  const authStore = useAuthStore();
  const router = useRouter();

  let idleTimer: number | undefined;
  let lastActivityReset = 0;
  let warningOpen = false;
  let listening = false;

  function clearIdleTimer() {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  }

  function scheduleIdleTimer() {
    clearIdleTimer();
    idleTimer = window.setTimeout(showExpiryWarning, IDLE_WARNING_AFTER_MS);
  }

  function onActivity() {
    if (warningOpen) return; // the dialog itself is the checkpoint now — don't silently reset under it
    const now = Date.now();
    if (now - lastActivityReset < ACTIVITY_THROTTLE_MS) return;
    lastActivityReset = now;
    scheduleIdleTimer();
  }

  function startListening() {
    if (listening) return;
    listening = true;
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    scheduleIdleTimer();
  }

  function stopListening() {
    listening = false;
    clearIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
  }

  async function extendSession() {
    try {
      // Re-fetching /api/me/ both proves the session is still valid and, if the
      // access token had already expired, transparently rides useApi.ts's own
      // refresh-token retry — a genuine extension either way.
      await authStore.refreshSession();
    } catch {
      // A hard failure here means the refresh token itself is dead; the
      // interceptor in useApi.ts already shows its own explanatory alert
      // and redirects — nothing further to do here.
    }
  }

  async function forceLogout(explainInactivity: boolean) {
    stopListening();
    await authStore.logout();
    if (explainInactivity) {
      await Swal.fire({
        icon: 'info',
        title: 'Sesión cerrada por inactividad',
        text: 'Por tu seguridad, cerramos tu sesión luego de un período sin actividad.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6',
      });
    }
    router.push('/es/login');
  }

  async function showExpiryWarning() {
    if (warningOpen) return;
    warningOpen = true;
    clearIdleTimer();

    let countdownInterval: number | undefined;
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Tu sesión está por expirar',
      html: `Por tu seguridad, tu sesión se cerrará por inactividad en <b id="session-countdown">${COUNTDOWN_SECONDS}</b> segundos.`,
      showCancelButton: true,
      confirmButtonText: 'Continuar conectado',
      cancelButtonText: 'Cerrar sesión ahora',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: COUNTDOWN_SECONDS * 1000,
      timerProgressBar: true,
      didOpen: () => {
        const el = Swal.getHtmlContainer()?.querySelector('#session-countdown');
        countdownInterval = window.setInterval(() => {
          const remaining = Swal.getTimerLeft();
          if (el && remaining != null) el.textContent = String(Math.ceil(remaining / 1000));
        }, 200);
      },
      willClose: () => {
        if (countdownInterval) window.clearInterval(countdownInterval);
      },
    });

    warningOpen = false;

    // Logged out from elsewhere (e.g. the reactive interceptor) while this was open.
    if (!authStore.isAuthenticated) return;

    if (result.isConfirmed) {
      await extendSession();
      if (authStore.isAuthenticated) scheduleIdleTimer();
    } else {
      // Cancel button = the user explicitly chose to close it — their own
      // action already explains itself. Countdown running out unattended is
      // the "banking" auto-logout case, which does need an explanation.
      const isTimeout = result.dismiss === Swal.DismissReason.timer;
      await forceLogout(isTimeout);
    }
  }

  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) startListening();
      else stopListening();
    },
    { immediate: true },
  );
}
