<script setup lang="ts">
import { clampPercent, newMapArea } from '~/utils/mapAreas';
import type { EditableMapArea } from '~/utils/mapAreas';

type Gesture =
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'move'; index: number; grabX: number; grabY: number }
  | { kind: 'resize'; index: number };

const areas = defineModel<EditableMapArea[]>('areas', { required: true });
const selectedIndex = defineModel<number | null>('selectedIndex', { required: true });

defineProps<{ imageUrl: string; imageWidth: number; imageHeight: number }>();

const { t } = useI18n();

const PERCENT = 100;
const MINIMUM_SIZE_PERCENT = 1;

const canvas = ref<HTMLElement | null>(null);
const gesture = ref<Gesture | null>(null);
const draft = ref<Pick<EditableMapArea, 'leftPercent' | 'topPercent' | 'widthPercent' | 'heightPercent'> | null>(null);

const pointerPercent = (event: PointerEvent) => {
  const bounds = canvas.value!.getBoundingClientRect();
  return {
    x: clampPercent(((event.clientX - bounds.left) / bounds.width) * PERCENT),
    y: clampPercent(((event.clientY - bounds.top) / bounds.height) * PERCENT),
  };
};

const frameOf = (frame: Pick<EditableMapArea, 'leftPercent' | 'topPercent' | 'widthPercent' | 'heightPercent'>) => ({
  left: `${frame.leftPercent}%`,
  top: `${frame.topPercent}%`,
  width: `${frame.widthPercent}%`,
  height: `${frame.heightPercent}%`,
});

const startGesture = (event: PointerEvent, next: Gesture) => {
  canvas.value?.setPointerCapture(event.pointerId);
  gesture.value = next;
};

const startDrawing = (event: PointerEvent) => {
  const { x, y } = pointerPercent(event);
  startGesture(event, { kind: 'draw', startX: x, startY: y });
};

const startMoving = (event: PointerEvent, index: number) => {
  const { x, y } = pointerPercent(event);
  const area = areas.value[index]!;
  startGesture(event, { kind: 'move', index, grabX: x - area.leftPercent, grabY: y - area.topPercent });
};

const startResizing = (event: PointerEvent, index: number) => {
  startGesture(event, { kind: 'resize', index });
};

const selectOnFocus = (index: number) => {
  if (!gesture.value) {
    selectedIndex.value = index;
  }
};

const continueGesture = (event: PointerEvent) => {
  const current = gesture.value;
  if (!current) {
    return;
  }
  const { x, y } = pointerPercent(event);
  if (current.kind === 'draw') {
    draft.value = {
      leftPercent: Math.min(current.startX, x),
      topPercent: Math.min(current.startY, y),
      widthPercent: clampPercent(Math.abs(x - current.startX)),
      heightPercent: clampPercent(Math.abs(y - current.startY)),
    };
    return;
  }
  const area = areas.value[current.index]!;
  if (current.kind === 'move') {
    area.leftPercent = clampPercent(x - current.grabX, PERCENT - area.widthPercent);
    area.topPercent = clampPercent(y - current.grabY, PERCENT - area.heightPercent);
    return;
  }
  area.widthPercent = Math.max(MINIMUM_SIZE_PERCENT, clampPercent(x - area.leftPercent, PERCENT - area.leftPercent));
  area.heightPercent = Math.max(MINIMUM_SIZE_PERCENT, clampPercent(y - area.topPercent, PERCENT - area.topPercent));
};

const appendDrawnArea = (): number | null => {
  const drawn = draft.value;
  if (!drawn || drawn.widthPercent < MINIMUM_SIZE_PERCENT || drawn.heightPercent < MINIMUM_SIZE_PERCENT) {
    return null;
  }
  const areasWithDrawn = [...areas.value, newMapArea(drawn)];
  areas.value = areasWithDrawn;
  return areasWithDrawn.length - 1;
};

// The selection changes only here: swapping the area form mid-gesture changes the page height
// and shifts the image under the pointer.
const finishGesture = () => {
  const finished = gesture.value;
  if (finished) {
    selectedIndex.value = finished.kind === 'draw' ? appendDrawnArea() : finished.index;
  }
  gesture.value = null;
  draft.value = null;
};

const highlightedIndex = computed(() => {
  const current = gesture.value;
  return current && current.kind !== 'draw' ? current.index : selectedIndex.value;
});
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-aqua-500/30 bg-black p-2">
    <div
      ref="canvas"
      role="group"
      :aria-label="t('ADMIN_FORMS.MAP_AREAS')"
      class="relative mx-auto min-w-2xl touch-none select-none"
      :style="{ maxWidth: `${imageWidth}px` }"
      @pointerdown.self="startDrawing"
      @pointermove="continueGesture"
      @pointerup="finishGesture"
      @pointercancel="finishGesture"
    >
      <img
        :src="imageUrl"
        alt=""
        :width="imageWidth"
        :height="imageHeight"
        class="pointer-events-none block h-auto w-full rounded-lg"
        draggable="false"
      />
      <button
        v-for="(area, index) in areas"
        :key="index"
        type="button"
        class="absolute cursor-move rounded-sm border text-left transition-colors duration-150"
        :class="
          index === highlightedIndex
            ? 'z-10 border-gold-300 bg-cosmo-500/35 shadow-aura'
            : 'border-cosmo-500/70 bg-cosmo-500/15 hover:bg-cosmo-500/30'
        "
        :style="frameOf(area)"
        :aria-label="t('ADMIN_FORMS.MAP_AREA', { name: area.label })"
        :aria-pressed="index === selectedIndex"
        @pointerdown.stop="startMoving($event, index)"
        @focus="selectOnFocus(index)"
      >
        <span
          class="pointer-events-none absolute top-0 left-0 max-w-full truncate rounded-br bg-abyss-950/90 px-1 text-[0.65rem] text-gold-300"
        >
          {{ area.label }}
        </span>
        <span
          v-if="index === selectedIndex"
          class="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border border-abyss-950 bg-gold-300"
          aria-hidden="true"
          @pointerdown.stop="startResizing($event, index)"
        />
      </button>
      <span
        v-if="draft"
        class="pointer-events-none absolute rounded-sm border border-dashed border-aqua-400 bg-aqua-400/20"
        :style="frameOf(draft)"
      />
    </div>
  </div>
</template>
