import React, { useEffect } from 'react';
import { Languages } from 'lucide-react';

export default function GoogleTranslator() {
  useEffect(() => {
    // Define the initialization callback on window
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'ar',
          includedLanguages: 'ar,en',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // Load Google Translate script if not already present
    const SCRIPT_ID = 'google-translate-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Re-initialize if script is already present
      if ((window as any).google && (window as any).google.translate) {
        (window as any).googleTranslateElementInit();
      }
    }
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1.5 shadow-sm transition-all text-slate-700">
      <Languages className="w-4 h-4 text-[#6366F1] flex-shrink-0 animate-pulse" />
      <div id="google_translate_element" className="google-translate-wrapper text-xs font-bold leading-none"></div>
    </div>
  );
}
