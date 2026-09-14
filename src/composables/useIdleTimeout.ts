import { ref, watch } from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotify } from '@/composables/useNotify';

// Two absolute idle thresholds, banking-style: a warning first, then a hard
// logout exactly 60s later if nobody responds. The visible countdown is
// derived from the same deadline — never a second, independently-drifting timer.
const IDLE_WARNING_TIME = 14 * 60 * 1000;
const IDLE_LOGOUT_TIME = 15 * 60 * 1000;
const COUNTDOWN_SECONDS = Math.round((IDLE_LOGOUT_TIME - IDLE_WARNING_TIME) / 1000);

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const;
// A true debounce (wait for activity to STOP) would never reset an idle
// timer while the user keeps moving the mouse — the opposite of what idle
// detection needs. Throttled to once/second instead: frequent enough that
// the idle clock tracks real activity, cheap enough not to matter.
const ACTIVITY_THROTTLE_MS = 1000;

/**
 * Idle-timeout state and control logic — no UI. Pair with
 * SessionWarningModal.vue, which renders `showWarning` / `secondsRemaining`
 * and calls `extendSession` / `logoutNow`.
 *
 * Call once, from App.vue's root setup.
 */
export function useIdleTimeout() {
  const authStore = useAuthStore();
  const router = useRouter();
  const { success: notifySuccess, info: notifyInfo } = useNotify();

  const showWarning = ref(false);
  const secondsRemaining = ref(COUNTDOWN_SECONDS);

  let warningTimer: number | undefined;
  let logoutTimer: number | undefined;
  let countdownInterval: number | undefined;
  let listening = false;

  function clearAllTimers() {
    if (warningTimer) { window.clearTimeout(warningTimer); warningTimer = undefined; }
    if (logoutTimer) { window.clearTimeout(logoutTimer); logoutTimer = undefined; }
    if (countdownInterval) { window.clearInterval(countdownInterval); countdownInterval = undefined; }
  }

  function scheduleTimers() {
    clearAllTimers();
    showWarning.value = false;
    warningTimer = window.setTimeout(triggerWarning, IDLE_WARNING_TIME);
    logoutTimer = window.setTimeout(() => performLogout(true), IDLE_LOGOUT_TIME);
  }

  function triggerWarning() {
    showWarning.value = true;
    secondsRemaining.value = COUNTDOWN_SECONDS;
    countdownInterval = window.setInterval(() => {
      secondsRemaining.value = Math.max(0, secondsRemaining.value - 1);
    }, 1000);
  }

  const onActivity = useThrottleFn(() => {
    if (showWarning.value) return; // the dialog itself is the checkpoint now — don't silently reset under it
    scheduleTimers();
  }, ACTIVITY_THROTTLE_MS);

  function startListening() {
    if (listening) return;
    listening = true;
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    scheduleTimers();
  }

  function stopListening() {
    listening = false;
    clearAllTimers();
    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
  }

  async function extendSession() {
    try {
      // No dedicated POST /api/v1/auth/extend-session/ exists on the backend
      // (verified) — re-fetching /api/me/ both proves the session is still
      // valid and, if the access token had already expired, transparently
      // rides useApi.ts's own refresh-token retry. A genuine extension either way.
      await authStore.refreshSession();
      scheduleTimers();
      notifySuccess('Sesión extendida con éxito');
    } catch {
      // A hard failure means the refresh token itself is dead; the
      // interceptor in useApi.ts already shows its own explanatory alert
      // and redirects — nothing further to do here.
    }
  }

  async function performLogout(dueToInactivity: boolean) {
    stopListening();
    showWarning.value = false;
    await authStore.logout();
    if (dueToInactivity) {
      notifyInfo('Tu sesión se cerró automáticamente por inactividad.');
    }
    router.push('/es/login');
  }

  function logoutNow() {
    performLogout(false);
  }

  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) startListening();
      else stopListening();
    },
    { immediate: true },
  );

  return {
    showWarning,
    secondsRemaining,
    extendSession,
    logoutNow,
  };
}
