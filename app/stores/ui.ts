export const useUiStore = defineStore('ui', () => {
  const isMenuOpen = ref(false);

  const openMenu = () => {
    isMenuOpen.value = true;
  };
  const closeMenu = () => {
    isMenuOpen.value = false;
  };

  const isSearchOpen = ref(false);

  const openSearch = () => {
    isMenuOpen.value = false;
    isSearchOpen.value = true;
  };
  const closeSearch = () => {
    isSearchOpen.value = false;
  };

  return { isMenuOpen, openMenu, closeMenu, isSearchOpen, openSearch, closeSearch };
});
