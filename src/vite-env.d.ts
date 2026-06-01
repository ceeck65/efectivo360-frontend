/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register/vue' {
  export function useRegisterSW(options?: {
    immediate?: boolean;
    onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration) => void;
  }): {
    needRefresh: import('vue').Ref<boolean>;
    updateSW: () => Promise<void>;
  };
}
