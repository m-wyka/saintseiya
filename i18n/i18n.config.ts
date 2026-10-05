const polishPluralRules = new Intl.PluralRules('pl-PL');
const POLISH_PLURAL_FORMS = ['one', 'few'];

const polishPluralIndex = (count: number): number => {
  const formIndex = POLISH_PLURAL_FORMS.indexOf(polishPluralRules.select(count));
  return formIndex === -1 ? POLISH_PLURAL_FORMS.length : formIndex;
};

export default defineI18nConfig(() => ({
  flatJson: true,
  fallbackLocale: 'pl',
  pluralRules: { pl: polishPluralIndex },
}));
