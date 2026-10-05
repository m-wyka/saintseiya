export const useUiStore = defineStore('ui', () => {
  const isMenuOpen = ref(false);

  const openMenu = () => {
    isMenuOpen.value = true;
  };
  const closeMenu = () => {
    isMenuOpen.value = false;
  };

  return { isMenuOpen, openMenu, closeMenu };
});
