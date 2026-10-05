import { eq, like, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { schema, useDb } from './db';

const isFoundIn = (table: SQLiteTable, filter: SQL | undefined): boolean =>
  Boolean(useDb().select().from(table).where(filter).limit(1).get());

export const isMediaImageUsed = (image: string): boolean => {
  const mentioned = `%${image}%`;
  return (
    isFoundIn(schema.newsCategories, eq(schema.newsCategories.image, image)) ||
    isFoundIn(schema.maps, or(eq(schema.maps.image, image), eq(schema.maps.teaserImage, image))) ||
    isFoundIn(schema.translations, like(schema.translations.value, mentioned)) ||
    isFoundIn(schema.news, or(like(schema.news.excerptHtml, mentioned), like(schema.news.bodyHtml, mentioned))) ||
    isFoundIn(schema.pages, like(schema.pages.bodyHtml, mentioned)) ||
    isFoundIn(schema.mapAreas, like(schema.mapAreas.contentHtml, mentioned)) ||
    isFoundIn(schema.settings, like(schema.settings.value, mentioned)) ||
    isFoundIn(schema.posts, like(schema.posts.bodyHtml, mentioned)) ||
    isFoundIn(schema.comments, like(schema.comments.bodyHtml, mentioned))
  );
};
