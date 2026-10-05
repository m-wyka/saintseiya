type ToastTone = 'success' | 'error';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const TOAST_LIFETIME_MS = 4500;

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  const show = (tone: ToastTone, message: string) => {
    const id = nextId;
    nextId += 1;
    toasts.value.push({ id, tone, message });
    setTimeout(() => dismiss(id), TOAST_LIFETIME_MS);
  };

  return {
    toasts,
    dismiss,
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
  };
});
