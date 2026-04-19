import Swal from 'sweetalert2';

interface AlertOptions {
  title: string;
  text?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  timer?: number;
  showConfirmButton?: boolean;
}

export function useAlert() {
  const showSuccess = (title: string, text?: string, timer: number = 3000) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#10b981',
      color: '#fff',
    });
  };

  const showError = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ef4444',
    });
  };

  const showWarning = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#f59e0b',
    });
  };

  const showInfo = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3b82f6',
    });
  };

  const showConfirm = async (title: string, text?: string, confirmButtonText: string = 'Confirmar') => {
    const result = await Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
    });
    return result.isConfirmed;
  };

  const showAlert = (options: AlertOptions) => {
    return Swal.fire(options);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showAlert,
  };
}
