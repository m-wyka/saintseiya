<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { routes } from '#shared/utils/routes';
import { editorExtensions, TEXT_ALIGNMENTS, TEXT_COLORS, TOOLBAR_HEADING_LEVELS } from '~/utils/editorExtensions';
import type { IconName } from '~/utils/icons';

type InsertKind = 'link' | 'image' | 'video';
type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];

interface ToolbarAction {
  key: string;
  title: string;
  icon?: IconName;
  glyph?: string;
  isActive?: () => boolean;
  run: () => void;
}

const model = defineModel<string>({ default: '' });
const props = withDefaults(defineProps<{ label: string; extended?: boolean; allowsUpload?: boolean }>(), {
  extended: false,
  allowsUpload: false,
});

const INSERT_LABELS: Record<InsertKind, string> = {
  link: 'Adres odnośnika',
  image: 'Adres obrazka',
  video: 'Adres filmu na YouTube',
};
const ALIGNMENT_ACTIONS: Record<TextAlignment, { title: string; icon: IconName }> = {
  left: { title: 'Do lewej', icon: 'alignLeft' },
  center: { title: 'Wyśrodkuj', icon: 'alignCenter' },
  right: { title: 'Do prawej', icon: 'alignRight' },
};
const NEW_TABLE_SIZE = { rows: 3, cols: 3, withHeaderRow: false };

const editor = useEditor({
  content: model.value,
  extensions: editorExtensions(props.extended),
  editorProps: {
    attributes: {
      class: 'rich-content min-h-36 px-4 py-3 focus:outline-none',
      role: 'textbox',
      'aria-label': props.label,
    },
  },
  onUpdate: ({ editor: instance }) => {
    model.value = instance.isEmpty ? '' : instance.getHTML();
  },
});

watch(model, (html) => {
  const instance = editor.value;
  if (!instance || html === instance.getHTML() || (html === '' && instance.isEmpty)) {
    return;
  }
  instance.commands.setContent(html, { emitUpdate: false });
});

const command = () => editor.value!.chain().focus();
const isActive = (name: string | Record<string, unknown>, attributes?: Record<string, unknown>) => () =>
  (typeof name === 'string' ? editor.value?.isActive(name, attributes) : editor.value?.isActive(name)) ?? false;

const pendingInsert = ref<InsertKind | null>(null);
const insertUrl = ref('');

const insertLabel = computed(() => (pendingInsert.value ? INSERT_LABELS[pendingInsert.value] : ''));

const startInsert = (kind: InsertKind) => {
  pendingInsert.value = pendingInsert.value === kind ? null : kind;
  insertUrl.value = kind === 'link' ? (editor.value?.getAttributes('link').href ?? '') : '';
};

const INSERTERS: Record<InsertKind, (url: string) => void> = {
  link: (url) =>
    (url
      ? command().extendMarkRange('link').setLink({ href: url })
      : command().extendMarkRange('link').unsetLink()
    ).run(),
  image: (url) => url && command().setImage({ src: url }).run(),
  video: (url) => url && command().setYoutubeVideo({ src: url }).run(),
};

const confirmInsert = () => {
  if (pendingInsert.value) {
    INSERTERS[pendingInsert.value](insertUrl.value.trim());
  }
  pendingInsert.value = null;
};

const uploadInput = ref<HTMLInputElement | null>(null);
const upload = useApiAction();

const uploadImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  const form = new FormData();
  form.append('file', file);
  await upload.run(async () => {
    const [stored] = await apiRequest<{ image: string }[]>('/api/admin/media', { method: 'POST', body: form });
    if (stored) {
      command()
        .setImage({ src: routes.media(stored.image) })
        .run();
    }
  });
  if (uploadInput.value) {
    uploadInput.value.value = '';
  }
};

const basicActions = (): ToolbarAction[] => [
  {
    key: 'bold',
    title: 'Pogrubienie',
    glyph: 'B',
    isActive: isActive('bold'),
    run: () => command().toggleBold().run(),
  },
  {
    key: 'italic',
    title: 'Kursywa',
    glyph: 'I',
    isActive: isActive('italic'),
    run: () => command().toggleItalic().run(),
  },
  {
    key: 'underline',
    title: 'Podkreślenie',
    glyph: 'U',
    isActive: isActive('underline'),
    run: () => command().toggleUnderline().run(),
  },
  {
    key: 'strike',
    title: 'Przekreślenie',
    glyph: 'S',
    isActive: isActive('strike'),
    run: () => command().toggleStrike().run(),
  },
  {
    key: 'quote',
    title: 'Cytat',
    icon: 'quote',
    isActive: isActive('blockquote'),
    run: () => command().toggleBlockquote().run(),
  },
  {
    key: 'bullets',
    title: 'Lista punktowana',
    icon: 'list',
    isActive: isActive('bulletList'),
    run: () => command().toggleBulletList().run(),
  },
  {
    key: 'numbers',
    title: 'Lista numerowana',
    icon: 'numberedList',
    isActive: isActive('orderedList'),
    run: () => command().toggleOrderedList().run(),
  },
  {
    key: 'code',
    title: 'Kod',
    icon: 'code',
    isActive: isActive('codeBlock'),
    run: () => command().toggleCodeBlock().run(),
  },
  { key: 'link', title: 'Odnośnik', icon: 'link', isActive: isActive('link'), run: () => startInsert('link') },
  { key: 'image', title: 'Obrazek z adresu', icon: 'image', run: () => startInsert('image') },
];

