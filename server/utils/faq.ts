import { asc } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';
import { markMissingImages } from './missingImages';
import { localized } from './translations';

export const listFaq = (locale: ContentLocale = DEFAULT_LOCALE) => {
  const db = useDb();
  const categories = db
    .select({ id: schema.faqCategories.id, name: localized(schema.faqCategories.name, locale) })
    .from(schema.faqCategories)
    .orderBy(asc(schema.faqCategories.sortOrder), asc(schema.faqCategories.id))
    .all();
  const items = db
    .select({
      id: schema.faqItems.id,
      categoryId: schema.faqItems.categoryId,
      title: localized(schema.faqItems.title, locale),
      descriptionHtml: localized(schema.faqItems.descriptionHtml, locale),
    })
    .from(schema.faqItems)
    .orderBy(asc(schema.faqItems.sortOrder), asc(schema.faqItems.id))
    .all();
  const itemsByCategory = Map.groupBy(items, (item) => item.categoryId);
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: (itemsByCategory.get(category.id) ?? []).map(({ id, title, descriptionHtml }) => ({
        id,
        title,
        descriptionHtml: markMissingImages(descriptionHtml),
      })),
    }))
    .filter((category) => category.items.length > 0);
};
