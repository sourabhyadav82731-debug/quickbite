import { SupportedLanguage } from "@quickbite/types";
import { Portal } from "./types";

export type QuickActionKey =
  | "orders"
  | "delivery"
  | "restaurants"
  | "payment"
  | "kitchen"
  | "pickup"
  | "menu"
  | "activeDelivery"
  | "navigation"
  | "wallet"
  | "trips"
  | "dashboard"
  | "users";

export interface QuickActionConfig {
  icon: string;
  labelKey: QuickActionKey;
  route: string;
}

// Single source of truth for the welcome-state cards AND the composer's
// per-message quick actions — every route here is an existing page, nothing
// new was created for this widget.
export const QUICK_ACTIONS: Record<Portal, QuickActionConfig[]> = {
  customer: [
    { icon: "🛒", labelKey: "orders", route: "/customer/orders" },
    { icon: "📍", labelKey: "delivery", route: "/customer/addresses" },
    { icon: "🍔", labelKey: "restaurants", route: "/customer" },
    { icon: "💳", labelKey: "payment", route: "/customer/checkout" },
  ],
  restaurant: [
    { icon: "📦", labelKey: "orders", route: "/restaurant/orders" },
    { icon: "🍳", labelKey: "kitchen", route: "/restaurant/kitchen" },
    { icon: "🔐", labelKey: "pickup", route: "/restaurant/kitchen" },
    { icon: "🍔", labelKey: "menu", route: "/restaurant/menu" },
  ],
  delivery: [
    { icon: "🚀", labelKey: "activeDelivery", route: "/delivery/active" },
    { icon: "📍", labelKey: "navigation", route: "/delivery/active" },
    { icon: "💰", labelKey: "wallet", route: "/delivery/payouts" },
    { icon: "📜", labelKey: "trips", route: "/delivery/history" },
  ],
  admin: [
    { icon: "📊", labelKey: "dashboard", route: "/admin" },
    { icon: "📦", labelKey: "orders", route: "/admin/orders" },
    { icon: "🏪", labelKey: "restaurants", route: "/admin/restaurants" },
    { icon: "👥", labelKey: "users", route: "/admin/customers" },
  ],
};

