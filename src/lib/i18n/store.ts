import { create } from "zustand";

export type Locale = "en" | "hi";

type State = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
};

export const useLocale = create<State>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    try {
      localStorage.setItem("barnstorm-locale", locale);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    set({ locale });
  },
  hydrate: () => {
    let locale: Locale = "en";
    try {
      const stored = localStorage.getItem("barnstorm-locale");
      if (stored === "hi" || stored === "en") locale = stored;
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale;
    set({ locale });
  },
}));
