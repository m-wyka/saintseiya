export const useConfirmationStore = defineStore('confirmation', () => {
  const question = ref<string | null>(null);
  let settle: ((isConfirmed: boolean) => void) | undefined;

  const answer = (isConfirmed: boolean) => {
    question.value = null;
    settle?.(isConfirmed);
    settle = undefined;
  };
  const ask = (text: string) => {
    answer(false);
    question.value = text;
    return new Promise<boolean>((resolve) => (settle = resolve));
  };

  return { question, ask, answer };
});
