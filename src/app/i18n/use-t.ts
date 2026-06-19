import { useCallback } from "react";
import { useAppStore } from "../store/app-store";
import { dictionaries, type TranslationKey } from "./translations";

export function useT() {
  const { state } = useAppStore();
  return useCallback(
    (key: TranslationKey, fallback?: string) => {
      const dict = dictionaries[state.language] ?? dictionaries.fr;
      return dict[key] ?? fallback ?? dictionaries.fr[key] ?? key;
    },
    [state.language],
  );
}
