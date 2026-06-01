import { ref, onMounted, onUnmounted } from 'vue';

const isInstalledApp = ref(false);

function check() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalledApp.value = true;
    return;
  }
  if ((window.navigator as any).standalone === true) {
    isInstalledApp.value = true;
    return;
  }
  isInstalledApp.value = false;
}

export function usePwa() {
  const mq = window.matchMedia('(display-mode: standalone)');

  onMounted(() => {
    check();
    mq.addEventListener('change', check);
  });

  onUnmounted(() => {
    mq.removeEventListener('change', check);
  });

  return { isInstalledApp };
}
