import { SupportedLanguage } from "@quickbite/types";

export interface LanguageMeta {
  code: SupportedLanguage;
  nativeName: string;
  englishName: string;
  rtl?: boolean;
}

// New languages plug in here — everything else (UI strings, FAQ content)
// keys off this same SupportedLanguage union, so adding one is a matter of
// adding a row here plus the corresponding translations.
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
  { code: "hinglish", nativeName: "Hinglish", englishName: "Hinglish" },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati" },
  { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", rtl: true },
];

export function isRtlLanguage(code: SupportedLanguage): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

/** Best-effort mapping from the browser's navigator.language to one of our
 *  supported codes. Falls back to "en" for anything unrecognized. */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en";
  const nav = (navigator.language || "en").toLowerCase();
  const prefix = nav.split("-")[0];
  const match = LANGUAGES.find((l) => l.code === prefix);
  return match ? match.code : "en";
}