const articleActions = (): ToolbarAction[] => [
  ...TOOLBAR_HEADING_LEVELS.map((level) => ({
    key: `heading-${level}`,
    title: `Nagłówek ${level - 1}`,
    glyph: `H${level - 1}`,
    isActive: isActive('heading', { level }),
    run: () => command().toggleHeading({ level }).run(),
  })),
  ...TEXT_ALIGNMENTS.map((alignment) => ({
    key: `align-${alignment}`,
    ...ALIGNMENT_ACTIONS[alignment],
    isActive: isActive({ textAlign: alignment }),
    run: () => command().setTextAlign(alignment).run(),
  })),
  { key: 'rule', title: 'Linia pozioma', icon: 'minus', run: () => command().setHorizontalRule().run() },
  {
    key: 'table',
    title: 'Wstaw tabelę',
    icon: 'table',
    isActive: isActive('table'),
    run: () => command().insertTable(NEW_TABLE_SIZE).run(),
  },
  { key: 'video', title: 'Film z YouTube', icon: 'play', run: () => startInsert('video') },
];

const tableActions = (): ToolbarAction[] => [
  { key: 'row-add', title: 'Dodaj wiersz', glyph: '+ wiersz', run: () => command().addRowAfter().run() },
  { key: 'row-remove', title: 'Usuń wiersz', glyph: '− wiersz', run: () => command().deleteRow().run() },
  { key: 'column-add', title: 'Dodaj kolumnę', glyph: '+ kolumna', run: () => command().addColumnAfter().run() },
  { key: 'column-remove', title: 'Usuń kolumnę', glyph: '− kolumna', run: () => command().deleteColumn().run() },
  { key: 'table-remove', title: 'Usuń tabelę', glyph: 'Usuń tabelę', run: () => command().deleteTable().run() },
];

const actions = computed<ToolbarAction[]>(() => [
  ...basicActions(),
  ...(props.extended ? articleActions() : []),
  ...(props.allowsUpload
    ? [{ key: 'upload', title: 'Wgraj obrazek z dysku', icon: 'plus' as const, run: () => uploadInput.value?.click() }]
    : []),
]);

const isInsideTable = computed(() => props.extended && (editor.value?.isActive('table') ?? false));
const isColorActive = (color: string) => editor.value?.isActive('textStyle', { color }) ?? false;
</script>

<template>
  <div
    class="overflow-hidden rounded-xl border border-aqua-500/30 bg-black/40 transition duration-200 focus-within:border-cosmo-500 focus-within:shadow-aura"
  >
    <div
      class="flex flex-wrap items-center gap-1 border-b border-aqua-500/20 bg-black/40 px-2 py-1.5"
      role="toolbar"
      :aria-label="`Formatowanie: ${label}`"
      @mousedown.prevent
    >
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="grid h-8 min-w-8 cursor-pointer place-items-center rounded-md px-1.5 text-sm font-bold transition duration-150"
        :class="
          action.isActive?.() ? 'text-abyss-950 cosmo-bar' : 'text-aqua-300 hover:bg-white/10 hover:text-gold-300'
        "
        :title="action.title"
        :aria-label="action.title"
        :aria-pressed="action.isActive?.() ?? undefined"
        @click="action.run"
      >
        <AppIcon v-if="action.icon" :name="action.icon" />
        <span v-else>{{ action.glyph }}</span>
      </button>
      <template v-if="extended">
        <span class="mx-1 h-5 w-px bg-aqua-500/30" aria-hidden="true" />
        <button
          v-for="color in TEXT_COLORS"
          :key="color.value"
          type="button"
          class="size-6 cursor-pointer rounded-full border-2 transition duration-150 hover:scale-110"
          :class="isColorActive(color.value) ? 'border-white' : 'border-transparent'"
          :style="{ backgroundColor: color.value }"
          :title="`Kolor tekstu: ${color.label}`"
          :aria-label="`Kolor tekstu: ${color.label}`"
          :aria-pressed="isColorActive(color.value)"
          @click="command().setColor(color.value).run()"
        />
        <button
          type="button"
          class="h-8 cursor-pointer rounded-md px-2 text-xs font-semibold text-aqua-300 transition hover:bg-white/10 hover:text-gold-300"
          title="Usuń kolor tekstu"
          @click="command().unsetColor().run()"
        >
          Bez koloru
        </button>
      </template>
    </div>

    <div
      v-if="isInsideTable"
      class="flex flex-wrap items-center gap-1 border-b border-aqua-500/20 bg-black/30 px-2 py-1.5"
      role="toolbar"
      aria-label="Tabela"
      @mousedown.prevent
    >
      <button
        v-for="action in tableActions()"
        :key="action.key"
        type="button"
        class="h-7 cursor-pointer rounded-md px-2 text-xs font-semibold text-aqua-300 transition hover:bg-white/10 hover:text-gold-300"
        @click="action.run"
      >
        {{ action.glyph }}
      </button>
    </div>

    <div v-if="pendingInsert" class="flex items-end gap-2 border-b border-aqua-500/20 bg-black/30 px-3 py-2">
      <BaseInput
        v-model="insertUrl"
        class="flex-1"
        type="url"
        :label="insertLabel"
        placeholder="https://"
        @keydown.enter.prevent="confirmInsert"
      />
      <BaseButton size="sm" @click="confirmInsert">Wstaw</BaseButton>
      <BaseButton variant="ghost" size="sm" @click="pendingInsert = null">Anuluj</BaseButton>
    </div>

    <input
      v-if="allowsUpload"
      ref="uploadInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="sr-only"
      aria-label="Wgraj obrazek z dysku"
      @change="uploadImage"
    />
    <p v-if="upload.errorMessage.value" class="border-b border-aqua-500/20 px-3 py-2 text-xs text-danger" role="alert">
      {{ upload.errorMessage.value }}
    </p>
    <EditorContent :editor="editor" />
  </div>
</template>
