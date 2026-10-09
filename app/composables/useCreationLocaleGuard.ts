// A new record is always stored as the Polish version, whatever language the panel is editing.
export const useCreationLocaleGuard = () => {
  const contentLocale = useContentLocaleStore();
  const confirmation = useConfirmationStore();
  const { t } = useI18n();

  return async (isNewRecord: boolean): Promise<boolean> =>
    !isNewRecord || !contentLocale.isTranslating || confirmation.ask(t('ADMIN_UI.NEW_RECORD_IS_POLISH'));
};
