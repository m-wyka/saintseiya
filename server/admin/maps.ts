import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { CONTENT_STATUSES, MAP_AREA_TARGETS } from '#shared/utils/content';

const PERCENT_MAX = 100;
const MAX_AREAS = 300;
const WEB_OR_INTERNAL_URL_PATTERN = /^(?:https?:\/\/|\/(?!\/))/i;

const percent = z.number().min(0).max(PERCENT_MAX);

const areaSchema = z
  .object({
    label: z.string().trim().min(1, 'Każdy obszar potrzebuje etykiety').max(120),
    leftPercent: percent,
    topPercent: percent,
    widthPercent: percent.min(0.1),
    heightPercent: percent.min(0.1),
    targetKind: z.enum(MAP_AREA_TARGETS),
    pageId: z.number().int().positive().nullable().default(null),
    url: z.string().trim().max(500).nullable().default(null),
    contentHtml: richBodySchema.nullable().default(null),
  })
  .superRefine((area, context) => {
    if (area.targetKind === 'page' && area.pageId === null) {
      context.addIssue({ code: 'custom', message: `Obszar „${area.label}”: wybierz podstronę` });
    }
    if (area.targetKind === 'url' && !WEB_OR_INTERNAL_URL_PATTERN.test(area.url ?? '')) {
      context.addIssue({
        code: 'custom',
        message: `Obszar „${area.label}”: podaj adres zaczynający się od / lub https://`,
      });
    }
    if (area.targetKind === 'content' && !area.contentHtml?.trim()) {
      context.addIssue({ code: 'custom', message: `Obszar „${area.label}”: wpisz treść okienka` });
    }
  });

const inputSchema = z.object({
  title: z.string().trim().min(2, 'Tytuł jest za krótki').max(120),
  slug: slugInputSchema,
  description: z.string().trim().max(600).default(''),
  image: z.string().trim().min(1, 'Wgraj obraz mapy').max(300),
  imageWidth: z.number().int().positive(),
  imageHeight: z.number().int().positive(),
  teaserImage: z.string().trim().max(300).nullable().default(null),
  status: z.enum(CONTENT_STATUSES),
  sortOrder: z.number().int().min(0).default(0),
  areas: z.array(areaSchema).max(MAX_AREAS).default([]),
});

type MapInput = z.infer<typeof inputSchema>;

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.maps.id })
      .from(schema.maps)
      .where(and(eq(schema.maps.slug, slug), exceptId ? ne(schema.maps.id, exceptId) : undefined))
      .get(),
  );

const storedMapValues = ({ areas: _areas, ...map }: MapInput, slug: string) => ({
  ...map,
  slug,
  updatedAt: new Date(),
});

const storedAreaValues = (mapId: number, areas: MapInput['areas']) =>
  areas.map((area, index) => ({
    mapId,
    label: area.label,
    leftPercent: area.leftPercent,
    topPercent: area.topPercent,
    widthPercent: area.widthPercent,
    heightPercent: area.heightPercent,
    targetKind: area.targetKind,
    pageId: area.targetKind === 'page' ? area.pageId : null,
    url: area.targetKind === 'url' ? area.url : null,
    contentHtml: area.targetKind === 'content' ? cleanEditorHtml(area.contentHtml ?? '') : null,
    sortOrder: index,
  }));

export const mapsResource = defineAdminResource({
  access: 'maps',
  inputSchema,
  list: () =>
    useDb()
      .select({
        id: schema.maps.id,
        title: schema.maps.title,
        slug: schema.maps.slug,
        status: schema.maps.status,
        teaserImage: schema.maps.teaserImage,
        areaCount: count(schema.mapAreas.id),
      })
      .from(schema.maps)
      .leftJoin(schema.mapAreas, eq(schema.mapAreas.mapId, schema.maps.id))
      .groupBy(schema.maps.id)
      .orderBy(asc(schema.maps.sortOrder), asc(schema.maps.id))
      .all(),
  find: (id) => {
    const db = useDb();
    const map = db.select().from(schema.maps).where(eq(schema.maps.id, id)).get();
    if (!map) {
      return undefined;
    }
    const areas = db
      .select({
        label: schema.mapAreas.label,
        leftPercent: schema.mapAreas.leftPercent,
        topPercent: schema.mapAreas.topPercent,
        widthPercent: schema.mapAreas.widthPercent,
        heightPercent: schema.mapAreas.heightPercent,
        targetKind: schema.mapAreas.targetKind,
        pageId: schema.mapAreas.pageId,
        pageTitle: schema.pages.title,
        url: schema.mapAreas.url,
        contentHtml: schema.mapAreas.contentHtml,
      })
      .from(schema.mapAreas)
      .leftJoin(schema.pages, eq(schema.pages.id, schema.mapAreas.pageId))
      .where(eq(schema.mapAreas.mapId, id))
      .orderBy(asc(schema.mapAreas.sortOrder), asc(schema.mapAreas.id))
      .all();
    return { ...map, areas };
  },
  create: (input) =>
    useDb().transaction((tx) => {
      const slug = adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate), 'mapa');
      const created = tx
        .insert(schema.maps)
        .values(storedMapValues(input, slug))
        .returning({ id: schema.maps.id })
        .get();
      if (input.areas.length) {
        tx.insert(schema.mapAreas).values(storedAreaValues(created.id, input.areas)).run();
      }
      return created;
    }),
  update: (id, input) => {
    useDb().transaction((tx) => {
      const slug = adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate, id), 'mapa');
      tx.update(schema.maps).set(storedMapValues(input, slug)).where(eq(schema.maps.id, id)).run();
      tx.delete(schema.mapAreas).where(eq(schema.mapAreas.mapId, id)).run();
      if (input.areas.length) {
        tx.insert(schema.mapAreas).values(storedAreaValues(id, input.areas)).run();
      }
    });
  },
  remove: (id) => {
    useDb().delete(schema.maps).where(eq(schema.maps.id, id)).run();
  },
});