export const QUICK_ACTION_LABEL: Record<QuickActionKey, Record<SupportedLanguage, string>> = {
  orders: { en: "Orders", hi: "ऑर्डर", hinglish: "Orders", kn: "ಆರ್ಡರ್‌ಗಳು", ta: "ஆர்டர்கள்", te: "ఆర్డర్లు", mr: "ऑर्डर्स", bn: "অর্ডার", gu: "ઓર્ડર", ml: "ഓർഡറുകൾ", pa: "ਆਰਡਰ", ur: "آرڈرز" },
  delivery: { en: "Delivery", hi: "डिलीवरी", hinglish: "Delivery", kn: "ಡೆಲಿವರಿ", ta: "டெலிவரி", te: "డెలివరీ", mr: "डिलिव्हरी", bn: "ডেলিভারি", gu: "ડિલિવરી", ml: "ഡെലിവറി", pa: "ਡਿਲੀਵਰੀ", ur: "ڈिلیوری" },
  restaurants: { en: "Restaurants", hi: "रेस्टोरेंट", hinglish: "Restaurants", kn: "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು", ta: "உணவகங்கள்", te: "రెస్టారెంట్లు", mr: "रेस्टॉरंट्स", bn: "রেস্তোরাঁ", gu: "રેસ્ટોરન્ટ", ml: "റെസ്റ്റോറന്റുകൾ", pa: "ਰੈਸਟੋਰੈਂਟ", ur: "ریسٹورنٹس" },
  payment: { en: "Payment", hi: "भुगतान", hinglish: "Payment", kn: "ಪಾವತಿ", ta: "பணம் செலுத்தல்", te: "చెల్లింపు", mr: "पेमेंट", bn: "পেমেন্ট", gu: "પેમેન્ટ", ml: "പേയ്‌മെന്റ്", pa: "ਭੁਗਤਾਨ", ur: "ادائیگی" },
  kitchen: { en: "Kitchen", hi: "किचन", hinglish: "Kitchen", kn: "ಅಡುಗೆಮನೆ", ta: "சமையலறை", te: "కిచెన్", mr: "किचन", bn: "কিচেন", gu: "કિચન", ml: "അടുക്കള", pa: "ਰਸੋਈ", ur: "کچن" },
  pickup: { en: "Pickup OTP", hi: "पिकअप OTP", hinglish: "Pickup OTP", kn: "ಪಿಕಪ್ OTP", ta: "பிக்அப் OTP", te: "పికప్ OTP", mr: "पिकअप OTP", bn: "পিকআপ OTP", gu: "પિકઅપ OTP", ml: "പിക്കപ്പ് OTP", pa: "ਪਿਕਅੱਪ OTP", ur: "پک اپ OTP" },
  menu: { en: "Menu", hi: "मेन्यू", hinglish: "Menu", kn: "ಮೆನು", ta: "மெனு", te: "మెనూ", mr: "मेनू", bn: "মেনু", gu: "મેનૂ", ml: "മെനു", pa: "ਮੀਨੂ", ur: "مینو" },
  activeDelivery: { en: "Active Delivery", hi: "सक्रिय डिलीवरी", hinglish: "Active Delivery", kn: "ಸಕ್ರಿಯ ಡೆಲಿವರಿ", ta: "செயலில் டெலிவரி", te: "యాక్టివ్ డెలివరీ", mr: "सक्रिय डिलिव्हरी", bn: "সক্রিয় ডেলিভারি", gu: "સક્રિય ડિલિવરી", ml: "ആക്ടീവ് ഡെലിവறി", pa: "ਸਰਗਰਮ ਡਿਲੀਵਰੀ", ur: "فعال ڈिلیوری" },
  navigation: { en: "Navigation", hi: "नेविगेशन", hinglish: "Navigation", kn: "ನ್ಯಾವಿಗೇಷನ್", ta: "வழிசெலுத்தல்", te: "నావిగేషన్", mr: "नेव्हिगेशन", bn: "নেভিগেশন", gu: "નેવિગેશન", ml: "നാവിഗേഷൻ", pa: "ਨੇਵੀਗੇਸ਼ਨ", ur: "نیویگیشن" },
  wallet: { en: "Wallet", hi: "वॉलेट", hinglish: "Wallet", kn: "ವಾಲೆಟ್", ta: "வாலட்", te: "వాలెట్", mr: "वॉलेट", bn: "ওয়ালেট", gu: "વોલેટ", ml: "വാലറ്റ്", pa: "ਵਾਲਿਟ", ur: "والٹ" },
  trips: { en: "Trips", hi: "ट्रिप्स", hinglish: "Trips", kn: "ಟ್ರಿಪ್‌ಗಳು", ta: "பயணங்கள்", te: "ట్రిప్‌లు", mr: "ट्रिप्स", bn: "ট্রিপ", gu: "ટ્રિપ્સ", ml: "ട്രിപ്പുകൾ", pa: "ਟ੍ਰਿਪਸ", ur: "ٹرپس" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड", hinglish: "Dashboard", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", ta: "டாஷ்போர்டு", te: "డాష్‌బోర్డ్", mr: "डॅशबोर्ड", bn: "ড্যাশবোর্ড", gu: "ડેશબોર્ડ", ml: "ഡാഷ്ബോർഡ്", pa: "ਡੈਸ਼ਬੋਰਡ", ur: "ڈیش بورڈ" },
  users: { en: "Users", hi: "यूज़र्स", hinglish: "Users", kn: "ಬಳಕೆದಾರರು", ta: "பயனர்கள்", te: "వినియోగదారులు", mr: "युजर्स", bn: "ব্যবহারকারী", gu: "વપરાશકર્તાઓ", ml: "ഉപയോക്താക്കൾ", pa: "ਯੂਜ਼ਰ", ur: "صارفین" },
};

export function quickActionLabel(key: QuickActionKey, language: SupportedLanguage): string {
  return QUICK_ACTION_LABEL[key][language] ?? QUICK_ACTION_LABEL[key].en;
}
