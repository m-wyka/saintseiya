import { z } from 'zod';
import { messageKey } from './messages';

const USER_NAME_MIN_LENGTH = 3;
const USER_NAME_MAX_LENGTH = 30;
const USER_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

export const userNameKey = (name: string): string => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl');

export const userNameSchema = z
  .string()
  .trim()
  .transform((name) => name.replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(USER_NAME_MIN_LENGTH, messageKey('VALIDATION.USER_NAME_TOO_SHORT', { min: USER_NAME_MIN_LENGTH }))
      .max(USER_NAME_MAX_LENGTH, messageKey('VALIDATION.USER_NAME_TOO_LONG', { max: USER_NAME_MAX_LENGTH }))
      .regex(USER_NAME_PATTERN, 'VALIDATION.USER_NAME_INVALID'),
  );

export const fitUserName = (rawName: string, fallback: string): string => {
  const cleaned = rawName
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, USER_NAME_MAX_LENGTH)
    .trim();
  return cleaned.length >= USER_NAME_MIN_LENGTH ? cleaned : fallback;
};
