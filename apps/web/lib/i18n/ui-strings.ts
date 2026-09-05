import { SupportedLanguage } from "@quickbite/types";

type Dict = Record<SupportedLanguage, string>;

export interface UiStrings {
  floatingButton: Dict;
  panelTitle: Dict;
  languageLabel: Dict;
  inputPlaceholder: Dict;
  send: Dict;
  close: Dict;
  quickActionsHeader: Dict;
  greeting: Dict;
  typing: Dict;
  useCurrentLocation: Dict;
  detectingLocation: Dict;
  permissionDenied: Dict;
  locationUnavailable: Dict;
  retry: Dict;
  currentLocationHeading: Dict;
  addressLabel: Dict;
  latitudeLabel: Dict;
  longitudeLabel: Dict;
  useThisLocation: Dict;
  editManually: Dict;
  detectRestaurantLocation: Dict;
  enableLocationSharing: Dict;
  locationSharingOn: Dict;
  navigate: Dict;
  panelSubtitle: Dict;
  welcomeHeading: Dict;
  welcomeDescription: Dict;
  minimize: Dict;
  thinking: Dict;
  offline: Dict;
  micLabel: Dict;
  newBadgeLabel: Dict;
}

export const UI_STRINGS: UiStrings = {
  floatingButton: {
    en: "Quickbits Help", hi: "Quickbits सहायता", hinglish: "Quickbits Help",
    kn: "Quickbits ಸಹಾಯ", ta: "Quickbits உதவி", te: "Quickbits సహాయం",
    mr: "Quickbits मदत", bn: "Quickbits সাহায্য", gu: "Quickbits મદદ", ml: "Quickbits സഹായം",
    pa: "Quickbits ਮਦਦ", ur: "Quickbits مدد",
  },
  panelTitle: {
    en: "Quickbits Assistant", hi: "Quickbits असिस्टेंट", hinglish: "Quickbits Assistant",
    kn: "Quickbits ಸಹಾಯಕ", ta: "Quickbits உதவியாளர்", te: "Quickbits సహాయకుడు",
    mr: "Quickbits सहाय्यक", bn: "Quickbits সহায়ক", gu: "Quickbits સહાયક", ml: "Quickbits അസിസ്റ്റന്റ്",
    pa: "Quickbits ਸਹਾਇਕ", ur: "Quickbits اسسٹنٹ",
  },
  languageLabel: {
    en: "Language", hi: "भाषा", hinglish: "Language",
    kn: "ಭಾಷೆ", ta: "மொழி", te: "భాష",
    mr: "भाषा", bn: "ভাষা", gu: "ભાષા", ml: "ഭാഷ",
    pa: "ਭਾਸ਼ਾ", ur: "زبان",
  },
  inputPlaceholder: {
    en: "Type your question...", hi: "अपना सवाल लिखें...", hinglish: "Apna sawaal likho...",
    kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ...", ta: "உங்கள் கேள்வியை உள்ளிடவும்...", te: "మీ ప్రశ్న టైప్ చేయండి...",
    mr: "तुमचा प्रश्न लिहा...", bn: "আপনার প্রশ্ন লিখুন...", gu: "તમારો પ્રશ્ન લખો...", ml: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക...",
    pa: "ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ...", ur: "اپنا سوال لکھیں...",
  },
  send: {
    en: "Send", hi: "भेजें", hinglish: "Send",
    kn: "ಕಳುಹಿಸಿ", ta: "அனுப்பு", te: "పంపండి",
    mr: "पाठवा", bn: "পাঠান", gu: "મોકલો", ml: "അയയ്ക്കുക",
    pa: "ਭੇਜੋ", ur: "بھیجیں",
  },
  close: {
    en: "Close", hi: "बंद करें", hinglish: "Close",
    kn: "ಮುಚ್ಚಿ", ta: "மூடு", te: "మూసివేయండి",
    mr: "बंद करा", bn: "বন্ধ করুন", gu: "બંધ કરો", ml: "അടയ്ക്കുക",
    pa: "ਬੰਦ ਕਰੋ", ur: "بند کریں",
  },
  quickActionsHeader: {
    en: "Quick Actions", hi: "त्वरित कार्य", hinglish: "Quick Actions",
    kn: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು", ta: "விரைவு செயல்கள்", te: "త్వరిత చర్యలు",
    mr: "क्विक अ‍ॅक्शन्स", bn: "দ্রুত কাজ", gu: "ઝડપી ક્રિયાઓ", ml: "ക്വിക്ക് ആക്ഷനുകൾ",
    pa: "ਤੇਜ਼ ਕਾਰਵਾਈਆਂ", ur: "فوری اعمال",
  },
  greeting: {
    en: "Hi! How can I help you today?", hi: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
    hinglish: "Hi! Aapki kaise madad kar sakta hoon?", kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    ta: "வணக்கம்! நான் உங்களுக்கு எப்படி உதவலாம்?", te: "నమస్తే! నేను మీకు ఎలా సహాయం చేయగలను?",
    mr: "नमस्कार! मी तुम्हाला कशी मदत करू शकतो?", bn: "হ্যালো! আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
    gu: "નમસ્તે! હું તમને કેવી રીતે મદદ કરી શકું?", ml: "നമസ്കാരം! ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?", ur: "السلام علیکم! میں آپ کی کیسے مدد کر سکتا ہوں؟",
  },
  typing: {
    en: "Typing…", hi: "टाइप हो रहा है…", hinglish: "Typing…",
    kn: "ಟೈಪ್ ಆಗುತ್ತಿದೆ…", ta: "தட்டச்சு செய்கிறது…", te: "టైప్ చేస్తోంది…",
    mr: "टाइप करत आहे…", bn: "টাইপ হচ্ছে…", gu: "ટાઈપ થઈ રહ્યું છે…", ml: "ടൈപ്പ് ചെയ്യുന്നു…",
    pa: "ਟਾਈਪ ਹੋ ਰਿਹਾ ਹੈ…", ur: "ٹائپ ہو رہا ہے…",
  },
  useCurrentLocation: {
    en: "📍 Use Current Location", hi: "📍 वर्तमान स्थान का उपयोग करें", hinglish: "📍 Current Location Use Karo",
    kn: "📍 ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ", ta: "📍 தற்போதைய இருப்பிடத்தைப் பயன்படுத்து", te: "📍 ప్రస్తుత స్థానాన్ని వాడండి",
    mr: "📍 सध्याचे स्थान वापरा", bn: "📍 বর্তমান অবস্থান ব্যবহার করুন", gu: "📍 વર્તમાન સ્થાન વાપરો", ml: "📍 നിലവിലെ സ്ഥാനം ഉപയോഗിക്കുക",
    pa: "📍 ਮੌਜੂਦਾ ਟਿਕਾਣਾ ਵਰਤੋ", ur: "📍 موجودہ مقام استعمال کریں",
  },
  detectingLocation: {
    en: "Detecting your location...", hi: "आपका स्थान पता लगाया जा रहा है...", hinglish: "Location detect ho raha hai...",
    kn: "ನಿಮ್ಮ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಲಾಗುತ್ತಿದೆ...", ta: "உங்கள் இருப்பிடம் கண்டறியப்படுகிறது...", te: "మీ స్థానాన్ని గుర్తిస్తోంది...",
    mr: "तुमचे स्थान शोधले जात आहे...", bn: "আপনার অবস্থান শনাক্ত করা হচ্ছে...", gu: "તમારું સ્થાન શોધાઈ રહ્યું છે...", ml: "നിങ്ങളുടെ സ്ഥാനം കണ്ടെത്തുന്നു...",
    pa: "ਤੁਹਾਡਾ ਟਿਕਾਣਾ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ...", ur: "آپ کا مقام تلاش کیا جا رہا ہے...",
  },
  permissionDenied: {
    en: "Location permission was denied. You can enter your address manually.",
    hi: "स्थान अनुमति अस्वीकृत हुई। आप पता खुद लिख सकते हैं।",
    hinglish: "Location permission deny ho gayi. Aap address manually daal sakte ho.",
    kn: "ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ವಿಳಾಸವನ್ನು ಸ್ವಂತವಾಗಿ ನಮೂದಿಸಿ.",
    ta: "இருப்பிட அனுமதி மறுக்கப்பட்டது. முகவரியை நீங்களே உள்ளிடலாம்.",
    te: "లొకేషన్ అనుమతి తిరస్కరించబడింది. చిరునామాను మీరే నమోదు చేయండి.",
    mr: "स्थान परवानगी नाकारली. तुम्ही पत्ता स्वतः टाकू शकता.",
    bn: "লোকেশন অনুমতি প্রত্যাখ্যান হয়েছে। আপনি নিজে ঠিকানা দিতে পারেন।",
    gu: "લોકેશન પરવાનગી નકારાઈ. તમે જાતે સરનામું નાખી શકો.",
    ml: "ലൊക്കേഷൻ അനുമതി നിരസിച്ചു. വിലാസം സ്വയം നൽകാം.",
    pa: "ਟਿਕਾਣਾ ਇਜਾਜ਼ਤ ਰੱਦ ਹੋਈ। ਤੁਸੀਂ ਖੁਦ ਪਤਾ ਪਾ ਸਕਦੇ ਹੋ।",
    ur: "مقام کی اجازت مسترد کر دی گئی۔ آپ خود پتہ درج کر سکتے ہیں۔",
  },
  locationUnavailable: {
    en: "Location is unavailable on this device. Please enter your address manually.",
    hi: "इस डिवाइस पर स्थान उपलब्ध नहीं है। कृपया पता खुद लिखें।",
    hinglish: "Is device pe location available nahi hai. Address manually daalein.",
    kn: "ಈ ಸಾಧನದಲ್ಲಿ ಸ್ಥಳ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ವಿಳಾಸ ಸ್ವಂತವಾಗಿ ನಮೂದಿಸಿ.",
    ta: "இந்த சாதனத்தில் இருப்பிடம் கிடைக்கவில்லை. முகவரியை நீங்களே உள்ளிடவும்.",
    te: "ఈ పరికరంలో లొకేషన్ అందుబాటులో లేదు. దయచేసి చిరునామా నమోదు చేయండి.",
    mr: "या डिव्हाइसवर स्थान उपलब्ध नाही. कृपया पत्ता स्वतः लिहा.",
    bn: "এই ডিভাইসে লোকেশন উপলব্ধ নেই। দয়া করে ঠিকানা লিখুন।",
    gu: "આ ડિવાઈસ પર લોકેશન ઉપલબ્ધ નથી. કૃપા કરી સરનામું જાતે લખો.",
    ml: "ഈ ഉപകരണത്തിൽ ലൊക്കേഷൻ ലഭ്യമല്ല. ദയവായി വിലാസം സ്വയം നൽകുക.",
    pa: "ਇਸ ਡਿਵਾਈਸ ਤੇ ਟਿਕਾਣਾ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਪਤਾ ਖੁਦ ਲਿਖੋ।",
    ur: "اس ڈیوائس پر مقام دستیاب نہیں۔ براہ کرم پتہ خود درج کریں۔",
  },
  retry: {
    en: "Retry", hi: "फिर से कोशिश करें", hinglish: "Retry Karo",
    kn: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", ta: "மீண்டும் முயற்சிக்கவும்", te: "మళ్లీ ప్రయత్నించండి",
    mr: "पुन्हा प्रयत्न करा", bn: "আবার চেষ্টা করুন", gu: "ફરી પ્રયાસ કરો", ml: "വീണ്ടും ശ്രമിക്കുക",
    pa: "ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ", ur: "دوبارہ کوشش کریں",
  },
  currentLocationHeading: {
    en: "📍 Current Location", hi: "📍 वर्तमान स्थान", hinglish: "📍 Current Location",
    kn: "📍 ಪ್ರಸ್ತುತ ಸ್ಥಳ", ta: "📍 தற்போதைய இருப்பிடம்", te: "📍 ప్రస్తుత స్థానం",
    mr: "📍 सध्याचे स्थान", bn: "📍 বর্তমান অবস্থান", gu: "📍 વર્તમાન સ્થાન", ml: "📍 നിലവിലെ സ്ഥാനം",
    pa: "📍 ਮੌਜੂਦਾ ਟਿਕਾਣਾ", ur: "📍 موجودہ مقام",
  },
  addressLabel: {
    en: "Address", hi: "पता", hinglish: "Address",
    kn: "ವಿಳಾಸ", ta: "முகவரி", te: "చిరునామా",
    mr: "पत्ता", bn: "ঠিকানা", gu: "સરનામું", ml: "വിലാസം",
    pa: "ਪਤਾ", ur: "پتہ",
  },
  latitudeLabel: {
    en: "Latitude", hi: "अक्षांश", hinglish: "Latitude",
    kn: "ಅಕ್ಷಾಂಶ", ta: "அட்சரேகை", te: "అక్షాంశం",
    mr: "अक्षांश", bn: "অক্ষাংশ", gu: "અક્ષાંશ", ml: "അക്ഷാംശം",
    pa: "ਅਕਸ਼ਾਂਸ਼", ur: "طول البلد",
  },
  longitudeLabel: {
    en: "Longitude", hi: "देशांतर", hinglish: "Longitude",
    kn: "ರೇಖಾಂಶ", ta: "தீர்க்கரேகை", te: "రేఖాంశం",
    mr: "रेखांश", bn: "দ্রাঘিমাংশ", gu: "રેખાંશ", ml: "രേഖാംശം",
    pa: "ਲੰਬਕਾਰ", ur: "عرض البلد",
  },
  useThisLocation: {
    en: "Use This Location", hi: "यह स्थान उपयोग करें", hinglish: "Ye Location Use Karo",
    kn: "ಈ ಸ್ಥಳ ಬಳಸಿ", ta: "இந்த இருப்பிடத்தைப் பயன்படுத்து", te: "ఈ స్థానాన్ని వాడండి",
    mr: "हे स्थान वापरा", bn: "এই অবস্থান ব্যবহার করুন", gu: "આ સ્થાન વાપરો", ml: "ഈ സ്ഥാനം ഉപയോഗിക്കുക",
    pa: "ਇਹ ਟਿਕਾਣਾ ਵਰਤੋ", ur: "یہ مقام استعمال کریں",
  },
  editManually: {
    en: "Edit Manually", hi: "स्वयं संपादित करें", hinglish: "Manually Edit Karo",
    kn: "ಸ್ವತಃ ಸಂಪಾದಿಸಿ", ta: "நேரடியாகத் திருத்து", te: "మాన్యువల్‌గా మార్చండి",
    mr: "स्वतः संपादित करा", bn: "নিজে সম্পাদনা করুন", gu: "જાતે સંપાદિત કરો", ml: "സ്വയം എഡിറ്റ് ചെയ്യുക",
    pa: "ਖੁਦ ਸੋਧੋ", ur: "دستی طور پر ترمیم کریں",
  },
  detectRestaurantLocation: {
    en: "📍 Detect Restaurant Location", hi: "📍 रेस्टोरेंट स्थान पता करें", hinglish: "📍 Restaurant Location Detect Karo",
    kn: "📍 ರೆಸ್ಟೋರೆಂಟ್ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ", ta: "📍 உணவக இருப்பிடத்தைக் கண்டறியவும்", te: "📍 రెస్టారెంట్ స్థానాన్ని గుర్తించండి",
    mr: "📍 रेस्टॉरंट स्थान शोधा", bn: "📍 রেস্তোরাঁর অবস্থান শনাক্ত করুন", gu: "📍 રેસ્ટોરન્ટ સ્થાન શોધો", ml: "📍 റെസ്റ്റോറന്റ് സ്ഥാനം കണ്ടെത്തുക",
    pa: "📍 ਰੈਸਟੋਰੈਂਟ ਟਿਕਾਣਾ ਲੱਭੋ", ur: "📍 ریسٹورنٹ کا مقام تلاش کریں",
  },
  enableLocationSharing: {
    en: "Enable Location Sharing", hi: "स्थान साझा करना चालू करें", hinglish: "Location Sharing On Karo",
    kn: "ಸ್ಥಳ ಹಂಚಿಕೆ ಆನ್ ಮಾಡಿ", ta: "இருப்பிடப் பகிர்வை இயக்கு", te: "లొకేషన్ షేరింగ్ ఆన్ చేయండి",
    mr: "स्थान शेअरिंग सुरू करा", bn: "লোকেশন শেয়ারিং চালু করুন", gu: "લોકેશન શેરિંગ ચાલુ કરો", ml: "ലൊക്കേഷൻ ഷെയറിംഗ് ഓണാക്കുക",
    pa: "ਟਿਕਾਣਾ ਸਾਂਝਾ ਕਰਨਾ ਚਾਲੂ ਕਰੋ", ur: "مقام کا اشتراک آن کریں",
  },
  locationSharingOn: {
    en: "Sharing your live location", hi: "आपका लाइव स्थान साझा हो रहा है", hinglish: "Live location share ho raha hai",
    kn: "ನಿಮ್ಮ ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ", ta: "உங்கள் நேரலை இருப்பிடம் பகிரப்படுகிறது", te: "మీ లైవ్ లొకేషన్ షేర్ అవుతోంది",
    mr: "तुमचे लाइव्ह स्थान शेअर होत आहे", bn: "আপনার লাইভ লোকেশন শেয়ার হচ্ছে", gu: "તમારું લાઈવ લોકેશન શેર થઈ રહ્યું છે", ml: "നിങ്ങളുടെ ലൈവ് ലൊക്കേഷൻ പങ്കിടുന്നു",
    pa: "ਤੁਹਾਡਾ ਲਾਈਵ ਟਿਕਾਣਾ ਸਾਂਝਾ ਹੋ ਰਿਹਾ ਹੈ", ur: "آپ کا لائیو مقام شیئر ہو رہا ہے",
  },
  navigate: {
    en: "🧭 Navigate", hi: "🧭 नेविगेट करें", hinglish: "🧭 Navigate Karo",
    kn: "🧭 ನ್ಯಾವಿಗೇಟ್ ಮಾಡಿ", ta: "🧭 வழிசெலுத்து", te: "🧭 నావిగేట్ చేయండి",
    mr: "🧭 नेव्हिगेट करा", bn: "🧭 নেভিগেট করুন", gu: "🧭 નેવિગેટ કરો", ml: "🧭 നാവിഗേറ്റ് ചെയ്യുക",
    pa: "🧭 ਨੇਵੀਗੇਟ ਕਰੋ", ur: "🧭 نیویگیٹ کریں",
  },
  panelSubtitle: {
    en: "Your food-delivery helper", hi: "आपका फ़ूड-डिलीवरी सहायक", hinglish: "Aapka food-delivery helper",
    kn: "ನಿಮ್ಮ ಆಹಾರ ವಿತರಣಾ ಸಹಾಯಕ", ta: "உங்கள் உணவு டெலிவரி உதவியாளர்", te: "మీ ఫుడ్-డెలివరీ సహాయకుడు",
    mr: "तुमचा फूड-डिलिव्हरी सहाय्यक", bn: "আপনার ফুড-ডেলিভারি সহায়ক", gu: "તમારો ફૂડ-ડિલિવરી સહાયક", ml: "നിങ്ങളുടെ ഫുഡ്-ഡെലിവറി സഹായി",
    pa: "ਤੁਹਾਡਾ ਫੂਡ-ਡਿਲੀਵਰੀ ਸਹਾਇਕ", ur: "آپ کا فوڈ ڈिلیوری مددگار",
  },
  welcomeHeading: {
    en: "Hi! I'm Quickbits Help", hi: "नमस्ते! मैं Quickbits Help हूं", hinglish: "Hi! Main Quickbits Help hoon",
    kn: "ನಮಸ್ಕಾರ! ನಾನು Quickbits Help", ta: "வணக்கம்! நான் Quickbits Help", te: "నమస్తే! నేను Quickbits Help",
    mr: "नमस्कार! मी Quickbits Help", bn: "হ্যালো! আমি Quickbits Help", gu: "નમસ્તે! હું Quickbits Help", ml: "നമസ്കാരം! ഞാൻ Quickbits Help",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Quickbits Help", ur: "السلام علیکم! میں Quickbits Help ہوں",
  },
  welcomeDescription: {
    en: "I can help you with orders, restaurants, deliveries, payments and more.",
    hi: "मैं ऑर्डर, रेस्टोरेंट, डिलीवरी, भुगतान और बहुत कुछ में मदद कर सकता हूं।",
    hinglish: "Main orders, restaurants, delivery, payment aur bhi bahut kuch mein madad kar sakta hoon.",
    kn: "ಆರ್ಡರ್, ರೆಸ್ಟೋರೆಂಟ್, ಡೆಲಿವರಿ, ಪಾವತಿ ಮತ್ತು ಇನ್ನೂ ಹಲವು ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
    ta: "ஆர்டர்கள், உணவகங்கள், டெலிவரி, பணம் செலுத்துதல் மற்றும் பலவற்றில் நான் உதவ முடியும்.",
    te: "ఆర్డర్లు, రెస్టారెంట్లు, డెలివరీ, చెల్లింపులు మరియు మరిన్నింటిలో నేను సహాయం చేయగలను.",
    mr: "ऑर्डर्स, रेस्टॉरंट्स, डिलिव्हरी, पेमेंट आणि बरेच काही यात मी मदत करू शकतो.",
    bn: "অর্ডার, রেস্তোরাঁ, ডেলিভারি, পেমেন্ট এবং আরও অনেক কিছুতে আমি সাহায্য করতে পারি।",
    gu: "ઓર્ડર, રેસ્ટોરન્ટ, ડિલિવરી, પેમેન્ટ અને બીજું ઘણું બધું માં હું મદદ કરી શકું છું.",
    ml: "ഓർഡറുകൾ, റെസ്റ്റോറന്റുകൾ, ഡെലിവറി, പേയ്‌മെന്റ് എന്നിവയിലും മറ്റും ഞാൻ സഹായിക്കാം.",
    pa: "ਆਰਡਰ, ਰੈਸਟੋਰੈਂਟ, ਡਿਲੀਵਰੀ, ਭੁਗਤਾਨ ਅਤੇ ਹੋਰ ਬਹੁਤ ਕੁਝ ਵਿੱਚ ਮੈਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
    ur: "آرڈرز، ریسٹورنٹس، ڈिلیوری، ادائیگی اور بہت کچھ میں، میں مدد کر سکتا ہوں۔",
  },
  minimize: {
    en: "Minimize", hi: "छोटा करें", hinglish: "Minimize Karo",
    kn: "ಚಿಕ್ಕದಾಗಿಸಿ", ta: "சிறிதாக்கு", te: "చిన్నదిగా చేయండి",
    mr: "लहान करा", bn: "ছোট করুন", gu: "નાનું કરો", ml: "ചെറുതാക്കുക",
    pa: "ਛੋਟਾ ਕਰੋ", ur: "چھوٹا کریں",
  },
  thinking: {
    en: "Quickbits Assistant is thinking…", hi: "Quickbits असिस्टेंट सोच रहा है…", hinglish: "Quickbits Assistant soch raha hai…",
    kn: "Quickbits ಸಹಾಯಕ ಯೋಚಿಸುತ್ತಿದೆ…", ta: "Quickbits உதவியாளர் யோசிக்கிறார்…", te: "Quickbits సహాయకుడు ఆలోచిస్తున్నాడు…",
    mr: "Quickbits सहाय्यक विचार करत आहे…", bn: "Quickbits সহায়ক ভাবছে…", gu: "Quickbits સહાયક વિચારી રહ્યું છે…", ml: "Quickbits അസിസ്റ്റന്റ് ചിന്തിക്കുന്നു…",
    pa: "Quickbits ਸਹਾਇਕ ਸੋਚ ਰਿਹਾ ਹੈ…", ur: "Quickbits اسسٹنٹ سوچ رہا ہے…",
  },
  offline: {
    en: "You're offline. You can still browse these quick help options.",
    hi: "आप ऑफ़लाइन हैं। आप फिर भी ये त्वरित सहायता विकल्प देख सकते हैं।",
    hinglish: "Aap offline ho. Aap ye quick help options fir bhi dekh sakte ho.",
    kn: "ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಈ ತ್ವರಿತ ಸಹಾಯ ಆಯ್ಕೆಗಳನ್ನು ಇನ್ನೂ ನೋಡಬಹುದು.",
    ta: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். இந்த விரைவு உதவி விருப்பங்களை இன்னும் பார்க்கலாம்.",
    te: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. ఈ త్వరిత సహాయ ఎంపికలను ఇప్పటికీ చూడవచ్చు.",
    mr: "तुम्ही ऑफलाइन आहात. तरीही तुम्ही हे क्विक हेल्प पर्याय पाहू शकता.",
    bn: "আপনি অফলাইনে আছেন। আপনি এখনও এই দ্রুত সহায়তা অপশনগুলি দেখতে পারেন।",
    gu: "તમે ઓફલાઈન છો. તમે હજુ પણ આ ઝડપી મદદ વિકલ્પો જોઈ શકો છો.",
    ml: "നിങ്ങൾ ഓഫ്‌ലൈനിലാണ്. ഈ ക്വിക്ക് ഹെൽപ്പ് ഓപ്ഷനുകൾ ഇപ്പോഴും കാണാം.",
    pa: "ਤੁਸੀਂ ਆਫਲਾਈਨ ਹੋ। ਤੁਸੀਂ ਫਿਰ ਵੀ ਇਹ ਤੇਜ਼ ਮਦਦ ਵਿਕਲਪ ਵੇਖ ਸਕਦੇ ਹੋ।",
    ur: "آپ آف لائن ہیں۔ آپ اب بھی یہ فوری مدد کے اختیارات دیکھ سکتے ہیں۔",
  },
  micLabel: {
    en: "Voice input (coming soon)", hi: "आवाज़ इनपुट (जल्द आ रहा है)", hinglish: "Voice input (jald aa raha hai)",
    kn: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ (ಶೀಘ್ರದಲ್ಲಿ ಬರುತ್ತಿದೆ)", ta: "குரல் உள்ளீடு (விரைவில் வரும்)", te: "వాయిస్ ఇన్‌పుట్ (త్వరలో వస్తుంది)",
    mr: "व्हॉइस इनपुट (लवकरच येत आहे)", bn: "ভয়েস ইনপুট (শীঘ্রই আসছে)", gu: "વોઈસ ઈનપુટ (ટૂંક સમયમાં આવી રહ્યું છે)", ml: "വോയ്‌സ് ഇൻപുട്ട് (ഉടൻ വരുന്നു)",
    pa: "ਆਵਾਜ਼ ਇਨਪੁੱਟ (ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ)", ur: "صوتی ان پٹ (جلد آ رہا ہے)",
  },
  newBadgeLabel: {
    en: "New", hi: "नया", hinglish: "New",
    kn: "ಹೊಸದು", ta: "புதியது", te: "కొత్తది",
    mr: "नवीन", bn: "নতুন", gu: "નવું", ml: "പുതിയത്",
    pa: "ਨਵਾਂ", ur: "نیا",
  },
};

export function t(key: keyof UiStrings, language: SupportedLanguage): string {
  return UI_STRINGS[key][language] ?? UI_STRINGS[key].en;
}
