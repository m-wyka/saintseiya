import { z } from 'zod';

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
      .min(USER_NAME_MIN_LENGTH, `Nick musi mieć co najmniej ${USER_NAME_MIN_LENGTH} znaki`)
      .max(USER_NAME_MAX_LENGTH, `Nick może mieć najwyżej ${USER_NAME_MAX_LENGTH} znaków`)
      .regex(USER_NAME_PATTERN, 'Nick może zawierać litery, cyfry, spacje oraz znaki . _ -'),
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
