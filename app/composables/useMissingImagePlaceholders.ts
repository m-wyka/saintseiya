import type { Ref } from 'vue';

const PLACEHOLDER_CLASS = 'missing-image';
const PLACEHOLDER_TITLE = 'Nie znaleziono zdjęcia';

const placeholderFor = (image: HTMLImageElement): HTMLElement => {
  const address = image.currentSrc || image.src;
  const placeholder = document.createElement(image.closest('a') ? 'span' : 'a');
  placeholder.className = PLACEHOLDER_CLASS;
  if (placeholder instanceof HTMLAnchorElement) {
    placeholder.href = address;
    placeholder.target = '_blank';
    placeholder.rel = 'noopener nofollow';
  }
  const title = document.createElement('strong');
  title.textContent = PLACEHOLDER_TITLE;
  const source = document.createElement('span');
  source.textContent = address;
  placeholder.append(title, source);
  return placeholder;
};

const hasFailed = (image: HTMLImageElement): boolean => image.complete && image.naturalWidth === 0;

export const useMissingImagePlaceholders = (container: Ref<HTMLElement | null>, content: Ref<string>) => {
  const replaceFailedImage = (image: HTMLImageElement) => image.replaceWith(placeholderFor(image));

  const onLoadError = (event: Event) => {
    if (event.target instanceof HTMLImageElement) {
      replaceFailedImage(event.target);
    }
  };

  const replaceAlreadyFailedImages = () => {
    container.value?.querySelectorAll('img').forEach((image) => {
      if (hasFailed(image)) {
        replaceFailedImage(image);
      }
    });
  };

  onMounted(() => {
    container.value?.addEventListener('error', onLoadError, true);
    replaceAlreadyFailedImages();
  });
  onBeforeUnmount(() => container.value?.removeEventListener('error', onLoadError, true));
  watch(content, () => nextTick(replaceAlreadyFailedImages));
};
