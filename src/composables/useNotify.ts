import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export const useNotify = () => {
  const success = (message: string) => {
    toast.success(message, {
      autoClose: 10000,
      position: 'top-right',
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      autoClose: 10000,
      position: 'top-right',
    });
  };

  const info = (message: string) => {
    toast.info(message, {
      autoClose: 10000,
      position: 'top-right',
    });
  };

  return {
    success,
    error,
    info,
  };
};
