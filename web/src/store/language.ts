import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, TranslationKey } from "../locales/translations";

type Language = "pt" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "pt",
      setLanguage: (language) => set({ language }),
      t: (key: TranslationKey) => {
        const { language } = get();
        return translations[language][key] || key;
      },
    }),
    {
      name: "language-storage",
    },
  ),
);
