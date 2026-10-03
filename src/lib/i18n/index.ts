import { DICT, interpolate, type DictKey } from "./dict";
import { useLocale, type Locale } from "./store";

export { useLocale, type Locale };
export type { DictKey };

export function useT() {
  const locale = useLocale((s) => s.locale);
  return (key: DictKey, vars?: Record<string, string | number>) => {
    const raw = DICT[locale][key] ?? DICT.en[key];
    return vars ? interpolate(raw, vars) : raw;
  };
}

export function useCopy<T>(block: { en: T; hi: unknown }): T {
  const locale = useLocale((s) => s.locale);
  return (locale === "hi" ? block.hi : block.en) as T;
}
