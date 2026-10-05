<script setup lang="ts">
const props = defineProps<{
  title: string;
  unitKey: string;
  points: { year: number; value: number }[];
}>();

const { t } = useI18n();

const PERCENT = 100;
const GRIDLINE_SHARES = [1, 0.5];
const LABEL_EVERY_NTH_WHEN_DENSE = 2;
const DENSE_POINT_COUNT = 10;

const showsTable = ref(false);
const hoveredYear = ref<number | null>(null);

const niceCeiling = (value: number): number => {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
};

const scaleMax = computed(() => niceCeiling(Math.max(0, ...props.points.map((point) => point.value))));
const total = computed(() => props.points.reduce((sum, point) => sum + point.value, 0));
const heightOf = (value: number) => `${(value / scaleMax.value) * PERCENT}%`;
const hovered = computed(() => props.points.find((point) => point.year === hoveredYear.value) ?? null);
const showsLabel = (index: number) =>
  props.points.length <= DENSE_POINT_COUNT || index % LABEL_EVERY_NTH_WHEN_DENSE === 0;
const valueLabel = (value: number) => t(props.unitKey, { count: formatNumber(value) }, value);
const summary = computed(() =>
  hovered.value
    ? `${hovered.value.year}: ${valueLabel(hovered.value.value)}`
    : t('ADMIN_UI.CHART_TOTAL', { value: valueLabel(total.value) }),
);
</script>

<template>
  <figure class="flex flex-col gap-3 panel p-4">
    <figcaption class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-mist">{{ title }}</p>
        <p class="text-xs text-aqua-500" aria-live="polite">
          {{ summary }}
        </p>
      </div>
      <BaseButton variant="ghost" size="sm" :aria-pressed="showsTable" @click="showsTable = !showsTable">
        <AppIcon :name="showsTable ? 'chart' : 'list'" />
        {{ showsTable ? t('ADMIN_UI.CHART_SHOW_CHART') : t('ADMIN_UI.CHART_SHOW_TABLE') }}
      </BaseButton>
    </figcaption>

    <table v-if="showsTable" class="w-full text-left text-xs">
      <thead class="text-aqua-500">
        <tr>
          <th scope="col" class="py-1 font-semibold">{{ t('ADMIN_UI.CHART_YEAR') }}</th>
          <th scope="col" class="py-1 text-right font-semibold">{{ title }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-aqua-500/10 text-aqua-200">
        <tr v-for="point in points" :key="point.year">
          <td class="py-1">{{ point.year }}</td>
          <td class="py-1 text-right tabular-nums">{{ formatNumber(point.value) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <div class="relative h-40 w-8 text-right text-[0.65rem] text-aqua-500 tabular-nums" aria-hidden="true">
        <span
          v-for="share in GRIDLINE_SHARES"
          :key="share"
          class="absolute right-0 -translate-y-1/2"
          :style="{ top: `${(1 - share) * PERCENT}%` }"
        >
          {{ formatNumber(scaleMax * share) }}
        </span>
        <span class="absolute right-0 bottom-0 translate-y-1/2">0</span>
      </div>
      <div class="relative h-40 border-b border-aqua-500/30">
        <span
          v-for="share in GRIDLINE_SHARES"
          :key="share"
          class="absolute inset-x-0 h-px bg-aqua-500/15"
          :style="{ top: `${(1 - share) * PERCENT}%` }"
          aria-hidden="true"
        />
        <ul class="relative flex h-full items-end gap-0.5" :aria-label="title">
          <li v-for="point in points" :key="point.year" class="flex h-full min-w-0 flex-1 justify-center">
            <button
              type="button"
              class="group flex size-full cursor-default items-end justify-center focus-visible:outline-offset-0"
              :aria-label="`${point.year}: ${valueLabel(point.value)}`"
              @pointerenter="hoveredYear = point.year"
              @pointerleave="hoveredYear = null"
              @focus="hoveredYear = point.year"
              @blur="hoveredYear = null"
            >
              <span
                class="block w-full max-w-6 rounded-t bg-chart-series transition-[filter,height] duration-300 ease-cosmo group-hover:brightness-125 group-focus-visible:brightness-125"
                :style="{ height: heightOf(point.value) }"
              />
            </button>
          </li>
        </ul>
      </div>
      <span aria-hidden="true" />
      <ul class="flex gap-0.5 pt-1 text-[0.65rem] text-aqua-500 tabular-nums" aria-hidden="true">
        <li v-for="(point, index) in points" :key="point.year" class="min-w-0 flex-1 text-center">
          {{ showsLabel(index) ? String(point.year).slice(2) : '' }}
        </li>
      </ul>
    </div>
  </figure>
</template>
