import { eq } from 'drizzle-orm';
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

export const readSetting = <Key extends keyof SettingValues>(key: Key): SettingValues[Key] => {
  const row = useDb().select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  return row ? (row.value as SettingValues[Key]) : SETTING_DEFAULTS[key];
};

export const writeSetting = <Key extends keyof SettingValues>(key: Key, value: SettingValues[Key]) => {
  useDb()
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
};
