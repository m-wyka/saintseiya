import type { InternalApi } from 'nitropack';

type SiteLayout = InternalApi['/api/layout']['get'];

export const useLayoutStore = defineStore('layout', () => {
  const navigation = ref<SiteLayout['navigation']>([]);
  const statistics = ref<SiteLayout['statistics'] | null>(null);
  const maps = ref<SiteLayout['maps']>([]);

  const load = async () => {
    const layout = await useRequestFetch()('/api/layout');
    navigation.value = layout.navigation;
    statistics.value = layout.statistics;
    maps.value = layout.maps;
  };

  return { navigation, statistics, maps, load };
});
