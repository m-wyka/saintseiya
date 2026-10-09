const SMILEYS: Record<string, string> = {
  ':)': '🙂',
  ';)': '😉',
  ':(': '🙁',
  ':|': '😐',
  ':o': '😮',
  ':p': '😛',
  'b)': '😎',
  ':d': '😀',
  ':@': '😠',
};
const SMILEY_PATTERN = /(^|[\s(>])(:\)|;\)|:\(|:\||:o|:p|b\)|:d|:@)(?=$|[\s.,!?<)])/gi;
const LIST_MARKER = 'b)';

const closesOpenParenthesis = (textBefore: string): boolean => {
  const line = textBefore.slice(textBefore.lastIndexOf('\n') + 1);
  return (line.match(/\(/g)?.length ?? 0) > (line.match(/\)/g)?.length ?? 0);
};

export const replaceSmileys = (text: string): string =>
  text.replace(SMILEY_PATTERN, (match, lead: string, code: string, offset: number) => {
    const isPlainText =
      code === LIST_MARKER || (code === 'B)' && closesOpenParenthesis(text.slice(0, offset + lead.length)));
    return isPlainText ? match : `${lead}${SMILEYS[code.toLowerCase()]}`;
  });
