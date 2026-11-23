import { TRANSLATIONS } from '../i18n/translations.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useT() {
  const language = useAppStore((s) => s.language);
  return TRANSLATIONS[language] || TRANSLATIONS.en;
}
