import { schema } from '../../server/db';
import type { Db } from '../../server/db';
import { sanitizeRichHtml } from '../../server/utils/html';
import type { BundleItem } from './bundle';
import { plainTextOf, readContentFields, readStoredTranslations, TRANSLATION_LOCALE } from './contentFields';
import type { ContentField } from './contentFields';
import { compareStructure, withSourceSpacers } from './htmlStructure';

const MIN_LENGTH_FOR_RATIO_CHECK = 300;
const SHORTEST_PLAUSIBLE_RATIO = 0.6;
const LONGEST_PLAUSIBLE_RATIO = 1.8;
const POLISH_LETTER_PATTERN = /[ąćęłńśźż]/gi;
const POLISH_LETTER_SHARE_WORTH_A_LOOK = 0.01;

export interface CheckedTranslation {
  value: string;
  rejection?: string;
  warning?: string;
}

export interface ImportReport {
  stored: number;
  alreadyTranslated: number;
  unknownKeys: string[];
  rejected: { key: string; reason: string }[];
  warnings: { key: string; note: string }[];
}

const polishLetterShareOf = (text: string): number =>
  text.length ? (text.match(POLISH_LETTER_PATTERN)?.length ?? 0) / text.length : 0;

const checkHtml = (field: ContentField, translated: string): CheckedTranslation => {
  const cleanSource = sanitizeRichHtml(field.source);
  const cleanTranslation = sanitizeRichHtml(translated);
  const structure = compareStructure(cleanSource, cleanTranslation);
  const value = structure.verdict === 'same' ? withSourceSpacers(cleanSource, cleanTranslation) : cleanTranslation;
  if (structure.verdict === 'different') {
    const details = [
      structure.missing.length ? `missing ${structure.missing.join(' ')}` : '',
      structure.unexpected.length ? `unexpected ${structure.unexpected.join(' ')}` : '',
    ];
    return { value, rejection: `tags differ: ${details.filter(Boolean).join('; ')}` };
  }
  const sourceText = plainTextOf(field.source, 'html');
  const translatedText = plainTextOf(value, 'html');
  const ratio = translatedText.length / sourceText.length;
  const isLongEnoughToJudge = sourceText.length >= MIN_LENGTH_FOR_RATIO_CHECK;
  if (isLongEnoughToJudge && (ratio < SHORTEST_PLAUSIBLE_RATIO || ratio > LONGEST_PLAUSIBLE_RATIO)) {
    return { value, rejection: `text is ${ratio.toFixed(2)} of the original length` };
  }
  if (isLongEnoughToJudge && polishLetterShareOf(translatedText) > POLISH_LETTER_SHARE_WORTH_A_LOOK) {
    return { value, warning: 'still reads like Polish' };
  }
  return structure.verdict === 'reordered' ? { value, warning: 'tags in another order' } : { value };
};

export const checkTranslation = (field: ContentField, translated: string): CheckedTranslation => {
  if (field.kind === 'html') {
    return checkHtml(field, translated);
  }
  const value = translated.trim();
  return value ? { value } : { value, rejection: 'empty' };
};

export const storeTranslatedItems = (
  db: Db,
  items: BundleItem[],
  options: { overwrite?: boolean; dryRun?: boolean } = {},
): ImportReport => {
  const fields = readContentFields(db);
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const stored = readStoredTranslations(db);
  const report: ImportReport = { stored: 0, alreadyTranslated: 0, unknownKeys: [], rejected: [], warnings: [] };

  // A text translated once serves every field with the same Polish wording.
  const fieldsSharingTextWith = (field: ContentField): ContentField[] =>
    field.kind === 'text'
      ? fields.filter((other) => other.kind === 'text' && other.source.trim() === field.source.trim())
      : [field];

  db.transaction((tx) => {
    for (const item of items) {
      const field = fieldsByKey.get(item.key);
      if (!field) {
        report.unknownKeys.push(item.key);
        continue;
      }
      if (stored.has(field.key) && !options.overwrite) {
        report.alreadyTranslated += 1;
        continue;
      }
      const checked = checkTranslation(field, item.text);
      if (checked.rejection) {
        report.rejected.push({ key: field.key, reason: checked.rejection });
        continue;
      }
      if (checked.warning) {
        report.warnings.push({ key: field.key, note: checked.warning });
      }
      for (const target of fieldsSharingTextWith(field)) {
        if (target.key !== field.key && stored.has(target.key)) {
          continue;
        }
        if (options.dryRun) {
          report.stored += 1;
          continue;
        }
        tx.insert(schema.translations)
          .values({
            entity: target.entity,
            entityId: target.entityId,
            field: target.column,
            locale: TRANSLATION_LOCALE,
            value: checked.value,
          })
          .onConflictDoUpdate({
            target: [
              schema.translations.entity,
              schema.translations.entityId,
              schema.translations.field,
              schema.translations.locale,
            ],
            set: { value: checked.value },
          })
          .run();
        stored.set(target.key, checked.value);
        report.stored += 1;
      }
    }
  });
  return report;
};
