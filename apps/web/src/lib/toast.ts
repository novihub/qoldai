import { toast } from 'sonner';

// Обёртки для типичных уведомлений
export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  // Promise-based toast для async операций
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Специфичные уведомления для нашего приложения
export const appNotify = {
  loginSuccess: () => notify.success('Добро пожаловать!', 'Вы успешно вошли в систему'),
  
  loginError: (error?: string) => 
    notify.error('Ошибка входа', error || 'Проверьте email и пароль'),
  
  registerSuccess: () => 
    notify.success('Регистрация успешна!', 'Проверьте email для подтверждения'),
  
  logoutSuccess: () => notify.info('Вы вышли из системы'),
  
  networkError: () => 
    notify.error('Ошибка сети', 'Проверьте подключение к интернету'),
  
  sessionExpired: () => 
    notify.warning('Сессия истекла', 'Пожалуйста, войдите снова'),
  
  messageSent: () => notify.success('Сообщение отправлено'),
  
  messageError: () => 
    notify.error('Не удалось отправить сообщение', 'Попробуйте ещё раз'),
  
  copied: () => notify.success('Скопировано в буфер обмена'),
  
  saved: () => notify.success('Сохранено'),
  
  deleted: () => notify.info('Удалено'),
};
