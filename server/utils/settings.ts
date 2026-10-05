import { eq } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';

export interface NewsCenterTab {
  title: string;
  bodyHtml: string;
}

interface SettingValues {
  newsCenterTabs: NewsCenterTab[];
}

const SETTING_DEFAULTS: SettingValues = {
  newsCenterTabs: [],
};

const storedKeyOf = (key: keyof SettingValues, locale: ContentLocale): string =>
  locale === DEFAULT_LOCALE ? key : `${key}.${locale}`;

const storedValueOf = (storedKey: string): unknown =>
  useDb().select().from(schema.settings).where(eq(schema.settings.key, storedKey)).get()?.value;

export const readSetting = <Key extends keyof SettingValues>(
  key: Key,
  locale: ContentLocale = DEFAULT_LOCALE,
): SettingValues[Key] =>
  (storedValueOf(storedKeyOf(key, locale)) ?? storedValueOf(key) ?? SETTING_DEFAULTS[key]) as SettingValues[Key];

export const writeSetting = <Key extends keyof SettingValues>(
  key: Key,
  value: SettingValues[Key],
  locale: ContentLocale = DEFAULT_LOCALE,
) => {
  useDb()
    .insert(schema.settings)
    .values({ key: storedKeyOf(key, locale), value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
};
