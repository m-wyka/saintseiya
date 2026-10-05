import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Youtube } from '@tiptap/extension-youtube';
import StarterKit from '@tiptap/starter-kit';

export const TOOLBAR_HEADING_LEVELS = [2, 3] as const;
export const TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const;
export const TEXT_COLORS = [
  { label: 'Złoty', value: '#ffcc99' },
  { label: 'Pomarańczowy', value: '#ff9b0d' },
  { label: 'Błękitny', value: '#24c4ff' },
  { label: 'Czerwony', value: '#ff6b5e' },
];

const KEPT_HEADING_LEVELS = [2, 3, 4, 5, 6] as const;
const FLOAT_SIDES = ['left', 'right'];

const floatStyleOf = (element: HTMLElement): string | null =>
  FLOAT_SIDES.includes(element.style.float) ? `float:${element.style.float}` : null;

const FloatableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: floatStyleOf,
        renderHTML: ({ style }: { style: string | null }) => (style ? { style } : {}),
      },
    };
  },
});

const YoutubeVideo = Youtube.extend({
  parseHTML() {
    return [{ tag: 'div[data-youtube-video] iframe' }, { tag: 'iframe[src*="youtube"]' }];
  },
});

const basicExtensions = () => [
  StarterKit.configure({
    heading: false,
    horizontalRule: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
  }),
  FloatableImage,
];

const articleExtensions = () => [
  StarterKit.configure({
    heading: { levels: [...KEPT_HEADING_LEVELS] },
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
  }),
  FloatableImage,
  TextStyle,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'], alignments: [...TEXT_ALIGNMENTS] }),
  TableKit.configure({ table: { resizable: false } }),
  YoutubeVideo.configure({ nocookie: true, modestBranding: true }),
];

export const editorExtensions = (isExtended: boolean) => (isExtended ? articleExtensions() : basicExtensions());
