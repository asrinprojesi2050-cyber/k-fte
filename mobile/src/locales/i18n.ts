import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import tr from "./tr.json";
import en from "./en.json";
import mk from "./mk.json";
import sq from "./sq.json";

const LANGUAGE_KEY = "kofte.language";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  mk: { translation: mk },
  sq: { translation: sq },
};

export const initI18n = async () => {
  let savedLanguage = "tr";
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lang) savedLanguage = lang;
  } catch (error) {
    console.error("Error loading language", error);
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v3", // Required for React Native
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
