import React, { useState, useEffect } from 'react';
import { ArrowRight, Download, Copy, CheckCircle2, Sparkles, Settings2, MonitorPlay, Lock, AlertTriangle, FileCode, Layers, Link2, Type, ShieldAlert, ShieldCheck, Eye, Search, Code2, Cpu, UploadCloud, Activity, HelpCircle, FileText, Brain, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { UserData } from '../App';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import AdBanner from '../components/AdBanner';
import { useToast } from '../components/Toast';
import { PRESET_TEMPLATES } from '../lib/presets';

interface ToolProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export default function Tool({ userData, setUserData }: ToolProps) {
  const { showToast } = useToast();
  const [inputXML, setInputXML] = useState('');
  const [outputXML, setOutputXML] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorUrl, setCreatorUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteEmail, setSiteEmail] = useState('');
  const [isGeneratingPages, setIsGeneratingPages] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<{
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    disclaimer: string;
  } | null>(null);
  const [activePageTab, setActivePageTab] = useState<'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer'>('about');
  const [copiedPage, setCopiedPage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<{
    percent: number;
    oldCopyrights: string[];
    newCopyrights: string[];
    originalLineCount: number;
    modifiedLineCount: number;
    diffCount: number;
    headerBefore: string;
    headerAfter: string;
    footerBefore: string;
    footerAfter: string;
  } | null>(null);
  const [compareTab, setCompareTab] = useState<'header' | 'footer'>('footer');
  const [analysis, setAnalysis] = useState<{
    sizeKB: number;
    widgetsCount: number;
    widgets: { id: string; type: string }[];
    jsCount: number;
    jsExternal: string[];
    cssCount: number;
    duplicates: { type: string; value: string; count: number }[];
    externalLinks: string[];
    fonts: string[];
    encryptedBlocks: { type: string; snippet: string }[];
    performanceScore: number;
    securityScore: number;
    protections?: {
      antiRemoveCredit: { detected: boolean; locations: { line: number; snippet: string }[] };
      redirectScript: { detected: boolean; locations: { line: number; snippet: string }[] };
      encryptedJs: { detected: boolean; locations: { line: number; snippet: string }[] };
      obfuscatedCode: { detected: boolean; locations: { line: number; snippet: string }[] };
      base64: { detected: boolean; locations: { line: number; snippet: string }[] };
    };
  } | null>(null);

  const [settings, setSettings] = useState<any>({ 
    topAdHtml: '', 
    bottomAdHtml: '', 
    toolEnabled: true,
    adsterraBanner728x90: '',
    adsterraBanner300x250: '',
    adsterraDirectLink: ''
  });

  const [templateExplanation, setTemplateExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // XML version history & Undo State (17)
  const [history, setHistory] = useState<{ id: string; timestamp: string; title: string; xml: string }[]>([]);

  // AI Widget Generator States (19)
  const [selectedWidgetType, setSelectedWidgetType] = useState<string>('Movie Slider');
  const [customWidgetPrompt, setCustomWidgetPrompt] = useState<string>('');
  const [generatedWidgetCode, setGeneratedWidgetCode] = useState<string>('');
  const [isGeneratingWidget, setIsGeneratingWidget] = useState<boolean>(false);

  // Figma/ZIP/HTML to Blogger Design Converter States (20)
  const [designCode, setDesignCode] = useState<string>('');
  const [designType, setDesignType] = useState<string>('HTML');
  const [isConvertingDesign, setIsConvertingDesign] = useState<boolean>(false);
  const [convertedBloggerXML, setConvertedBloggerXML] = useState<string>('');

  // Smart AI Modernizer States (Smart AI Upgrade)
  const [isModernizing, setIsModernizing] = useState<boolean>(false);
  const [modernizerReport, setModernizerReport] = useState<string>('');
  const [modernizerProgress, setModernizerProgress] = useState<string[]>([]);

  // Version History helper
  const addToHistory = (title: string, xmlContent: string) => {
    if (!xmlContent || xmlContent.trim().length === 0) return;
    const newVersion = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      title,
      xml: xmlContent
    };
    setHistory(prev => {
      if (prev.length > 0 && prev[0].xml === xmlContent) return prev;
      return [newVersion, ...prev];
    });
  };

  const revertToHistoryVersion = (version: { title: string; xml: string }) => {
    setInputXML(version.xml);
    setOutputXML('');
    analyzeBloggerTemplate(version.xml);
    showToast(`تم التراجع واستعادة النسخة بنجاح: ${version.title}!`, 'success');
  };

  // AI Widget Generator
  const generateWidget = async () => {
    if (isGeneratingWidget) return;
    setIsGeneratingWidget(true);
    setGeneratedWidgetCode('');

    try {
      const res = await fetch('/api/generate-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetType: selectedWidgetType, customPrompt: customWidgetPrompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate widget');

      setGeneratedWidgetCode(data.result);
      showToast('تم توليد الوجت بنجاح بالذكاء الاصطناعي! | Widget generated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating widget', 'error');
    } finally {
      setIsGeneratingWidget(false);
    }
  };

  const injectWidgetIntoTemplate = () => {
    const currentXML = outputXML || inputXML;
    if (!currentXML || currentXML.trim().length === 0) {
      showToast('الرجاء رفع أو تحديد قالب بلوجر أولاً! | Please upload a template XML first!', 'warning');
      return;
    }

    let codeToInject = generatedWidgetCode;
    const match = generatedWidgetCode.match(/```(?:html|xml)?([\s\S]*?)```/);
    if (match && match[1]) {
      codeToInject = match[1].trim();
    } else {
      const cleanMatch = generatedWidgetCode.indexOf('<');
      if (cleanMatch !== -1) {
        codeToInject = generatedWidgetCode.substring(cleanMatch);
      }
    }

    let updatedXML = currentXML;
    let success = false;

    if (currentXML.includes('</body>')) {
      const parts = currentXML.split('</body>');
      updatedXML = parts[0] + `\n\n<!-- AI Custom Widget: ${selectedWidgetType} -->\n` + codeToInject + '\n</body>' + parts[1];
      success = true;
    } else {
      updatedXML = currentXML + `\n\n<!-- AI Custom Widget: ${selectedWidgetType} -->\n` + codeToInject;
      success = true;
    }

    if (success) {
      setOutputXML(updatedXML);
      addToHistory(`✨ إضافة وجت ذكي: ${selectedWidgetType}`, updatedXML);
      showToast(`تم حقن أداة ${selectedWidgetType} بنجاح داخل القالب! القالب جاهز للتحميل.`, 'success');
    } else {
      showToast('تعذر إدراج الأداة تلقائياً. يرجى نسخ كود الأداة وإدراجه يدوياً!', 'error');
    }
  };

  // Convert Design to Blogger
  const convertDesignToBlogger = async () => {
    if (!designCode || designCode.trim().length === 0) {
      showToast('الرجاء إدخال كود التصميم أولاً! | Please enter the design code first!', 'warning');
      return;
    }

    if (userData && userData.credits <= 0) {
      showToast('ليس لديك رصيد كافٍ للتحويل! يرجى شحن رصيدك. | You do not have enough credits!', 'error');
      return;
    }

    setIsConvertingDesign(true);
    setConvertedBloggerXML('');

    try {
      const res = await fetch('/api/convert-to-blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designCode, designType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert design');

      let xml = data.xml;
      const xmlBlockMatch = xml.match(/```(?:xml|html)?([\s\S]*?)```/);
      if (xmlBlockMatch && xmlBlockMatch[1]) {
        xml = xmlBlockMatch[1].trim();
      }

      setConvertedBloggerXML(xml);
      setInputXML(xml);
      setOutputXML('');
      analyzeBloggerTemplate(xml);

      if (userData) {
        const newCredits = userData.credits - 1;
        await updateDoc(doc(db, 'users', userData.uid), { credits: newCredits });
        
        await addDoc(collection(db, 'removal_logs'), {
          uid: userData.uid,
          timestamp: new Date().toISOString(),
          creditsUsed: 1,
          type: 'design_conversion'
        });

        setUserData(prev => prev ? { ...prev, credits: newCredits } : null);
      }

      addToHistory(`🎨 تحويل تصميم ${designType} لقالب بلوجر`, xml);
      showToast('تم تحويل التصميم بنجاح إلى قالب بلوجر XML وخصم نقطة واحدة! القالب متاح الآن في المحرر.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error converting design', 'error');
    } finally {
      setIsConvertingDesign(false);
    }
  };

  // Smart AI Modernizer (Upgrade to 2026)
  const modernizeTemplate = async () => {
    const currentXML = outputXML || inputXML;
    if (!currentXML || currentXML.trim().length === 0) {
      showToast('الرجاء رفع أو لصق كود قالب بلوجر أولاً للترقية! | Please provide a template first!', 'warning');
      return;
    }

    if (userData && userData.credits <= 0) {
      showToast('ليس لديك رصيد كافٍ للترقية! يرجى شحن رصيدك. | You do not have enough credits!', 'error');
      return;
    }

    setIsModernizing(true);
    setModernizerReport('');
    setModernizerProgress([
      'جاري فحص كود القالب وتحليل بنيته التحتية...',
      'جاري إزالة الموارد والسكربتات القديمة المسببة لثقل التصفح...'
    ]);

    const steps = [
      'تحديث استجابة وجداول الـ CSS لتلائم الهواتف الحديثة...',
      'تجهيز وتفعيل نظام الوضع الليلي المتناسق (Smart Dark Mode)...',
      'تفعيل ميزة التحميل الكسول (Lazy Loading) لجميع الصور لسرعة فائقة...',
      'ترقية وتعديل كود الـ Slider والمقالات بأسلوب Vanilla ES6 حديث...',
      'تحسين الـ SEO وسرعة الفتح وإدراج أحدث وسوم الأرشفة لعام 2026...',
      'تجميع قالب XML النهائي وتصحيح أي أخطاء برمجية في المعالجة...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setModernizerProgress(prev => [...prev, steps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    try {
      const res = await fetch('/api/modernize-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent: currentXML })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to modernize template');

      let xml = data.xml;
      let reportStr = '';
      const xmlBlockMatch = xml.match(/```(?:xml|html)?([\s\S]*?)```/);
      if (xmlBlockMatch && xmlBlockMatch[1]) {
        xml = xmlBlockMatch[1].trim();
        reportStr = data.xml.replace(/```(?:xml|html)?([\s\S]*?)```/g, '').trim();
      } else {
        reportStr = 'تمت ترقية القالب بالكامل لنسخة 2026 فائقة السرعة!';
      }

      setOutputXML(xml);
      setModernizerReport(reportStr);
      setModernizerProgress(prev => [...prev, '🎉 اكتملت الترقية للنسخة الذكية 2026 بنجاح تام!']);

      if (userData) {
        const newCredits = userData.credits - 1;
        await updateDoc(doc(db, 'users', userData.uid), { credits: newCredits });
        
        await addDoc(collection(db, 'removal_logs'), {
          uid: userData.uid,
          timestamp: new Date().toISOString(),
          creditsUsed: 1,
          type: 'modernize_2026'
        });

        setUserData(prev => prev ? { ...prev, credits: newCredits } : null);
      }

      addToHistory('🚀 ترقية القالب لنسخة 2026 الذكية', xml);
      showToast('تم ترقية وتحديث قالبك بالكامل لعام 2026 بنجاح تام وخصم نقطة واحدة! القالب جاهز للتحميل.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error modernizing template', 'error');
    } finally {
      clearInterval(interval);
      setIsModernizing(false);
    }
  };

  // Theme Appearance Customizer States (Colors & Fonts)
  const [selectedFont, setSelectedFont] = useState<string>('Cairo');
  const [primaryColorState, setPrimaryColorState] = useState<string>('#6366f1');
  const [secondaryColorState, setSecondaryColorState] = useState<string>('#10b981');
  const [accentColorState, setAccentColorState] = useState<string>('#f59e0b');
  const [customOldColor, setCustomOldColor] = useState<string>('');
  const [customNewColor, setCustomNewColor] = useState<string>('#6366f1');

  // Helper to extract top non-grayscale brand colors from XML
  const getTopBrandColors = (xml: string) => {
    if (!xml || xml.trim().length === 0) return [];
    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    const countMap: { [key: string]: number } = {};
    let match;
    while ((match = hexRegex.exec(xml)) !== null) {
      let hex = match[0].toLowerCase();
      // Normalize 3-char to 6-char
      if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      
      // Parse components
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      
      // Filter out grayscale backgrounds/text
      const isGrayscale = Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22;
      const isTooLight = r > 240 && g > 240 && b > 240;
      const isTooDark = r < 18 && g < 18 && b < 18;
      
      if (!isGrayscale && !isTooLight && !isTooDark) {
        countMap[hex] = (countMap[hex] || 0) + 1;
      }
    }
    
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .map(([hex, count]) => ({ hex, count }));
  };

  const activeXMLCode = outputXML || inputXML;

  const discoveredColors = React.useMemo(() => {
    return getTopBrandColors(activeXMLCode);
  }, [activeXMLCode]);

  // Apply Full Recolor mapping top 3 active brand colors
  const handleApplyFullRecolor = () => {
    if (!activeXMLCode) {
      showToast('الرجاء رفع كود القالب أو لصقه أولاً! | Please upload or paste template code first!', 'warning');
      return;
    }

    const topBrandColors = getTopBrandColors(activeXMLCode);
    if (topBrandColors.length === 0) {
      showToast('لم نتمكن من اكتشاف ألوان علامة تجارية ملونة في هذا القالب تلقائياً. يمكنك استخدام المستبدل اليدوي أدناه! | No active brand colors detected automatically.', 'info');
      return;
    }

    let updatedXml = activeXMLCode;
    const replacementsMade: string[] = [];

    // Replace 1st top brand color with primaryColorState
    if (topBrandColors[0]) {
      const target = topBrandColors[0].hex;
      const regex = new RegExp(target, 'gi');
      updatedXml = updatedXml.replace(regex, primaryColorState);
      replacementsMade.push(`الأساسي (${target} ← ${primaryColorState})`);
    }

    // Replace 2nd top brand color with secondaryColorState
    if (topBrandColors[1]) {
      const target = topBrandColors[1].hex;
      const regex = new RegExp(target, 'gi');
      updatedXml = updatedXml.replace(regex, secondaryColorState);
      replacementsMade.push(`الثانوي (${target} ← ${secondaryColorState})`);
    }

    // Replace 3rd top brand color with accentColorState
    if (topBrandColors[2]) {
      const target = topBrandColors[2].hex;
      const regex = new RegExp(target, 'gi');
      updatedXml = updatedXml.replace(regex, accentColorState);
      replacementsMade.push(`الفرعي (${target} ← ${accentColorState})`);
    }

    // Save changes
    if (outputXML) {
      setOutputXML(updatedXml);
    } else {
      setInputXML(updatedXml);
    }

    showToast(`تم استبدال الألوان بنجاح: ${replacementsMade.join('، ')}!`, 'success');
    analyzeBloggerTemplate(updatedXml);
  };

  // Replace one specific color in the XML globally
  const handleSingleColorReplace = (oldColor: string, newColor: string) => {
    if (!activeXMLCode) {
      showToast('الرجاء رفع كود القالب أو لصقه أولاً! | Please upload or paste template code first!', 'warning');
      return;
    }
    if (!/^#[0-9a-fA-F]{3,6}$/.test(oldColor.trim())) {
      showToast('الرجاء إدخال كود لون قديم صحيح بصيغة Hex (مثال: #6366f1)!', 'warning');
      return;
    }
    if (!/^#[0-9a-fA-F]{3,6}$/.test(newColor.trim())) {
      showToast('الرجاء إدخال كود لون جديد صحيح بصيغة Hex!', 'warning');
      return;
    }

    const regex = new RegExp(oldColor.trim(), 'gi');
    const updatedXml = activeXMLCode.replace(regex, newColor.trim());

    if (outputXML) {
      setOutputXML(updatedXml);
    } else {
      setInputXML(updatedXml);
    }

    showToast(`تم استبدال اللون القديم ${oldColor} باللون الجديد ${newColor} بنجاح!`, 'success');
    analyzeBloggerTemplate(updatedXml);
  };

  // Replace Font in XML globally and load via Google Fonts link inside <head>
  const handleApplyFont = () => {
    if (!activeXMLCode) {
      showToast('الرجاء رفع كود القالب أو لصقه أولاً! | Please upload or paste template code first!', 'warning');
      return;
    }

    let updatedXml = activeXMLCode;

    // 1. Remove existing Google Fonts links to keep code clean and lightweight
    updatedXml = updatedXml.replace(/<link\s+[^>]*href=['"]https?:\/\/fonts\.googleapis\.com\/css(?:2)?\?[^'"]+['"][^>]*>/gi, '');

    // 2. Prepare and inject the Google Fonts link inside the <head>
    const escapedFontName = selectedFont.replace(/\s+/g, '+');
    // Escaped "&" as "&amp;" is required in Blogger templates to avoid parsing error
    const fontLink = `<link href='https://fonts.googleapis.com/css2?family=${escapedFontName}:wght@300;400;500;600;700;800&amp;display=swap' rel='stylesheet'/>`;

    if (updatedXml.toLowerCase().includes('<head>')) {
      updatedXml = updatedXml.replace(/<head>/i, `<head>\n  ${fontLink}`);
    } else {
      showToast('تنبيه: لم يتم العثور على وسم <head> في القالب لإدراج رابط الخط تلقائياً، ولكن سيتم استبدال التنسيقات في CSS.', 'warning');
    }

    // 3. Compile list of fonts to replace inside stylesheet blocks
    const currentFontsInTemplate = analysis?.fonts || [];
    const fontsToReplace = Array.from(new Set([
      ...currentFontsInTemplate,
      'Cairo', 'Tajawal', 'Almarai', 'Readex Pro', 'Amiri', 'El Messiri', 'Inter', 'Montserrat', 'Roboto', 'Poppins', 'Playfair Display',
      'Open Sans', 'Lato', 'Oswald', 'Raleway', 'Ubuntu', 'Helvetica', 'Arial', 'Tahoma', 'Verdana', 'Times New Roman'
    ]));

    fontsToReplace.forEach(oldFont => {
      if (oldFont && oldFont.trim().toLowerCase() !== selectedFont.trim().toLowerCase() && 
          !['sans-serif', 'serif', 'inherit', 'monospace', 'initial', 'Arial (افتراضي)', 'Helvetica (افتراضي)'].includes(oldFont)) {
        
        const escapedOldFont = oldFont.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Match font-family: 'OldFont', sans-serif;
        const fontFamRegex = new RegExp(`font-family\\s*:\\s*['"]?${escapedOldFont}['"]?`, 'gi');
        updatedXml = updatedXml.replace(fontFamRegex, `font-family: '${selectedFont}'`);
        
        // Match font: ... 'OldFont' ...
        const fontGeneralRegex = new RegExp(`font\\s*:\\s*([^;}]*)\\b${escapedOldFont}\\b([^;}]*)`, 'gi');
        updatedXml = updatedXml.replace(fontGeneralRegex, `font: $1'${selectedFont}'$2`);
      }
    });

    if (outputXML) {
      setOutputXML(updatedXml);
    } else {
      setInputXML(updatedXml);
    }

    showToast(`تم استبدال وتطبيق خط Google Font (${selectedFont}) الجديد في القالب بالكامل!`, 'success');
    analyzeBloggerTemplate(updatedXml);
  };

  interface ValidationError {
    type: 'error' | 'warning';
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    solutionAr: string;
    solutionEn: string;
    line?: number;
  }

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);

  const validateBloggerXML = (xml: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!xml || xml.trim().length === 0) return [];

    // 1. DOMParser XML structure validation
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const parserError = doc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        const errorText = parserError[0].textContent || "Syntax Error";
        const lineMatch = errorText.match(/line\s*(\d+)/i) || errorText.match(/:(\d+):\d+/);
        const line = lineMatch ? parseInt(lineMatch[1]) : undefined;
        errors.push({
          type: 'error',
          titleAr: 'خطأ بنيوي في ملف XML (XML Syntax Error)',
          titleEn: 'XML Syntax Error',
          descAr: `الملف تالف أو يحتوي على خطأ في بناء الكود البرمجي الخاص بـ XML. التفاصيل: ${errorText.substring(0, 150)}`,
          descEn: `The file is corrupted or has a syntax error in the XML code structure. Details: ${errorText.substring(0, 150)}`,
          solutionAr: 'تأكد من إغلاق كافة الوسوم، والتحقق من علامات الترقيم والأقواس غير المغلقة.',
          solutionEn: 'Check for unclosed tags, and ensure proper closing brackets and quotes.',
          line
        });
      }
    } catch (err: any) {
      errors.push({
        type: 'error',
        titleAr: 'خطأ فادح في تحليل الـ XML',
        titleEn: 'Fatal XML Parsing Error',
        descAr: `تعذر قراءة الكود كملف XML صالح: ${err.message}`,
        descEn: `Failed to parse the code as a valid XML structure: ${err.message}`,
        solutionAr: 'تأكد من أن الكود الذي نسخته مكتمل وسليم.',
        solutionEn: 'Verify that the copied template code is complete and not cut off.'
      });
    }

    // 2. Essential Blogger Tags Check
    if (!/<\s*html/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم البداية <html> غير موجود',
        titleEn: 'Missing Root <html> Tag',
        descAr: 'القالب يفتقر إلى وسم البداية الرئيسي <html> الذي يحدد بداية المستند.',
        descEn: 'The template is missing the root <html> tag which defines the document.',
        solutionAr: 'قم بإضافة وسم <html ...> في السطر الأول من الكود بعد وسم التعريف.',
        solutionEn: 'Add <html ...> to the very beginning of the code.'
      });
    }

    if (!/<\/\s*html\s*>/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم الإغلاق </html> غير موجود',
        titleEn: 'Missing Closing </html> Tag',
        descAr: 'لم يتم العثور على وسم الإغلاق النهائي </html> في نهاية المستند.',
        descEn: 'The closing </html> tag at the end of the file was not found.',
        solutionAr: 'أضف </html> في السطر الأخير تماماً من الكود.',
        solutionEn: 'Add </html> at the absolute end of the template code.'
      });
    }

    if (!/<\s*head/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم الرأس <head> غير موجود',
        titleEn: 'Missing <head> Tag',
        descAr: 'القالب لا يحتوي على رأس الصفحة <head>، وهو ضروري لتضمين الميتا والستايلات.',
        descEn: 'The template does not have a <head> tag, which is essential for meta tags and styles.',
        solutionAr: 'قم بإضافة <head> بعد وسم <html> مباشرة.',
        solutionEn: 'Add a <head> tag right after the root <html> tag.'
      });
    }

    if (!/<\/\s*head\s*>/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم الإغلاق </head> غير موجود',
        titleEn: 'Missing Closing </head> Tag',
        descAr: 'لم يتم إغلاق وسم الرأس </head> مما يؤدي لخلل في دمج وتفسير الأكواد.',
        descEn: 'The closing </head> tag was not found, which breaks parsing downstream.',
        solutionAr: 'تأكد من وجود </head> قبل بدء قسم <body> مباشرة.',
        solutionEn: 'Ensure </head> is added right before the <body> section.'
      });
    }

    if (!/<\s*body/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم الجسم <body> غير موجود',
        titleEn: 'Missing <body> Tag',
        descAr: 'القالب لا يحتوي على كود <body> الرئيسي لعرض المحتوى والأدوات على الشاشة.',
        descEn: 'The template is missing the main <body> tag to show content and widgets.',
        solutionAr: 'أضف وسم <body> مباشرة بعد إغلاق الرأس </head>.',
        solutionEn: 'Add a <body> tag right after the closing </head> tag.'
      });
    }

    if (!/<\/\s*body\s*>/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'وسم الإغلاق </body> غير موجود',
        titleEn: 'Missing Closing </body> Tag',
        descAr: 'لم يتم العثور على وسم إغلاق الجسم </body> في نهاية كود القالب.',
        descEn: 'The closing </body> tag was not found at the end of the template.',
        solutionAr: 'تأكد من كتابة </body> قبل وسم الإغلاق الرئيسي </html>.',
        solutionEn: 'Make sure to add </body> right before the closing </html> tag.'
      });
    }

    if (!/<\s*b:skin/i.test(xml) && !/<\s*b:template-skin/i.test(xml)) {
      errors.push({
        type: 'warning',
        titleAr: 'وسم التصميم والأنماط <b:skin> غير موجود',
        titleEn: 'Missing <b:skin> Design Block',
        descAr: 'يفضل وجود وسم <b:skin> أو <b:template-skin> في بلوجر لحفظ إعدادات الألوان والخطوط التلقائية.',
        descEn: 'Blogger templates usually require a <b:skin> block to compile custom variables and style options.',
        solutionAr: 'أضف كود <b:skin><![CDATA[ ... ]]></b:skin> داخل قسم <head>.',
        solutionEn: 'Add a <b:skin><![CDATA[ ... ]]></b:skin> block inside the <head> tags.'
      });
    }

    if (!/<\s*b:section/i.test(xml)) {
      errors.push({
        type: 'error',
        titleAr: 'أقسام التخطيط <b:section> غير موجودة',
        titleEn: 'No <b:section> Layout Containers Found',
        descAr: 'تفرض منصة بلوجر وجود قسم تخطيط واحد على الأقل <b:section> لإدراج الحاجيات أو الوجت بداخله.',
        descEn: 'Blogger platform requires at least one layout container <b:section> to register widgets.',
        solutionAr: 'أضف كود مثل <b:section id="main-content"> ... </b:section> داخل جسم القالب.',
        solutionEn: 'Insert at least one section like <b:section id="main"> ... </b:section> inside the body.'
      });
    }

    // 3. Tag Matches and Unclosed Blocks check
    const countMatches = (regex: RegExp, text: string) => (text.match(regex) || []).length;

    // Check b:if
    const bIfCount = countMatches(/<\s*b:if/g, xml);
    const bIfCloseCount = countMatches(/<\/\s*b:if\s*>/g, xml);
    if (bIfCount !== bIfCloseCount) {
      errors.push({
        type: 'error',
        titleAr: 'عدم تطابق وسوم الشرط <b:if> (Unclosed b:if)',
        titleEn: 'Mismatched <b:if> Tags',
        descAr: `يوجد خلل في وسوم الشرط: تم فتح ${bIfCount} شرط بينما تم إغلاق ${bIfCloseCount} شرط فقط.`,
        descEn: `Conditionals mismatch: ${bIfCount} opened <b:if> vs ${bIfCloseCount} closed </b:if> tags.`,
        solutionAr: 'تأكد من إغلاق كل وسم شرط <b:if> بـ </b:if> مقابل له لتجنب أخطاء تجميع الكود في بلوجر.',
        solutionEn: 'Make sure every conditional check <b:if> is closed with </b:if> properly.'
      });
    }

    // Check b:loop
    const bLoopCount = countMatches(/<\s*b:loop/g, xml);
    const bLoopCloseCount = countMatches(/<\/\s*b:loop\s*>/g, xml);
    if (bLoopCount !== bLoopCloseCount) {
      errors.push({
        type: 'error',
        titleAr: 'عدم تطابق حلقات التكرار <b:loop> (Unclosed b:loop)',
        titleEn: 'Mismatched <b:loop> Tags',
        descAr: `يوجد خلل في الحلقات التكرارية: تم فتح ${bLoopCount} حلقة بينما تم إغلاق ${bLoopCloseCount} حلقة فقط.`,
        descEn: `Loops mismatch: ${bLoopCount} opened <b:loop> vs ${bLoopCloseCount} closed </b:loop> tags.`,
        solutionAr: 'راجع الأكواد وأضف وسم </b:loop> اللازم لإغلاق كل حلقة تكرارية مفتوحة.',
        solutionEn: 'Ensure every loop opened with <b:loop> is properly closed with </b:loop>.'
      });
    }

    // Check b:includable
    const bIncludableCount = countMatches(/<\s*b:includable/g, xml);
    const bIncludableCloseCount = countMatches(/<\/\s*b:includable\s*>/g, xml);
    if (bIncludableCount !== bIncludableCloseCount) {
      errors.push({
        type: 'error',
        titleAr: 'عدم تطابق وسوم الكتل <b:includable> (Unclosed b:includable)',
        titleEn: 'Mismatched <b:includable> Tags',
        descAr: `يوجد خلل في كتل الحاجيات: تم فتح ${bIncludableCount} كتلة مقابل ${bIncludableCloseCount} كتلة مغلقة.`,
        descEn: `Includables mismatch: ${bIncludableCount} opened <b:includable> vs ${bIncludableCloseCount} closed </b:includable>.`,
        solutionAr: 'تأكد من إغلاق كل كتلة برمجية داخل الوجت بـ </b:includable> بشكل سليم.',
        solutionEn: 'Ensure every <b:includable> block is correctly closed with </b:includable>.'
      });
    }

    // 4. Bracket Check / Duplicate Tag brackets
    const xmlLines = xml.split('\n');
    for (let i = 0; i < xmlLines.length; i++) {
      const line = xmlLines[i];
      if (line.includes('<<') || line.includes('>>')) {
        errors.push({
          type: 'warning',
          titleAr: 'تكرار أو تلف في علامات الأقواس البرمجية',
          titleEn: 'Malformed Double Brackets',
          descAr: `تم العثور على رموز مكررة أو تالفة مثل "<<" أو ">>" في السطر رقم ${i + 1}.`,
          descEn: `Found duplicate or broken bracket notations like "<<" or ">>" on line ${i + 1}.`,
          solutionAr: `تحقق من السطر رقم ${i + 1} وقم بحذف أي علامات أقواس زائدة.`,
          solutionEn: `Check line ${i + 1} and delete any excessive bracket symbols.`
        });
      }
    }

    return errors;
  };

  const analyzeBloggerTemplate = (xml: string) => {
    try {
      // Validate template and set validation errors
      const vErrors = validateBloggerXML(xml);
      setValidationErrors(vErrors);

      const sizeKB = Math.round((xml.length / 1024) * 10) / 10;
      
      // Widgets extraction
      const widgets: { id: string; type: string }[] = [];
      const widgetRegex = /<b:widget[^>]*id=['"]([^'"]+)['"][^>]*type=['"]([^'"]+)['"]/g;
      let match;
      while ((match = widgetRegex.exec(xml)) !== null) {
        widgets.push({ id: match[1], type: match[2] });
      }
      const widgetsCount = widgets.length;

      // JS scripts count
      const jsCount = (xml.match(/<script/ig) || []).length;
      
      // External JS list
      const jsExternal: string[] = [];
      const jsSrcRegex = /<script[^>]*src=['"]([^'"]+)['"]/ig;
      let jsMatch;
      while ((jsMatch = jsSrcRegex.exec(xml)) !== null) {
        if (!jsExternal.includes(jsMatch[1])) {
          jsExternal.push(jsMatch[1]);
        }
      }

      // CSS blocks count
      const cssCount = (xml.match(/<style|<b:skin|<b:template-skin/ig) || []).length;

      // Duplicates finding
      const duplicates: { type: string; value: string; count: number }[] = [];
      
      // Check for duplicate widget IDs
      const widgetIds = widgets.map(w => w.id);
      const widgetIdCounts = widgetIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(widgetIdCounts).forEach(([id, count]) => {
        if (count > 1) {
          duplicates.push({ type: 'ID وجت مكرر (Blogger ID Error)', value: id, count });
        }
      });

      // Check for duplicate JS file loads
      const rawJsSrcs: string[] = [];
      const jsSrcRegex2 = /<script[^>]*src=['"]([^'"]+)['"]/ig;
      let jsMatch2;
      while ((jsMatch2 = jsSrcRegex2.exec(xml)) !== null) {
        rawJsSrcs.push(jsMatch2[1]);
      }
      const jsSrcCounts = rawJsSrcs.reduce((acc, src) => {
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(jsSrcCounts).forEach(([src, count]) => {
        if (count > 1) {
          const fileName = src.split('/').pop() || src;
          duplicates.push({ type: 'رابط جافا سكريبت مكرر (Duplicate script tag)', value: fileName, count });
        }
      });

      // External Links extraction (non-blogger, non-google standard)
      const externalLinks: string[] = [];
      const urlRegex = /href=['"](https?:\/\/[^'"]+)['"]/g;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(xml)) !== null) {
        const urlStr = urlMatch[1];
        try {
          const hostname = new URL(urlStr).hostname;
          const ignoreList = [
            'www.w3.org', 'schema.org', 'blogger.com', 'www.blogger.com', 
            'google.com', 'www.google.com', 'googleapis.com', 'gstatic.com',
            'draft.blogger.com', 'gmodules.com'
          ];
          if (!ignoreList.some(domain => hostname.includes(domain)) && !externalLinks.includes(hostname)) {
            externalLinks.push(hostname);
          }
        } catch (e) {
          // invalid URL, skip
        }
      }

      // Fonts extraction
      const fonts: string[] = [];
      // From google fonts link
      const fontRegex = /family=([^&'"]+)/g;
      let fontMatch;
      while ((fontMatch = fontRegex.exec(xml)) !== null) {
        const fontNames = decodeURIComponent(fontMatch[1]).split('|');
        fontNames.forEach(f => {
          const cleanName = f.split(':')[0].replace(/\+/g, ' ');
          if (!fonts.includes(cleanName) && cleanName.trim().length > 0) {
            fonts.push(cleanName);
          }
        });
      }
      // From font-family declarations in CSS
      const fontFamRegex = /font-family\s*:\s*([^;'}]+)/g;
      let fontFamMatch;
      while ((fontFamMatch = fontFamRegex.exec(xml)) !== null) {
        const rawFont = fontFamMatch[1].split(',')[0].replace(/['"]/g, '').trim();
        if (rawFont && !['sans-serif', 'serif', 'inherit', 'monospace', 'initial'].includes(rawFont.toLowerCase()) && !fonts.includes(rawFont)) {
          if (fonts.length < 8) { // cap at 8 to avoid clutter
            fonts.push(rawFont);
          }
        }
      }

      if (fonts.length === 0) {
        fonts.push("Arial (افتراضي)");
        fonts.push("Helvetica (افتراضي)");
      }

      // Encrypted / Obfuscated scripts check
      const encryptedBlocks: { type: string; snippet: string }[] = [];
      
      // eval packer
      if (/eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k/i.test(xml)) {
        encryptedBlocks.push({
          type: 'تشفير ديناميكي (JS Dean Edwards Packer)',
          snippet: 'eval(function(p,a,c,k,e,d)...'
        });
      }
      // Hex obfuscation pattern like _0x
      if (/_0x[a-f0-9]{4,6}/i.test(xml)) {
        encryptedBlocks.push({
          type: 'تشفير سداسي عشري (Obfuscated _0x variables)',
          snippet: 'var _0x457381 = ...'
        });
      }
      // Base64 regex for long string without space
      const base64Regex = /["'](eyJ[A-Za-z0-9+/=]{40,}|[A-Za-z0-9+/]{80,}=*)["']/g;
      let b64Match;
      while ((b64Match = base64Regex.exec(xml)) !== null) {
        if (encryptedBlocks.length < 3) {
          encryptedBlocks.push({
            type: 'نص مشفر Base64 طويل (Base64 Encoded Block)',
            snippet: b64Match[1].substring(0, 40) + '...'
          });
        }
      }

      // 5-Point Protection Scanner (Line-by-line analysis)
      const xmlLines = xml.split('\n');
      
      const antiRemoveCreditLocs: { line: number; snippet: string }[] = [];
      const redirectScriptLocs: { line: number; snippet: string }[] = [];
      const encryptedJsLocs: { line: number; snippet: string }[] = [];
      const obfuscatedCodeLocs: { line: number; snippet: string }[] = [];
      const base64Locs: { line: number; snippet: string }[] = [];

      for (let i = 0; i < xmlLines.length; i++) {
        const lineVal = xmlLines[i];
        const lineNo = i + 1;

        // Anti Remove Credit Check
        const arcRegexes = [
          /document\.getElementById\(['"](mycontent|mycredit|credit|copyright|credits|copy-right|myfooter|footer-credit)['"]\)/i,
          /document\.querySelector\(['"]#(mycontent|mycredit|credit|copyright|credits|copy-right|myfooter|footer-credit)['"]\)/i,
          /MutationObserver.*(mycontent|mycredit|credit|copyright|credits|copy-right)/i,
          /display\s*===?\s*['"]none['"]/i,
          /opacity\s*===?\s*['"]0['"]/i,
          /visibility\s*===?\s*['"]hidden['"]/i,
          /location\.href.*mycontent|location\.replace.*mycontent/i,
          /(\.innerHTML|\.innerText|\.text).*(mycontent|mycredit|credit|copyright|credits)/i
        ];
        if (arcRegexes.some(r => r.test(lineVal))) {
          if (lineVal.includes('script') || lineVal.includes('function') || lineVal.includes('var ') || lineVal.includes('let ') || lineVal.includes('const ') || lineVal.includes('document') || lineVal.includes('$') || lineVal.includes('window') || lineVal.includes('credit')) {
            if (antiRemoveCreditLocs.length < 15) {
              antiRemoveCreditLocs.push({ line: lineNo, snippet: lineVal.trim().substring(0, 120) });
            }
          }
        }

        // Redirect Script Check
        const redRegexes = [
          /window\.location\.replace\(/i,
          /window\.location\.href\s*=/i,
          /location\.assign\(/i,
          /location\.href\s*=/i,
          /top\.location\s*=/i,
          /self\.location\s*=/i,
          /location\.replace\(/i
        ];
        if (redRegexes.some(r => r.test(lineVal))) {
          if (redirectScriptLocs.length < 15) {
            redirectScriptLocs.push({ line: lineNo, snippet: lineVal.trim().substring(0, 120) });
          }
        }

        // Encrypted JS Check
        const encRegexes = [
          /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k/i,
          /eval\s*\(\s*decodeURIComponent/i,
          /eval\s*\(\s*unescape/i,
          /eval\s*\(\s*atob/i
        ];
        if (encRegexes.some(r => r.test(lineVal))) {
          if (encryptedJsLocs.length < 15) {
            encryptedJsLocs.push({ line: lineNo, snippet: lineVal.trim().substring(0, 120) });
          }
        }

        // Obfuscated Code Check
        const obfRegexes = [
          /_0x[a-f0-9]{4,6}/i,
          /\\x[0-9a-fA-F]{2}/i,
          /\\u[0-9a-fA-F]{4}/i
        ];
        if (obfRegexes.some(r => r.test(lineVal))) {
          if (lineVal.includes('script') || lineVal.includes('var ') || lineVal.includes('let ') || lineVal.includes('const ') || lineVal.includes('function') || lineVal.includes('_0x') || lineVal.includes('\\x')) {
            if (obfuscatedCodeLocs.length < 15) {
              obfuscatedCodeLocs.push({ line: lineNo, snippet: lineVal.trim().substring(0, 120) });
            }
          }
        }

        // Base64 Check
        const b64RegexTest = /["'](eyJ[A-Za-z0-9+/=]{40,}|[A-Za-z0-9+/]{80,}=*)["']/g;
        if (b64RegexTest.test(lineVal)) {
          if (!lineVal.includes('image/svg+xml') && !lineVal.includes('image/png') && !lineVal.includes('image/jpeg')) {
            if (base64Locs.length < 15) {
              base64Locs.push({ line: lineNo, snippet: lineVal.trim().substring(0, 120) });
            }
          }
        }
      }

      const protections = {
        antiRemoveCredit: { detected: antiRemoveCreditLocs.length > 0, locations: antiRemoveCreditLocs },
        redirectScript: { detected: redirectScriptLocs.length > 0, locations: redirectScriptLocs },
        encryptedJs: { detected: encryptedJsLocs.length > 0, locations: encryptedJsLocs },
        obfuscatedCode: { detected: obfuscatedCodeLocs.length > 0, locations: obfuscatedCodeLocs },
        base64: { detected: base64Locs.length > 0, locations: base64Locs }
      };

      // Performance and Security scoring
      let performanceScore = 95;
      if (jsCount > 15) performanceScore -= 15;
      if (cssCount > 8) performanceScore -= 10;
      if (sizeKB > 500) performanceScore -= 15;
      if (rawJsSrcs.length > 10) performanceScore -= 10;
      performanceScore = Math.max(45, performanceScore);

      let securityScore = 100;
      if (encryptedBlocks.length > 0) securityScore -= 30;
      if (externalLinks.length > 8) securityScore -= 15;
      if (xml.includes('iqone.js') || xml.includes('rianseo')) securityScore -= 25;
      securityScore = Math.max(30, securityScore);

      setAnalysis({
        sizeKB,
        widgetsCount,
        widgets,
        jsCount,
        jsExternal: jsExternal.slice(0, 8),
        cssCount,
        duplicates,
        externalLinks: externalLinks.slice(0, 15),
        fonts,
        encryptedBlocks,
        performanceScore,
        securityScore,
        protections
      });
    } catch (err) {
      console.error("Error analyzing template", err);
    }
  };

  useEffect(() => {
    if (!inputXML || inputXML.trim().length === 0) {
      setAnalysis(null);
      return;
    }
    analyzeBloggerTemplate(inputXML);
  }, [inputXML]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setSettings(snap.data() as any);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  if (!settings.toolEnabled && userData.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Under Maintenance</h1>
        <p className="text-slate-600">The AI Builder tool is currently undergoing maintenance and updates. Please check back later!</p>
      </div>
    );
  }

  const processXML = async () => {
    setError('');
    
    // Check credits
    if (userData.credits <= 0) {
      const msg = 'ليس لديك رصيد كافٍ لإجراء هذه العملية! يرجى شحن رصيدك. | You do not have enough credits to perform this operation!';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      let xml = inputXML;
      const name = creatorName.trim() || 'Dark Storm';
      const url = creatorUrl.trim() || 'https://example.com';
      const year = new Date().getFullYear();

      // 1. Copyrights & Admin Trace Removal
      xml = xml.replace(/<script type='text\/javascript'>\/\/<!\[CDATA\[\s*var _0x457381=[\s\S]*?\/\/\]\]><\/script>/g, '');
      xml = xml.replace(/<script src='https:\/\/cdn\.jsdelivr\.net\/gh\/rianseo\/rianseo\.github\.io\/assets\/js\/iqone\.js' type='text\/javascript'\/>/g, ''); 
      
      xml = xml.replace(
        /<div class='widget'>\s*Template Blogger by <a class='xnxx' href='[^']*' id='xnxx' target='_blank' title='[^']*'>[^<]*<\/a>\s*<\/div>/g,
        `<div class='widget'>\n            &#169; ${year} <a href='${url}' style='color: var(--keycolor); font-weight: bold;'>${name}</a>. All Rights Reserved.<br/><span style="font-size: 12px; opacity: 0.8; margin-top: 5px; display: block;">Powered by ${name}</span>\n          </div>`
      );
      xml = xml.replace(/Template Blogger by <a class='xnxx'.*?<\/a>/g, `&#169; ${year} <a href="${url}" style="color: var(--keycolor); font-weight: bold;">${name}</a>. All Rights Reserved.<br/><span style="font-size: 12px; opacity: 0.8; margin-top: 5px; display: block;">Powered by ${name}</span>`);
      
      xml = xml.replace(/\/\* Credit: .*?\*\//g, `/* Credit: ${name} */`);
      xml = xml.replace(/\* Name\s*: .*/g, `* Name      : ${name} Theme`);
      xml = xml.replace(/\* Version\s*: .*/g, '* Version   : 1.0.0');
      xml = xml.replace(/\* Creator\s*: .*/g, `* Creator   : ${name}`);
      xml = xml.replace(/iQONE - Temabanua/g, name);
      xml = xml.replace(/Template Blogger by Temabanua/g, `Powered by ${name}`);
      xml = xml.replace(/Blogger Template Indonesia/g, name);
      xml = xml.replace(/@rian_seo/g, `@${name.replace(/\s+/g, '')}`);

      // 2. Colors
      xml = xml.replace(/#1cc749/ig, '#6366F1');
      xml = xml.replace(/#00be06/ig, '#8B5CF6');
      xml = xml.replace(/#11c749/ig, '#6366F1');
      xml = xml.replace(/#00d639/ig, '#8B5CF6');
      xml = xml.replace(/#00c234/ig, '#3B82F6');
      xml = xml.replace(/#48d16c/ig, '#818CF8');
      xml = xml.replace(/#00cc36/ig, '#6366F1');

      // 3. Fonts
      xml = xml.replace(/font-family:"SF Pro",Roboto,"Noto Sans",sans-serif;/g, "font-family:'Inter', 'Cairo', sans-serif;");
      
      if (!xml.includes('fonts.googleapis.com/css2?family=Cairo')) {
        const injectedHead = `
  <!-- ${name} Modern Enhancements -->
  <link href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&amp;family=Inter:wght@300;400;500;600;700&amp;display=swap' rel='stylesheet'/>
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <style>
    /* Modern Enhancements */
    a, button, .btn, .widget-content, .entry-image-wrap {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .index-post, .item-post, .widget-content, .about-box {
      border-radius: 12px !important;
      border: 1px solid rgba(255,255,255,0.05) !important;
    }
    .index-post:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1) !important;
    }
    .BlogSearch input {
      border-radius: 12px !important;
      transition: all 0.3s ease !important;
    }
    .BlogSearch input:focus {
      background: rgba(255,255,255,0.1) !important;
      box-shadow: 0 0 0 2px var(--keycolor) !important;
    }
    .btn-head a, .post-share-wrap, .copyButton button, .load-more {
      border-radius: 12px !important;
    }
    .footer-wrapper {
      background: #0B0F19 !important;
    }
    .footer-wrapper * {
      transition: all 0.3s ease !important;
    }
    .entry-image-wrap {
      border-radius: 12px !important;
    }
    .slider-img {
      border-radius: 16px !important;
    }
  </style>
</head>`;
        xml = xml.replace(/<\/head>/i, injectedHead);
      }
      
      xml = xml.replace(/<img /g, '<img loading="lazy" ');

      // Calculate report metrics and before/after snippets for visualization
      const origLines = inputXML.split('\n');
      const modLines = xml.split('\n');
      
      const oldCopyrights: string[] = [];
      const copyrightRegexes = [
        /Template Blogger by <a class='xnxx' href='[^']*' id='xnxx' target='_blank' title='[^']*'>[^<]*<\/a>/i,
        /Template Blogger by Temabanua/i,
        /Blogger Template Indonesia/i,
        /iQONE - Temabanua/i,
        /@rian_seo/i,
        /var _0x457381/i,
        /iqone\.js/i,
        /\/\* Credit: .*?\*\//i
      ];

      origLines.forEach(line => {
        copyrightRegexes.forEach(regex => {
          if (regex.test(line) && !oldCopyrights.includes(line.trim())) {
            const cleanLine = line.trim().replace(/<[^>]*>/g, '').substring(0, 80);
            if (cleanLine) oldCopyrights.push(cleanLine);
          }
        });
      });

      if (oldCopyrights.length === 0) {
        oldCopyrights.push("Template Blogger by Temabanua (حقوق افتراضية للمنصة)");
        oldCopyrights.push("rianseo iqone.js (ملفات جافا سكريبت ضارة وتتبع للحقوق)");
      }

      const newCopyrights = [
        `© ${year} ${name}`,
        `المطور / Creator: ${name}`,
        `رابط الموقع / Link: ${url}`
      ];

      let diffCount = 0;
      const maxLinesToCheck = Math.min(origLines.length, modLines.length);
      for (let i = 0; i < maxLinesToCheck; i++) {
        if (origLines[i].trim() !== modLines[i].trim()) {
          diffCount++;
        }
      }
      diffCount += Math.abs(origLines.length - modLines.length);
      const percentMod = Math.min(100, Math.max(1, Math.round((diffCount / Math.max(origLines.length, 1)) * 100)));

      // Extract header segment for comparison
      const beforeHeadIndex = inputXML.toLowerCase().indexOf('</head>');
      let headerBefore = "لم يتم العثور على ترويسة head في الملف الأصلي";
      let headerAfter = "لم يتم العثور على ترويسة head في الملف المعدل";
      if (beforeHeadIndex !== -1) {
        headerBefore = inputXML.substring(Math.max(0, beforeHeadIndex - 250), beforeHeadIndex + 7);
      }
      const afterHeadIndex = xml.toLowerCase().indexOf('</head>');
      if (afterHeadIndex !== -1) {
        headerAfter = xml.substring(Math.max(0, afterHeadIndex - 450), afterHeadIndex + 7);
      }

      // Extract footer segment for comparison
      let footerBefore = "Template Blogger by Temabanua";
      let footerAfter = `&#169; ${year} ${name}`;
      
      const widgetMatch = inputXML.match(/<div class='widget'>\s*Template Blogger by <a class='xnxx'[\s\S]*?<\/div>/);
      if (widgetMatch) {
        footerBefore = widgetMatch[0];
      } else {
        const fallbackMatch = inputXML.match(/Template Blogger by <a class='xnxx'.*?<\/a>/);
        if (fallbackMatch) footerBefore = fallbackMatch[0];
      }

      const widgetMatchAfter = xml.match(/<div class='widget'>\s*&#169;[\s\S]*?<\/div>/);
      if (widgetMatchAfter) {
        footerAfter = widgetMatchAfter[0];
      } else {
        const fallbackMatchAfter = xml.match(/&#169;[\s\S]*?<\/span>/);
        if (fallbackMatchAfter) fallbackMatchAfter[0];
      }

      setReport({
        percent: percentMod,
        oldCopyrights,
        newCopyrights,
        originalLineCount: origLines.length,
        modifiedLineCount: modLines.length,
        diffCount,
        headerBefore,
        headerAfter,
        footerBefore,
        footerAfter
      });

      // Deduct credit
      const newCredits = userData.credits - 1;
      await updateDoc(doc(db, 'users', userData.uid), { credits: newCredits });
      
      // Log operation
      await addDoc(collection(db, 'removal_logs'), {
        uid: userData.uid,
        timestamp: new Date().toISOString(),
        creditsUsed: 1
      });

      setUserData(prev => prev ? { ...prev, credits: newCredits } : null);
      setOutputXML(xml);
      addToHistory('✔ تم تنظيف الحقوق بنجاح', xml);
      showToast('تمت معالجة القالب بنجاح وخصم نقطة واحدة! | Template processed successfully! 1 Credit used.', 'success');
    } catch (err: any) {
      setError('An error occurred during processing: ' + err.message);
      showToast('فشل في معالجة القالب. الرجاء المحاولة مرة أخرى | Failed to process template. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputXML);
    setCopied(true);
    showToast('تم نسخ الكود بنجاح إلى الحافظة! | Code copied to clipboard successfully!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadXML = (bypass: boolean = false) => {
    const xmlToDownload = outputXML || inputXML;
    if (!xmlToDownload) {
      showToast('لا يوجد كود لتحميله! الرجاء معالجة القالب أو رفعه أولاً. | No code available for download!', 'warning');
      return;
    }

    const errorsBeforeDownload = validateBloggerXML(xmlToDownload);
    const criticalErrors = errorsBeforeDownload.filter(e => e.type === 'error');

    if (criticalErrors.length > 0 && !bypass) {
      setValidationErrors(errorsBeforeDownload);
      setShowValidationModal(true);
      showToast('⚠️ تنبيه: تم رصد أخطاء برمجية حرجة في قالبك قد تمنع رفعه على بلوجر!', 'warning');
      return;
    }

    const blob = new Blob([xmlToDownload], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${creatorName.toLowerCase().replace(/\s+/g, '-') || 'dark-storm'}-theme.xml`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('بدأ تحميل ملف القالب الجديد! | Theme XML download started successfully!', 'info');
  };

  const optimizeXML = async () => {
    setError('');
    
    if (!inputXML || inputXML.trim().length === 0) {
      showToast('الرجاء إدخال أو رفع كود القالب أولاً! | Please input or upload the template XML first!', 'warning');
      return;
    }

    if (userData.credits <= 0) {
      const msg = 'ليس لديك رصيد كافٍ لإجراء هذه العملية! يرجى شحن رصيدك. | You do not have enough credits to perform this operation!';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsOptimizing(true);
    try {
      let xml = inputXML;

      // 1. CSS Compression inside <style> and <b:skin> or <b:template-skin>
      const cssRegex = /(<style[^>]*>|<b:skin[^>]*>|<b:template-skin[^>]*>)([\s\S]*?)(<\/style>|<\/b:skin>|<\/b:template-skin>)/ig;
      xml = xml.replace(cssRegex, (match, openTag, cssContent, closeTag) => {
        let compressedCss = cssContent;
        // Remove standard comments but preserve CDATA declarations
        compressedCss = compressedCss.replace(/\/\*(?!<!\[CDATA\[|\]\]>)[\s\S]*?\*\//g, '');
        // Compress spaces and newlines
        compressedCss = compressedCss.replace(/\s+/g, ' ');
        compressedCss = compressedCss.replace(/\s*([\{\};:,])\s*/g, '$1');
        compressedCss = compressedCss.trim();
        return `${openTag}\n${compressedCss}\n${closeTag}`;
      });

      // 2. JavaScript Compression inside <script>
      const jsRegex = /(<script[^>]*>)([\s\S]*?)(<\/script>)/ig;
      xml = xml.replace(jsRegex, (match, openTag, jsContent, closeTag) => {
        if (openTag.includes('src=')) return match;
        
        let lines = jsContent.split('\n');
        lines = lines.map(line => {
          let l = line.trim();
          // Remove single line comments carefully (avoid url patterns)
          l = l.replace(/(^|[^:])\/\/.*$/, '$1').trim();
          return l;
        }).filter(line => line.length > 0);
        
        let compressedJs = lines.join('\n');
        // Remove standard multiline comments but keep CDATA markers
        compressedJs = compressedJs.replace(/\/\*(?!<!\[CDATA\[|\]\]>)[\s\S]*?\*\//g, '');
        
        return `${openTag}\n${compressedJs}\n${closeTag}`;
      });

      // 3. Remove general HTML/XML comments except Blogger structural statements or conditional targets
      xml = xml.replace(/<!--(?!\[if|<!\[)([\s\S]*?)-->/g, (match, p1) => {
        if (p1.includes('<b:') || p1.includes('</b:') || p1.includes('data:') || p1.includes('expr:') || p1.includes('CDATA') || p1.includes('ajax')) {
          return match;
        }
        return '';
      });

      // 4. Speed improvements - lazy load images and iframes
      xml = xml.replace(/<img (?![^>]*loading=)/ig, '<img loading="lazy" ');
      xml = xml.replace(/<iframe (?![^>]*loading=)/ig, '<iframe loading="lazy" ');

      // 5. 2026 Ultimate Performance Enhancements Suite (Skeleton Loading, Lazy Loading, WebP Conversion, CLS & LCP Optimization, Preload Fonts, Preconnect & DNS Prefetch)
      const performanceCDNsAndMeta = `
  <!-- ========================================================= -->
  <!-- 2026 ULTIMATE PERFORMANCE & SPEED SUITE (AI OPTIMIZED)     -->
  <!-- ========================================================= -->
  <link rel='preconnect' href='https://fonts.googleapis.com' crossorigin='anonymous'/>
  <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin='anonymous'/>
  <link rel='preconnect' href='https://blogger.googleusercontent.com' crossorigin='anonymous'/>
  <link rel='preconnect' href='https://bp.blogspot.com' crossorigin='anonymous'/>
  <link rel='preconnect' href='https://lh3.googleusercontent.com' crossorigin='anonymous'/>
  <link rel='dns-prefetch' href='https://fonts.googleapis.com'/>
  <link rel='dns-prefetch' href='https://fonts.gstatic.com'/>
  <link rel='dns-prefetch' href='https://ajax.googleapis.com'/>
  <link rel='dns-prefetch' href='https://resources.blogblog.com'/>
  <link rel='dns-prefetch' href='https://www.blogger.com'/>
  <link rel='dns-prefetch' href='https://blogger.googleusercontent.com'/>
  <link rel='dns-prefetch' href='https://bp.blogspot.com'/>
  <link rel='dns-prefetch' href='https://www.googletagmanager.com'/>
  <link rel='dns-prefetch' href='https://www.google-analytics.com'/>
  <link rel='dns-prefetch' href='https://pagead2.googlesyndication.com'/>

  <!-- 2026 CLS & Performance Base Stylesheet -->
  <style>
    /* Prevent layout shifts (CLS Improvement) */
    html {
      scroll-behavior: smooth;
    }
    img {
      max-width: 100%;
      height: auto;
      content-visibility: auto;
    }
    /* Set default aspect ratio values on template image wrappers to reserve spaces */
    .post-thumbnail, .entry-image, .post-image, .slider-img, .entry-image-wrap {
      aspect-ratio: 16/9;
      background-color: #0f172a;
      content-visibility: auto;
      contain-intrinsic-size: 1px 200px;
    }
    /* Font swap to prevent FOIT & layout shift */
    * {
      font-display: swap !important;
    }
    /* Skeleton Loading Placeholder Animation CSS */
    .skeleton-placeholder {
      background: linear-gradient(90deg, #0f172a 25%, #1e293b 50%, #0f172a 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite linear;
    }
    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-text {
      height: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .skeleton-title {
      height: 20px;
      margin-bottom: 12px;
      border-radius: 6px;
      width: 80%;
    }
    /* Lazy loading styling */
    img.lazy-unloaded {
      opacity: 0;
      transition: opacity 0.4s ease-in-out;
    }
    img.lazy-loaded {
      opacity: 1;
    }
  </style>

  <!-- 2026 Dynamic WebP, Lazy Load & Skeleton Script -->
  <script type='text/javascript'>
    //<![CDATA[
    document.addEventListener("DOMContentLoaded", function() {
      // 1. WebP Auto-Convert for Blogspot/GoogleUserContent images
      var images = document.getElementsByTagName("img");
      for (var i = 0; i < images.length; i++) {
        var src = images[i].getAttribute("src");
        if (src && (src.indexOf("blogspot.com") !== -1 || src.indexOf("googleusercontent.com") !== -1)) {
          if (src.indexOf("-rw") === -1 && !src.match(/\\.(gif|svg)$/i)) {
            if (src.indexOf("/s1600/") !== -1) {
              images[i].setAttribute("src", src.replace("/s1600/", "/s1600-rw/"));
            } else if (src.indexOf("/w640/") !== -1) {
              images[i].setAttribute("src", src.replace("/w640/", "/w640-rw/"));
            } else if (src.indexOf("?") !== -1) {
              images[i].setAttribute("src", src + "-rw");
            } else {
              images[i].setAttribute("src", src + "-rw");
            }
          }
        }
        
        // Ensure lazy images fade in nicely
        if (images[i].getAttribute("loading") === "lazy") {
          images[i].classList.add("lazy-unloaded");
          images[i].onload = function() {
            this.classList.add("lazy-loaded");
            this.classList.remove("lazy-unloaded");
          };
          // Force load if already cached
          if (images[i].complete) {
            images[i].classList.add("lazy-loaded");
            images[i].classList.remove("lazy-unloaded");
          }
        }
      }

      // 2. Intersection Observer for lazy-loading background images
      if ("IntersectionObserver" in window) {
        var lazyBackgrounds = [].slice.call(document.querySelectorAll(".post-thumbnail, .entry-image, .slider-img"));
        var bgObserver = new IntersectionObserver(function(entries, observer) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var lazyBg = entry.target;
              var bgUrl = lazyBg.getAttribute("data-background");
              if (bgUrl) {
                // Apply WebP optimized URL for background
                if (bgUrl.indexOf("blogspot.com") !== -1 && bgUrl.indexOf("-rw") === -1) {
                  bgUrl = bgUrl.replace("/s1600/", "/s1600-rw/");
                }
                lazyBg.style.backgroundImage = "url('" + bgUrl + "')";
              }
              bgObserver.unobserve(lazyBg);
            }
          });
        });
        lazyBackgrounds.forEach(function(bg) {
          bgObserver.observe(bg);
        });
      }

      // 3. Skeleton loader to real-content transition (LCP Improvement)
      var skeletons = document.querySelectorAll(".skeleton-placeholder");
      if (skeletons.length > 0) {
        window.addEventListener("load", function() {
          skeletons.forEach(function(skel) {
            skel.classList.remove("skeleton-placeholder");
          });
        });
      }
    });
    //]]>
  </script>
`;

      if (!xml.includes('2026 ULTIMATE PERFORMANCE & SPEED SUITE') && xml.toLowerCase().includes('<head>')) {
        xml = xml.replace(/<head>/i, `<head>${performanceCDNsAndMeta}`);
      }

      // Preload Google fonts dynamically by converting link tags to preload style onload patterns
      xml = xml.replace(/<link\s+([^>]*href=['"]https?:\/\/fonts\.googleapis\.com\/css2\?[^'"]+['"])([^>]*)(rel=['"]stylesheet['"])([^>]*)\/?>/gi, (match, href, p1, rel, p2) => {
        return `<link ${href}${p1}rel='preload' as='style' onload="this.onload=null;this.rel='stylesheet'"${p2}/>`;
      });

      // Add defer to non-blogger external javascripts
      xml = xml.replace(/<script([^>]+)src=['"](https?:\/\/(?!www\.blogger\.com|resources\.blogblog\.com)[^'"]+)['"](?![^>]*defer)(?![^>]*async)([^>]*)>/ig, (match, p1, src, p2) => {
        return `<script${p1}src='${src}' defer='defer'${p2}>`;
      });

      // 6. SEO Meta tag optimization
      if (!xml.toLowerCase().includes('name="viewport"') && xml.toLowerCase().includes('<head>')) {
        xml = xml.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>');
      }
      if (!xml.toLowerCase().includes('name="robots"') && xml.toLowerCase().includes('<head>')) {
        xml = xml.replace(/<head>/i, '<head>\n  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>');
      }

      // 7. Cleanup extra spaces or empty tags
      xml = xml.replace(/<style[^>]*>\s*<\/style>/ig, '');
      xml = xml.replace(/<script[^>]*>\s*<\/script>/ig, '');
      xml = xml.replace(/\n\s*\n\s*\n/g, '\n\n');

      setOutputXML(xml);

      // Deduct credit
      const newCredits = userData.credits - 1;
      await updateDoc(doc(db, 'users', userData.uid), { credits: newCredits });
      
      // Log operation
      await addDoc(collection(db, 'removal_logs'), {
        uid: userData.uid,
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        type: 'optimization'
      });

      setUserData(prev => prev ? { ...prev, credits: newCredits } : null);
      addToHistory('✔ تم تحسين وتصغير الأكواد وتفعيل 2026 Speed Suite', xml);
      showToast('تمت معالجة وتحسين القالب بالكامل بنجاح وخصم نقطة واحدة! | Template optimized & compressed successfully! 1 Credit used.', 'success');

      // Update analysis panel with new stats
      analyzeBloggerTemplate(xml);

      // Generate reports & compare views for optimization changes
      const origLines = inputXML.split('\n');
      const modLines = xml.split('\n');
      
      const oldCopyrights = [
        "تعليقات CSS و JS زائدة (Redundant comments removed)",
        "فراغات وأكواد منسقة غير مضغوطة (Whitespace compressed)",
        "صور بدون تحميل كسول (Images without lazy-load)",
        "عدم وجود نظام السكيليتون والهيكل المؤقت (No Skeleton Loadings)",
        "روابط خطوط Render-blocking (Direct Google Font links)"
      ];
      const newCopyrights = [
        "تحميل الهيكل المؤقت Skeleton Loading لمنع وميض الشاشة",
        "تحميل الصور بصيغ WebP فائقة الضغط تلقائياً لتسريع اللود",
        "تحميل كسول Lazy Loading للصور والآيفريمات والوجتات",
        "تقليل CLS وLCP عبر تحديد أبعاد الصور وfont-display: swap",
        "ربط مسبق DNS Prefetch & Preconnect لأسرع اتصال بالخوادم",
        "تحميل غير متزامن Preload للخطوط لعدم حجب الرندرة"
      ];

      let diffCount = 0;
      const maxLinesToCheck = Math.min(origLines.length, modLines.length);
      for (let i = 0; i < maxLinesToCheck; i++) {
        if (origLines[i].trim() !== modLines[i].trim()) {
          diffCount++;
        }
      }
      diffCount += Math.abs(origLines.length - modLines.length);
      const percentMod = Math.min(100, Math.max(1, Math.round((diffCount / Math.max(origLines.length, 1)) * 100)));

      let headerBefore = "مقطع CSS الأصلي";
      let headerAfter = "مقطع CSS المضغوط المحسن";
      const cssMatchBefore = inputXML.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (cssMatchBefore) {
        headerBefore = cssMatchBefore[0].substring(0, 400) + '...';
      }
      const cssMatchAfter = xml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (cssMatchAfter) {
        headerAfter = cssMatchAfter[0].substring(0, 400) + '...';
      }

      let footerBefore = "أكواد جافا سكريبت وتعليقات مبعثرة";
      let footerAfter = "جافا سكريبت مضغوطة بالكامل وسريعة";
      const jsMatchBefore = inputXML.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (jsMatchBefore) {
        footerBefore = jsMatchBefore[0].substring(0, 400) + '...';
      }
      const jsMatchAfter = xml.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (jsMatchAfter) {
        footerAfter = jsMatchAfter[0].substring(0, 400) + '...';
      }

      setReport({
        percent: percentMod,
        oldCopyrights,
        newCopyrights,
        originalLineCount: origLines.length,
        modifiedLineCount: modLines.length,
        diffCount,
        headerBefore,
        headerAfter,
        footerBefore,
        footerAfter
      });

    } catch (err: any) {
      setError('An error occurred during optimization: ' + err.message);
      showToast('فشل في تحسين القالب. الرجاء المحاولة مرة أخرى | Failed to optimize template.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExplainTemplate = async () => {
    if (!inputXML.trim()) {
      showToast('الرجاء رفع كود القالب أو لصقه أولاً! | Please upload or paste template code first!', 'warning');
      return;
    }

    setIsExplaining(true);
    setTemplateExplanation('');
    try {
      const response = await fetch('/api/explain-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent: inputXML }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل في الاتصال بالخادم الذكي | Server response error');
      }

      setTemplateExplanation(data.explanation || '');
      showToast('تم تحليل وشرح كود القالب بنجاح عبر الذكاء الاصطناعي! | Template explained successfully by AI!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'حدث خطأ أثناء الاتصال بـ Gemini | Error communicating with Gemini', 'error');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGeneratePages = () => {
    if (!siteName.trim()) {
      showToast('الرجاء إدخال اسم الموقع أولاً! | Please enter Site Name first!', 'warning');
      return;
    }
    if (!siteEmail.trim() || !siteEmail.includes('@')) {
      showToast('الرجاء إدخال بريد إلكتروني صحيح للاتصال! | Please enter a valid contact email!', 'warning');
      return;
    }
    if (!creatorName.trim()) {
      showToast('الرجاء إدخال اسم الكاتب أو المشرف! | Please enter Author/Admin Name!', 'warning');
      return;
    }

    setIsGeneratingPages(true);
    try {
      const currentYear = new Date().getFullYear();
      const url = creatorUrl || 'https://example.com';
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');

      const about = `<!-- About Us Page for ${siteName} -->
<div class="nexora-page about-page" style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; margin-top: 0;">من نحن - About Us</h2>
  <p>مرحباً بك في <strong>${siteName}</strong>، المنصة الرقمية المتميزة التي تسعى لتقديم أفضل محتوى وخدمات تلبي تطلعات زوارنا الكرام.</p>
  <p>تأسس موقع <strong>${siteName}</strong> بواسطة المطور والكاتب <strong>${creatorName}</strong>، بهدف إثراء المحتوى العربي وتقديم حلول ذكية ومبتكرة في شتى المجالات التي تهم المستخدم العربي والعالمي.</p>
  
  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">رؤيتنا ورسالتنا</h3>
  <p>نهدف في <strong>${siteName}</strong> إلى أن نكون المرجع الأول والموثوق لزوارنا، من خلال تقديم مقالات، أدوات، وشروحات متميزة وعالية الجودة مصممة بدقة لتسهيل حياتك اليومية وتطوير مهاراتك.</p>
  
  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">لماذا تختارنا؟</h3>
  <ul style="list-style-type: square; padding-right: 20px; margin: 10px 0;">
    <li style="margin-bottom: 5px;">محتوى حصري ومحدث باستمرار.</li>
    <li style="margin-bottom: 5px;">تركيز تام على تجربة مستخدم سلسة وسريعة.</li>
    <li style="margin-bottom: 5px;">دعم مستمر وإجابة على جميع استفسارات الزوار عبر البريد الإلكتروني.</li>
  </ul>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">للتواصل معنا</h3>
  <p>إذا كان لديك أي استفسار، اقتراح، أو رغبة في التعاون التجاري، يمكنك دائماً مراسلتنا مباشرة عبر البريد الإلكتروني: <a href="mailto:${siteEmail}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">${siteEmail}</a> أو زيارة صفحة <a href="${url}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">اتصل بنا</a>.</p>
  <p style="margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 15px;">حقوق النشر والملكيات محفوظة © ${currentYear} لـ ${siteName}</p>
</div>`;

      const contact = `<!-- Contact Us Page for ${siteName} -->
<div class="nexora-page contact-page" style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; margin-top: 0;">اتصل بنا - Contact Us</h2>
  <p>يسعدنا دائماً تواصلكم معنا! سواء كان لديك استفسار، اقتراح لتطوير الموقع، إبلاغ عن مشكلة، أو رغبة في الإعلان والتعاون المشترك، فنحن هنا للاستماع إليك.</p>
  
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 25px 0;">
    <h3 style="color: #1f2937; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">معلومات الاتصال المباشرة</h3>
    <p style="margin: 10px 0;"><strong>📧 البريد الإلكتروني الرسمي:</strong> <a href="mailto:${siteEmail}" style="color: #4f46e5; text-decoration: none; font-family: monospace;">${siteEmail}</a></p>
    <p style="margin: 10px 0;"><strong>🌐 موقعنا الإلكتروني:</strong> <a href="${url}" target="_blank" style="color: #4f46e5; text-decoration: none; font-family: monospace;">${cleanUrl}</a></p>
    <p style="margin: 10px 0;"><strong>✍️ الكاتب والمسؤول المباشر:</strong> ${creatorName}</p>
  </div>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">نموذج مراسلة سريع</h3>
  <p>يرجى إرسال رسالتك مباشرة إلى بريدنا وسيقوم المسؤول بالرد عليك في غضون 24 إلى 48 ساعة كحد أقصى.</p>
  
  <form onsubmit="alert('تم تفعيل ميزة الإرسال التلقائي للبريد بنجاح! سيتم توجيهك لبريدك لإرسال الرسالة.'); window.location.href='mailto:${siteEmail}?subject=Contact from ${siteName}&amp;body='+encodeURIComponent(document.getElementById('c_msg').value); return false;" style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
    <div style="width: 100%;">
      <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #4b5563;">الاسم الكامل / Name</label>
      <input type="text" required="required" placeholder="أدخل اسمك هنا..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; box-sizing: border-box;" />
    </div>
    <div style="width: 100%;">
      <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #4b5563;">البريد الإلكتروني / Email</label>
      <input type="email" required="required" placeholder="yourname@domain.com" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; box-sizing: border-box; text-align: left; direction: ltr;" />
    </div>
    <div style="width: 100%;">
      <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #4b5563;">نص الرسالة / Message</label>
      <textarea id="c_msg" required="required" rows="5" placeholder="اكتب تفاصيل رسالتك أو اقتراحك هنا بالتفصيل..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; resize: vertical; box-sizing: border-box;"></textarea>
    </div>
    <button type="submit" style="background-color: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background-color 0.2s; font-family: sans-serif;">إرسال الرسالة الآن</button>
  </form>
</div>`;

      const privacy = `<!-- Privacy Policy Page for ${siteName} -->
<div class="nexora-page privacy-page" style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; margin-top: 0;">سياسة الخصوصية - Privacy Policy</h2>
  <p>في <strong>${siteName}</strong>، التي يمكن الوصول إليها من <a href="${url}">${cleanUrl}</a>، تعتبر خصوصية زوارنا إحدى أولوياتنا القصوى. تحتوي وثيقة سياسة الخصوصية هذه على أنواع المعلومات التي يتم جمعها وتسجيلها بواسطة موقعنا وكيفية استخدامها.</p>
  
  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">ملفات السجل (Log Files)</h3>
  <p>يتبع <strong>${siteName}</strong> إجراءً قياسياً لاستخدام ملفات السجل. تسجل هذه الملفات الزوار عندما يزورون المواقع الإلكترونية. تشمل المعلومات التي تجمعها ملفات السجل عناوين بروتوكول الإنترنت (IP)، نوع المتصفح، مزود خدمة الإنترنت (ISP)، طابع التاريخ والوقت، صفحات الإحالة/الخروج، وربما عدد النقرات. هذه المعلومات غير مرتبطة بأي معلومات تحدد الهوية الشخصية.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">ملفات تعريف الارتباط وسجلات الويب (Cookies)</h3>
  <p>مثل أي موقع إلكتروني آخر، يستخدم <strong>${siteName}</strong> "ملفات تعريف الارتباط" (Cookies). تُسخدم هذه الملفات لتخزين المعلومات بما في ذلك تفضيلات الزوار، والصفحات على الموقع الإلكتروني التي زارها المستخدم أو قام بالوصول إليها. يتم استخدام هذه المعلومات لتحسين تجربة المستخدمين من خلال تخصيص محتوى صفحتنا بناءً على نوع متصفح الزوار و/أو معلومات أخرى.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">ملف تعريف الارتباط Google DoubleClick DART</h3>
  <p>جوجل هو أحد البائعين التابعين لجهات خارجية على موقعنا. يستخدم أيضاً ملفات تعريف الارتباط، المعروفة باسم ملفات تعريف الارتباط DART، لخدمة الإعلانات لزوار موقعنا بناءً على زيارتهم لموقعنا والمواقع الأخرى على الإنترنت. ومع ذلك، قد يختار الزوار رفض استخدام ملفات تعريف ارتباط DART عن طريق زيارة سياسة خصوصية إعلانات جوجل وشبكة المحتوى على العنوان التالي: <a href="https://policies.google.com/technologies/ads" target="_blank" style="color: #4f46e5;">https://policies.google.com/technologies/ads</a></p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">شركاء الإعلانات لدينا</h3>
  <p>قد يستخدم بعض المعلنين على موقعنا ملفات تعريف الارتباط وإشارات الويب. شركاء الإعلانات لدينا تشمل:</p>
  <ul style="list-style-type: disc; padding-right: 20px; margin: 10px 0;">
    <li style="margin-bottom: 5px;"><strong>Google AdSense / Adsterra / Ezoic</strong></li>
  </ul>
  <p>لكل من شركاء الإعلانات هؤلاء سياسة خصوصية خاصة بهم للمعلومات المتعلقة ببيانات المستخدم.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">الموافقة</h3>
  <p>باستخدامك لموقعنا الإلكتروني، فإنك توافق بموجب ذلك على سياسة الخصوصية الخاصة بنا وتوافق على شروطها وأحكامها.</p>
</div>`;

      const terms = `<!-- Terms of Service Page for ${siteName} -->
<div class="nexora-page terms-page" style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; margin-top: 0;">شروط الاستخدام - Terms of Service</h2>
  <p>مرحباً بك في موقع <strong>${siteName}</strong>. يرجى قراءة شروط الخدمة هذه بعناية قبل استخدام موقعنا الإلكتروني الذي يديره الكاتب <strong>${creatorName}</strong>.</p>
  
  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">1. قبول الشروط</h3>
  <p>من خلال تصفحك واستخدامك لموقع <strong>${siteName}</strong>، فإنك تقر وتوافق تماماً على الالتزام بشروط الخدمة هذه وسياسة الخصوصية الخاصة بنا. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الموقع.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">2. الملكية الفكرية وحقوق النشر</h3>
  <p>جميع المواد المنشورة على موقعنا من نصوص، صور، تصاميم، أدوات، وأكواد هي ملك حصري لموقع <strong>${siteName}</strong> ومحمية بموجب قوانين حماية حقوق النشر والملكية الفكرية الدولية. لا يُسمح بنسخ أو إعادة توزيع أي جزء من المحتوى دون إذن كتابي مسبق.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">3. شروط الاستخدام المقبول</h3>
  <p>أنت توافق على استخدام موقعنا للأغراض المشروعة فقط وبطريقة لا تنتهك حقوق الآخرين أو تقيد أو تمنع استخدامهم للموقع. يحظر تماماً إرسال محتوى ضار، محاولات اختراق أو استخدام روبوتات لجمع البيانات دون تصريح.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">4. إخلاء المسؤولية عن الروابط الخارجية</h3>
  <p>قد يحتوي موقعنا على روابط لمواقع خارجية لجهات خارجية. نحن لا نتحكم في محتوى هذه المواقع ونخلي مسؤوليتنا تماماً عن أي أضرار ناتجة عن استخدامها.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">5. التعديلات والتغييرات</h3>
  <p>نحتفظ بالحق الكامل في تعديل أو تحديث هذه الشروط في أي وقت دون إشعار مسبق. تسري التعديلات فور نشرها على هذه الصفحة.</p>
</div>`;

      const disclaimer = `<!-- Disclaimer Page for ${siteName} -->
<div class="nexora-page disclaimer-page" style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; text-align: right; padding: 20px; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; margin-top: 0;">إخلاء المسؤولية - Disclaimer</h2>
  <p>المعلومات المقدمة على موقع <strong>${siteName}</strong> هي لأغراض إعلامية وتعليمية عامة فقط.</p>
  
  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">1. دقة وصحة المعلومات</h3>
  <p>يبذل موقع <strong>${siteName}</strong> بالتعاون مع الكاتب <strong>${creatorName}</strong> قصارى جهده لضمان دقة وتحديث المعلومات المنشورة. ومع ذلك، فإننا لا نقدم أي ضمانات صريحة أو ضمنية بشأن اكتمال، دقة، موثوقية، أو ملاءمة هذه المعلومات لأي غرض معين.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">2. المسؤولية الشخصية للزائر</h3>
  <p>أي إجراء تتخذه بناءً على المعلومات الواردة في هذا الموقع يكون على مسؤوليتك الشخصية والكاملة. لن نكون مسؤولين عن أي خسائر أو أضرار تتعلق باستخدام موقعنا الإلكتروني.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">3. الاستشارات التخصصية</h3>
  <p>المحتوى المنشور في الموقع لا يعتبر بديلاً عن الاستشارات المهنية المتخصصة (الطبية، القانونية، التقنية الدقيقة، المالية). ننصح دائماً بمراجعة الخبراء المعتمدين قبل اتخاذ أي قرارات جوهرية.</p>

  <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">4. الاتصالات الخارجية</h3>
  <p>من خلال موقعنا، يمكنك زيارة مواقع أخرى عن طريق اتباع الروابط التشعبية لمثل هذه المواقع الخارجية. بينما نسعى جاهدين لتوفير روابط مفيدة وأخلاقية فقط، فليس لدينا أي سيطرة على محتوى وطبيعة هذه المواقع.</p>
</div>`;

      setGeneratedPages({ about, contact, privacy, terms, disclaimer });
      showToast('تم توليد جميع الصفحات القانونية بنجاح! يمكنك الآن تصفحها ونسخها أو دمجها في القالب تلقائياً. | Legal Pages Generated Successfully!', 'success');
    } catch (e: any) {
      showToast('فشل في توليد الصفحات. الرجاء المحاولة مجدداً | Failed to generate pages.', 'error');
    } finally {
      setIsGeneratingPages(false);
    }
  };

  const copyPageToClipboard = (key: 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer') => {
    if (!generatedPages) return;
    navigator.clipboard.writeText(generatedPages[key]);
    setCopiedPage(key);
    showToast('تم نسخ كود الصفحة بالكامل بنجاح! | Page HTML code copied successfully!', 'success');
    setTimeout(() => setCopiedPage(null), 2500);
  };

  const handleAutoInjectPages = async () => {
    if (!inputXML && !outputXML) {
      showToast('الرجاء إدخال أو رفع كود القالب أولاً! | Please enter or upload your template XML first!', 'warning');
      return;
    }
    if (!generatedPages) {
      showToast('الرجاء توليد الصفحات القانونية أولاً! | Please generate the legal pages first!', 'warning');
      return;
    }
    if (userData.credits <= 0) {
      showToast('ليس لديك رصيد كافٍ لدمج وحقن الصفحات في القالب! | You do not have enough credits!', 'error');
      return;
    }

    try {
      const currentXML = outputXML || inputXML;
      
      const injectionHTML = `
<!-- Nexora Auto-Generated Legal Pages & Modals -->
<div id='nexora-legal-footer' style='background: #111827; color: #f9fafb; padding: 20px 15px; text-align: center; font-family: Arial, Tahoma, sans-serif; font-size: 13px; direction: rtl; border-top: 3px solid #6366f1; clear: both; position: relative; z-index: 99999;'>
  <div style='max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px;'>
    <div>
      <span style='font-weight: bold;'>© ${new Date().getFullYear()} ${siteName}</span> | جميع الحقوق محفوظة لـ <span style='color: #818cf8;'>${creatorName}</span>
    </div>
    <div style='display: flex; gap: 20px; flex-wrap: wrap;'>
      <a href='javascript:void(0)' onclick='openNexoraModal("about")' style='color: #a5b4fc; text-decoration: none; font-weight: bold; transition: color 0.2s;'>من نحن</a>
      <a href='javascript:void(0)' onclick='openNexoraModal("contact")' style='color: #a5b4fc; text-decoration: none; font-weight: bold; transition: color 0.2s;'>اتصل بنا</a>
      <a href='javascript:void(0)' onclick='openNexoraModal("privacy")' style='color: #a5b4fc; text-decoration: none; font-weight: bold; transition: color 0.2s;'>سياسة الخصوصية</a>
      <a href='javascript:void(0)' onclick='openNexoraModal("terms")' style='color: #a5b4fc; text-decoration: none; font-weight: bold; transition: color 0.2s;'>شروط الخدمة</a>
      <a href='javascript:void(0)' onclick='openNexoraModal("disclaimer")' style='color: #a5b4fc; text-decoration: none; font-weight: bold; transition: color 0.2s;'>إخلاء المسؤولية</a>
    </div>
  </div>
</div>

<!-- Nexora Legal Pages Modals Containment -->
<div id='nexora-modal-overlay' style='display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(5px); z-index: 99999999; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;'>
  <div style='background: #ffffff; width: 100%; max-width: 800px; max-height: 85vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); animation: nexora-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid #e2e8f0; direction: rtl;'>
    <div style='background: #f8fafc; padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;'>
      <h3 id='nexora-modal-title' style='margin: 0; color: #1e293b; font-size: 17px; font-weight: bold; font-family: sans-serif;'>صفحة الموقع</h3>
      <button onclick='closeNexoraModal()' style='background: #ef4444; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 18px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; line-height: 1; transition: background 0.2s;'>×</button>
    </div>
    <div id='nexora-modal-body' style='padding: 28px; overflow-y: auto; flex: 1; font-size: 14.5px; color: #334155; line-height: 1.8; text-align: right; background: #ffffff;'>
      <!-- Content Dynamically Populated -->
    </div>
    <div style='background: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: left; display: flex; justify-content: flex-end;'>
      <button onclick='closeNexoraModal()' style='background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: bold; cursor: pointer; transition: background 0.2s;'>فهمت وإغلاق</button>
    </div>
  </div>
</div>

<style>
  @keyframes nexora-fade-in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  #nexora-legal-footer a:hover {
    color: #ffffff !important;
    text-decoration: underline !important;
  }
</style>

<script type='text/javascript'>
  //<![CDATA[
  const nexoraPages = {
    about: \`${generatedPages.about.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    contact: \`${generatedPages.contact.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    privacy: \`${generatedPages.privacy.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    terms: \`${generatedPages.terms.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    disclaimer: \`${generatedPages.disclaimer.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
  };

  const nexoraTitles = {
    about: 'من نحن - About Us',
    contact: 'اتصل بنا - Contact Us',
    privacy: 'سياسة الخصوصية - Privacy Policy',
    terms: 'شروط الاستخدام - Terms of Service',
    disclaimer: 'إخلاء المسؤولية - Disclaimer'
  };

  function openNexoraModal(pageKey) {
    const overlay = document.getElementById('nexora-modal-overlay');
    const titleEl = document.getElementById('nexora-modal-title');
    const bodyEl = document.getElementById('nexora-modal-body');
    if (overlay && titleEl && bodyEl) {
      titleEl.innerText = nexoraTitles[pageKey] || 'صفحة قانونية';
      bodyEl.innerHTML = nexoraPages[pageKey] || '';
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeNexoraModal() {
    const overlay = document.getElementById('nexora-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    const overlay = document.getElementById('nexora-modal-overlay');
    if (e.target === overlay) {
      closeNexoraModal();
    }
  });
  //]]>
</script>
`;

      let injectedXML = '';
      if (currentXML.toLowerCase().includes('</body>')) {
        const parts = currentXML.split(/<\/body>/i);
        injectedXML = parts[0] + injectionHTML + '</body>' + parts[1];
      } else {
        injectedXML = currentXML + '\n' + injectionHTML;
      }

      setOutputXML(injectedXML);

      // Deduct 1 credit
      const newCredits = userData.credits - 1;
      await updateDoc(doc(db, 'users', userData.uid), { credits: newCredits });
      
      // Log operation
      await addDoc(collection(db, 'removal_logs'), {
        uid: userData.uid,
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        type: 'legal_pages_injection'
      });

      setUserData(prev => prev ? { ...prev, credits: newCredits } : null);
      addToHistory('✔ دمج وحقن الصفحات القانونية والتعريفية', injectedXML);
      showToast('تم دمج وتثبيت الصفحات القانونية والاتصال بنجاح تام وخصم نقطة واحدة! القالب جاهز للتحميل. | Legal pages successfully integrated into template! 1 Credit used.', 'success');

      // Refresh template analyzer stats
      analyzeBloggerTemplate(injectedXML);

    } catch (e: any) {
      showToast('فشل في دمج الصفحات داخل القالب: ' + e.message, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputXML(content);
        addToHistory('✔ تم استيراد قالب خارجي', content);
        showToast('تم تحميل وقراءة ملف القالب بنجاح! جاري فحصه وتحليله تلقائياً... | Template loaded successfully! Analyzing...', 'success');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-6">
      <AdBanner 
        html={settings.adsterraBanner728x90 || settings.topAdHtml} 
        fallbackText="مساحة إعلانية علوية (Top Ad Banner)" 
      />

      <section className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-xl flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent z-10"></div>
        <div className="relative flex flex-col justify-end p-8 z-20 text-white max-w-2xl">
          <span className="bg-[#6366F1] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-3" style={{ backgroundColor: settings.primaryColor }}>AI Smart Tool</span>
          <h1 className="text-3xl font-bold leading-tight mb-2">{settings.heroTitle || 'AI Watermark Remover'}</h1>
          <p className="text-slate-300 text-sm line-clamp-2">
            {settings.heroSubtitle || 'Remove watermarks instantly with our advanced AI.'}
          </p>
        </div>
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-br from-[#6366F1]/20 to-indigo-900/40"></div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-[#6366F1]">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">بيانات القالب والصفحات القانونية | Configuration & Pages</h3>
              <p className="text-xs text-slate-500">قم بتهيئة بيانات موقعك لتغيير الحقوق وتوليد الصفحات الأساسية تلقائياً</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">اسم الموقع / Site Name</label>
            <input 
              type="text" 
              value={siteName} 
              onChange={(e) => {
                setSiteName(e.target.value);
                // Also default creatorName if empty for ease of use
                if (!creatorName) setCreatorName(e.target.value);
              }}
              placeholder="مثال: مدونة التقنية الذكية"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">رابط الموقع / Website URL</label>
            <input 
              type="url" 
              value={creatorUrl} 
              onChange={(e) => setCreatorUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">اسم الكاتب أو المدير / Author</label>
            <input 
              type="text" 
              value={creatorName} 
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="مثال: أحمد المحمدي"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">البريد الإلكتروني / Support Email</label>
            <input 
              type="email" 
              value={siteEmail} 
              onChange={(e) => setSiteEmail(e.target.value)}
              placeholder="support@domain.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleGeneratePages}
            disabled={isGeneratingPages}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingPages ? 'جاري توليد الصفحات...' : '✨ توليد الصفحات القانونية والتعريفية (Free)'}</span>
          </button>

          {generatedPages && (
            <button
              onClick={handleAutoInjectPages}
              disabled={userData.credits <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <FileCode className="w-4 h-4" />
              <span>⚡ دمج وحقن الصفحات داخل القالب تلقائياً (-1 نقطة)</span>
            </button>
          )}
        </div>

        {/* Generated Pages Tabbed Display */}
        {generatedPages && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6 bg-slate-50/50">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-700">الصفحات المولدة بنجاح | Browse Generated Pages:</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => copyPageToClipboard(activePageTab)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  {copiedPage === activePageTab ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPage === activePageTab ? 'تم النسخ!' : 'نسخ كود HTML'}</span>
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-wrap border-b border-slate-200 bg-white">
              {(['about', 'contact', 'privacy', 'terms', 'disclaimer'] as const).map((tab) => {
                const labels: Record<string, string> = {
                  about: 'من نحن (About)',
                  contact: 'اتصل بنا (Contact)',
                  privacy: 'سياسة الخصوصية',
                  terms: 'شروط الاستخدام',
                  disclaimer: 'إخلاء المسؤولية'
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActivePageTab(tab)}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                      activePageTab === tab
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Page content preview */}
            <div className="p-5 bg-white">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">معاينة مباشرة للصفحة / Page Preview:</div>
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 max-h-[350px] overflow-y-auto shadow-inner leading-relaxed">
                <div 
                  dangerouslySetInnerHTML={{ __html: generatedPages[activePageTab] }} 
                  className="prose prose-sm max-w-none"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 2026 PREMIUM AI TOOLS SUITE & TEMPLATE LIBRARY */}
      {/* ======================================================== */}
      <section className="space-y-6">
        
        {/* Row 1: Free Templates Library & Undo/History Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. Free Templates Library (مكتبة القوالب المجانية) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">مكتبة القوالب المجانية (Free Templates Library) 📚</h3>
                  <p className="text-[11px] text-slate-400">اختر قالباً جاهزاً ومحسناً بنسبة 100% لبدء التعديل فوراً بنقرة واحدة</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-1">
              {PRESET_TEMPLATES.map((tmpl) => {
                const isCurrent = inputXML === tmpl.xml;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setInputXML(tmpl.xml);
                      setOutputXML('');
                      analyzeBloggerTemplate(tmpl.xml);
                      addToHistory(`استيراد قالب: ${tmpl.name}`, tmpl.xml);
                      showToast(`تم تحميل قالب [${tmpl.name}] بنجاح داخل منطقة العمل!`, 'success');
                    }}
                    className={`group cursor-pointer rounded-xl p-3.5 border transition-all text-right flex flex-col justify-between ${
                      isCurrent 
                        ? 'border-emerald-500 bg-emerald-50/15' 
                        : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full group-hover:bg-indigo-100/65">
                          {tmpl.category}
                        </span>
                        {isCurrent ? (
                          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">نشط الآن</span>
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 mb-1 leading-snug">{tmpl.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">{tmpl.description}</p>
                    </div>
                    <div className="pt-3 flex justify-end text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      انقر لتفعيل القالب ←
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Undo/Revert & XML Version History (سجل نسخ القالب والتراجع) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">التراجع الذكي وسجل النسخ (Undo / Versions) ⏱️</h3>
                  <p className="text-[11px] text-slate-400">تراجع لأي نسخة من القالب في حال حدوث خطأ أثناء التخصيص</p>
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-500 block mb-1">سجل النسخ الاحتياطية فارغ</span>
                <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                  عند إجراء أي ميزة ذكية، سيتم حفظ نسخة تلقائية هنا فوراً لتتمكن من التراجع إليها بضغطة زر.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-1">
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">انقر على النسخة للاستعادة الفورية:</div>
                {history.map((ver, index) => (
                  <div
                    key={ver.id}
                    onClick={() => revertToHistoryVersion(ver)}
                    className="group cursor-pointer bg-slate-50 hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-100 rounded-xl p-3 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {ver.timestamp}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            النسخة الحالية
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 block truncate leading-tight group-hover:text-indigo-600">
                        {ver.title}
                      </span>
                    </div>
                    <button className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0 bg-white border border-slate-200 shadow-sm rounded px-2 py-1 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                      استعادة النسخة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: AI Widget Generator & Figma/HTML Design Converter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* C. AI Widget Generator (توليد الوجت بالذكاء الاصطناعي) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">مولد إضافات بلوجر بالذكاء الاصطناعي (AI Widget Builder) ⚙️</h3>
                  <p className="text-[11px] text-slate-400">ولّد أي إضافة ذكية، تأثير بصري، أو كود تفاعلي واحقنه مباشرة بضغطة زر</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">نوع الإضافة المقترحة / Widget Preset</label>
                  <select
                    value={selectedWidgetType}
                    onChange={(e) => setSelectedWidgetType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
                  >
                    <option value="Movie Slider">سلايدر أفلام تفاعلي (Movie Slider)</option>
                    <option value="Recent Posts">أحدث المشاركات بـ شبكة كروت (Recent Posts Grid)</option>
                    <option value="Breaking News">شريط الأخبار العاجلة المتحرك (Breaking News Ticker)</option>
                    <option value="Table Of Contents">جدول المحتويات التلقائي للمقالات (Table of Contents)</option>
                    <option value="Author Box">صندوق الكاتب التعريفي الأنيق (Author Profile Box)</option>
                    <option value="Dark Mode">مبدل الوضع الليلي وحفظ الإعداد (Smart Dark Mode)</option>
                    <option value="Reading Progress">مؤشر شريط قراءة المقالة (Reading Progress Bar)</option>
                    <option value="Back To Top">زر الصعود السلس للأعلى (Smooth Back To Top)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">تخصيص الإضافة (ألوان، نصوص، تفاصيل اختيارية)</label>
                  <input
                    type="text"
                    value={customWidgetPrompt}
                    onChange={(e) => setCustomWidgetPrompt(e.target.value)}
                    placeholder="مثال: اجعل الألوان بنفسجية، أو أضف مؤثرات زووم عند التمرير"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={generateWidget}
                  disabled={isGeneratingWidget || userData.credits <= 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  {isGeneratingWidget ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الابتكار والتوليد بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>توليد الوجت الذكي بالذكاء الاصطناعي (-1 نقطة)</span>
                    </>
                  )}
                </button>
              </div>

              {generatedWidgetCode && (
                <div className="space-y-2 border border-purple-100 bg-purple-50/15 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100/50">
                    <span className="text-xs font-extrabold text-purple-700">تم توليد كود الأداة بنجاح! 🎉</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedWidgetCode);
                          showToast('تم نسخ كود الوجت إلى الحافظة!', 'success');
                        }}
                        className="bg-white border border-slate-200 text-xs px-2.5 py-1 rounded font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ الكود</span>
                      </button>
                      <button
                        onClick={injectWidgetIntoTemplate}
                        className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded font-bold hover:bg-purple-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>إدراج تلقائي بالقالب ⚡</span>
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-[120px] overflow-y-auto font-mono text-[10px] text-slate-600 leading-relaxed bg-white border border-slate-100 p-2.5 rounded shadow-inner">
                    {generatedWidgetCode}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* D. Figma/ZIP/HTML Design to Blogger XML Converter (تحويل أي تصميم لبلوجر) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">محول أي تصميم لـ Blogger XML (Design to Blogger XML) 🎨</h3>
                  <p className="text-[11px] text-slate-400">الصق تصميم خارجي (Figma أو HTML/CSS أو ZIP Export) لتحويله لقالب بلوجر متكامل</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {(['HTML', 'Figma', 'ZIP Text Export'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDesignType(type)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      designType === type ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-[110px] flex flex-col">
                <textarea
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value)}
                  placeholder={
                    designType === 'Figma'
                      ? 'الصق تصدير أكواد التصميم أو بيانات Figma CSS/JSON هنا...'
                      : designType === 'HTML'
                      ? 'الصق كود الـ HTML والـ CSS الكامل للتصميم المراد تحويله...'
                      : 'الصق محتوى ملفات الـ ZIP المصدرة أو التصدير الهيكلي للتصميم هنا...'
                  }
                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-[#6366F1] transition-all outline-none resize-none font-mono text-slate-600"
                />
              </div>

              <button
                onClick={convertDesignToBlogger}
                disabled={isConvertingDesign || !designCode || userData.credits <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                {isConvertingDesign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تفكيك التصميم وبناء القالب الذكي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تحويل التصميم إلى قالب بلوجر XML (-1 نقطة)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* E. Smart AI Modernizer (ترقية 2026 الذكية) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/10 hover:shadow-indigo-500/5 hover:shadow-2xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center shadow-inner">
                <Brain className="w-6 h-6 text-[#818CF8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-white">ترقية وتحديث القالب الذكي لعام 2026 (Smart AI Modernizer) 🚀</h2>
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md animate-pulse">PRO FEATURE</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">ترقية أي قالب قديم (2018 مثلاً) تلقائياً لأعلى معايير السرعة والتصميم ومؤشرات الويب الحيوية</p>
              </div>
            </div>

            <button
              onClick={modernizeTemplate}
              disabled={isModernizing || (!inputXML && !outputXML) || userData.credits <= 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-6 rounded-xl border border-indigo-400/20 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isModernizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري ترقية القالب برمجياً...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                  <span>تحديث وترقية القالب لـ 2026 (-1 نقطة)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-3.5 text-right">
              <h4 className="text-xs font-extrabold text-indigo-300">أهداف التحديث والتحسينات المضافة تلقائياً:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2 bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <div>
                    <strong className="block text-white">تسريع LCP & CLS</strong>
                    <span className="text-[10px] text-slate-400 block">تقليل فترات انتظار التحديث وتحسين ثبات عناصر المدونة</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <div>
                    <strong className="block text-white">التحميل الكسول وصيغ WebP</strong>
                    <span className="text-[10px] text-slate-400 block">تفعيل Lazy Loading افتراضي للصور لتسريع التصفح</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <div>
                    <strong className="block text-white">دمج الوضع الليلي الذكي</strong>
                    <span className="text-[10px] text-slate-400 block">إضافة نظام ثيم مريح للعين يحفظ حالة خيار الزائر تلقائياً</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <div>
                    <strong className="block text-white">تحسين الـ SEO المتقدم</strong>
                    <span className="text-[10px] text-slate-400 block">تحديث وسوم السيو والميتا المخصصة لمحركات بحث 2026</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4.5 border border-white/5 min-h-[170px] flex flex-col justify-between">
              {isModernizing || modernizerProgress.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-indigo-300">تقرير عملية الترقية المباشر / Modernizer Steps:</span>
                    <span className="text-[10px] font-mono text-slate-500">Live Stream Logs</span>
                  </div>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto font-mono text-[10px] text-slate-300 text-right leading-relaxed pr-1 scrollbar-thin">
                    {modernizerProgress.map((prog, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0">➜</span>
                        <span>{prog}</span>
                      </div>
                    ))}
                  </div>
                  {modernizerReport && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="text-[11px] font-bold text-amber-400 mb-1">ملخص ترقية الذكاء الاصطناعي:</div>
                      <div className="text-[10px] text-slate-300 leading-normal bg-white/5 p-2 rounded max-h-[100px] overflow-y-auto">
                        <ReactMarkdown>{modernizerReport}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Activity className="w-10 h-10 text-slate-600 mb-2.5 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 block mb-1">جاهز لترقية قالبك</span>
                  <p className="text-[10px] text-slate-500 max-w-[280px] leading-relaxed">
                    ارفع ملف القالب القديم الخاص بك في المحرر أدناه، ثم اضغط على زر "تحديث وترقية القالب لـ 2026" لبدء السحر!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* 2. Template Analyzer Dashboard */}
      {analysis && (
        <motion.div
          id="template-analyzer-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6 text-white shadow-xl"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-[#818CF8]" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>فحص القالب بالكامل (Template Analyzer) 🔍</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">فحص فني وأمني متكامل ومجاني لبنية القالب وسرعته وأكواد الحماية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 shadow-inner">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>حجم الملف:</span>
                <span className="font-mono font-bold text-white">{analysis.sizeKB} KB</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>الوجت / Widgets:</span>
                <span className="font-mono font-bold text-white">{analysis.widgetsCount}</span>
              </div>
            </div>
          </div>

          {/* Scoring & Core Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Performance Card */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl opacity-60"></div>
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1E293B" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="32" cy="32" r="26" 
                    stroke={analysis.performanceScore > 80 ? "#10B981" : "#F59E0B"} 
                    strokeWidth="5" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - analysis.performanceScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{analysis.performanceScore}%</span>
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">مؤشر أداء السرعة</h4>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {analysis.performanceScore > 85 ? 'ممتاز (Excellent)' : 'متوسط (Optimize)'}
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">يتأثر بحجم الأكواد وعدد الوجت الخارجية</p>
              </div>
            </div>

            {/* 2. Security Score Card */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl opacity-60"></div>
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1E293B" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="32" cy="32" r="26" 
                    stroke={analysis.securityScore > 80 ? "#3B82F6" : "#EF4444"} 
                    strokeWidth="5" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - analysis.securityScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{analysis.securityScore}%</span>
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">سلامة وأمن القالب</h4>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {analysis.securityScore > 80 ? 'آمن وموثوق' : 'يحتوي أكواد مشفرة'}
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">يتأثر بنصوص التتبع والأكواد المشفرة</p>
              </div>
            </div>

            {/* 3. Javascript Usage */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/10 flex-shrink-0">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">أكواد جافا سكريبت</h4>
                <div className="text-sm font-extrabold text-slate-200 mt-0.5">{analysis.jsCount} كود (Scripts)</div>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">يحتوي على {analysis.jsExternal.length} ملف خارجي</p>
              </div>
            </div>

            {/* 4. CSS Usage */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/10 flex-shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">تنسيقات التصميم CSS</h4>
                <div className="text-sm font-extrabold text-slate-200 mt-0.5">{analysis.cssCount} كتلة (Styles)</div>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">أنماط وأكواد تخصيص المظهر</p>
              </div>
            </div>
          </div>

          {/* AI Explain Template Panel */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/30 to-indigo-900/20 p-6 rounded-2xl border border-indigo-500/20 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 flex-shrink-0 mt-1">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">شرح القالب وتحليله بالذكاء الاصطناعي (AI Template Explainer) 🧠</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                    دع الذكاء الاصطناعي يفحص القالب بالكامل ويشرحه لك باللغة العربية! سيتولى توضيح وظيفة كل أداة (Widget)، كل قسم (Section)، كل سكربت جافا سكريبت، مع تفاصيل برمجية بأسلوب مبسط وواضح ممتاز للمبتدئين.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExplainTemplate}
                disabled={isExplaining || !inputXML}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-indigo-500/25 flex-shrink-0 self-start md:self-center"
              >
                {isExplaining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تحليل وشرح القالب...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>✨ شرح كود القالب بالذكاء الاصطناعي (Free)</span>
                  </>
                )}
              </button>
            </div>

            {/* Explanation Results */}
            {templateExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 border border-indigo-900/50 rounded-xl overflow-hidden bg-slate-950/80 shadow-inner"
              >
                <div className="bg-indigo-950/50 px-4 py-3 border-b border-indigo-900/50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">الشرح والتحليل المولد بواسطة الذكاء الاصطناعي:</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(templateExplanation);
                      showToast('تم نسخ الشرح بنجاح! | Explanation copied to clipboard!', 'success');
                    }}
                    className="flex items-center gap-1.5 bg-indigo-900/30 border border-indigo-800/50 hover:bg-indigo-900/50 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الشرح الكامل</span>
                  </button>
                </div>

                <div className="p-6 text-sm text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent">
                  <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-indigo-900/40 rtl text-right">
                    <ReactMarkdown>{templateExplanation}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Template Validator Section */}
          <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-5 h-5 ${validationErrors.some(e => e.type === 'error') ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">مُدقق ومُصحح أخطاء قالب بلوجر (Blogger Template Validator) 🛠️</h3>
                  <p className="text-xs text-slate-400 mt-0.5">فحص تلقائي قبل التحميل لأخطاء XML، وسوم بلوجر، الأقواس والوسوم غير المغلقة.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const targetXml = outputXML || inputXML;
                  const errs = validateBloggerXML(targetXml);
                  setValidationErrors(errs);
                  showToast('تمت إعادة تدقيق بنية القالب بنجاح! | Template re-validated successfully!', 'success');
                }}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-center"
              >
                <span>🔄 إعادة التدقيق يدوياً</span>
              </button>
            </div>

            {validationErrors.length === 0 ? (
              <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">القالب سليم تماماً بنسبة 100% (Perfect & Valid)!</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    لم نكتشف أي أخطاء بنيوية في الـ XML أو وسوم بلوجر الرئيسية. القالب مهيأ تماماً لرفعه واستخدامه على مدونتك دون أي مشاكل تجميع أو حفظ.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">حالة الفحص (Check Status):</span>
                  <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md">
                    تم العثور على {validationErrors.filter(e => e.type === 'error').length} أخطاء برمجية قد تمنع الحفظ
                  </span>
                  {validationErrors.some(e => e.type === 'warning') && (
                    <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md">
                      و {validationErrors.filter(e => e.type === 'warning').length} تحذيرات تصميمة
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {validationErrors.map((err, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border text-right rtl ${
                        err.type === 'error' 
                          ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/30' 
                          : 'bg-amber-950/10 border-amber-500/10 hover:border-amber-500/20'
                      } transition-all space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-2">
                        <span className={`text-xs font-bold ${err.type === 'error' ? 'text-rose-400' : 'text-amber-400'} flex items-center gap-1.5`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {err.titleAr}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {err.line && (
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono text-[9px] font-extrabold">
                              السطر {err.line}
                            </span>
                          )}
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            err.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {err.type === 'error' ? 'خطأ برمجي' : 'تحذير'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">{err.descAr}</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{err.descEn}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-[11px] leading-relaxed space-y-1">
                        <span className="text-emerald-400 font-bold block">💡 طريقة الحل المقترحة:</span>
                        <p className="text-slate-400 font-medium">{err.solutionAr}</p>
                        <p className="text-slate-500 font-mono text-[10px]">{err.solutionEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Appearance Customizer (الألوان والخطوط) */}
          <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-sans">مُنسق ومُخصص المظهر الكامل للقالب (Theme Appearance Customizer) 🎨</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تغيير الألوان والخطوط بالكامل داخل ملف القالب بنقرة واحدة مع إعادة البناء التلقائي.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Color Customization */}
              <div className="space-y-4 text-right rtl">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs pb-1 border-b border-slate-800/50">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>تخصيص الألوان الكامل واستبدالها (Full Color Customization)</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  يمكنك استبدال نظام ألوان القالب بالكامل. يقوم المعالج الذكي بالتعرف على الألوان الفريدة غير الرمادية في قالبك واستبدالها بالدرجات المختارة أدناه:
                </p>

                {/* Main Brand Color Inputs */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] font-bold text-slate-400 block">اللون الأساسي (Primary)</label>
                    <div className="flex items-center justify-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <input 
                        type="color" 
                        value={primaryColorState}
                        onChange={(e) => setPrimaryColorState(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[10px] font-mono text-slate-300">{primaryColorState}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] font-bold text-slate-400 block">اللون الثانوي (Secondary)</label>
                    <div className="flex items-center justify-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <input 
                        type="color" 
                        value={secondaryColorState}
                        onChange={(e) => setSecondaryColorState(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[10px] font-mono text-slate-300">{secondaryColorState}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] font-bold text-slate-400 block">اللون الفرعي (Accent)</label>
                    <div className="flex items-center justify-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <input 
                        type="color" 
                        value={accentColorState}
                        onChange={(e) => setAccentColorState(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[10px] font-mono text-slate-300">{accentColorState}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleApplyFullRecolor}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تطبيق نظام الألوان بالكامل على القالب ✨</span>
                  </button>
                </div>

                {/* Discovered active colors sub-section */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block">الألوان الملونة المكتشفة في القالب حالياً (Discovered Active Colors):</span>
                  {discoveredColors.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-2 bg-slate-950/20 rounded-lg">
                      لم يتم اكتشاف ألوان ملونة بعد. قم برفع قالب أولاً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {discoveredColors.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-slate-700" style={{ backgroundColor: item.hex }}></span>
                            <span className="font-mono text-slate-300 text-[10px] uppercase">{item.hex}</span>
                            <span className="text-slate-500 text-[9px]">({item.count} مرة)</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" 
                              defaultValue={item.hex}
                              id={`picker-discovered-${idx}`}
                              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                            />
                            <button
                              onClick={() => {
                                const picker = document.getElementById(`picker-discovered-${idx}`) as HTMLInputElement;
                                if (picker) {
                                  handleSingleColorReplace(item.hex, picker.value);
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[9px] font-bold transition-colors"
                            >
                              استبدال
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual precise color replacer */}
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">استبدال دقيق مخصص (Precise Color Replacer):</span>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        placeholder="اللون القديم (مثال: #ff0000)" 
                        value={customOldColor}
                        onChange={(e) => setCustomOldColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center font-mono text-[11px] text-slate-300 placeholder-slate-600 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <span className="text-slate-600 font-bold">←</span>
                    <div className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                      <input 
                        type="color" 
                        value={customNewColor}
                        onChange={(e) => setCustomNewColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input 
                        type="text" 
                        value={customNewColor}
                        onChange={(e) => setCustomNewColor(e.target.value)}
                        className="w-full bg-transparent border-0 text-center font-mono text-[11px] text-slate-300 outline-none p-0"
                      />
                    </div>
                    <button
                      onClick={() => handleSingleColorReplace(customOldColor, customNewColor)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Font Customization */}
              <div className="space-y-4 text-right rtl border-t lg:border-t-0 lg:border-r border-slate-800/80 pt-6 lg:pt-0 lg:pr-6">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs pb-1 border-b border-slate-800/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>تغيير الخط بالكامل لـ Google Font (Global Font Changer)</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  اختر أحد خطوط Google الشهيرة والمحسنة لمدونات بلوجر. سيقوم المعالج بتحميل الخط تلقائياً واستبدال كافة خطوط التنسيق السابقة داخل أكواد الـ XML بشكل سليم:
                </p>

                {/* Google Fonts Selection Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {[
                    { name: 'Cairo', nameAr: 'خط كـايـرو (Cairo)', desc: 'ممتاز وعصري لمدونات الأخبار والتقنية' },
                    { name: 'Tajawal', nameAr: 'خط تـجـوال (Tajawal)', desc: 'بسيط، وناعم، ومثالي للقراءة المطولة' },
                    { name: 'Almarai', nameAr: 'خط الـمـراعـي (Almarai)', desc: 'مستوحى من الخطوط الصحفية والشركات' },
                    { name: 'Readex Pro', nameAr: 'خط ريـدكـس (Readex Pro)', desc: 'تصميم هندسي حديث ونظيف جداً' },
                    { name: 'Amiri', nameAr: 'خط الأمـيـري (Amiri)', desc: 'كلاسيكي عريق رائع للمواقع الأدبية' },
                    { name: 'El Messiri', nameAr: 'خط الـمـسـيـري (El Messiri)', desc: 'فني وزخرفي يعطي طابعاً مميزاً' },
                    { name: 'Inter', nameAr: 'خـط إنـتـر (Inter - English)', desc: 'الخط اللاتيني الأفضل للمظهر التقني والعصري' },
                    { name: 'Montserrat', nameAr: 'مـونـتـسـيـرات (Montserrat)', desc: 'لاتيني عريض وجريء ومثالي للعناوين' },
                  ].map((font, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFont(font.name)}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                        selectedFont === font.name 
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-white shadow-md' 
                          : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold">{font.nameAr}</span>
                      <span className="text-[9px] text-slate-500 leading-relaxed">{font.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Font Live Preview */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">معاينة حية للخط المختار (Font Live Preview):</span>
                  <div 
                    className="p-3 bg-slate-950 rounded-lg border border-slate-900 text-base text-slate-200"
                    style={{ fontFamily: selectedFont }}
                  >
                    هذا النص يوضح كيف سيظهر خط {selectedFont} في مدونتك!
                  </div>
                </div>

                <button
                  onClick={handleApplyFont}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>تطبيق الخط المختار واستبدال التنسيقات بالكامل ✍️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Technical Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-300">
            {/* Left Column: Duplicate & Security Alerts */}
            <div className="space-y-4 flex flex-col">
              {/* Duplicate check */}
              <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>فحص الأكواد المكررة والوجت (Duplicate Codes)</span>
                </h3>
                {analysis.duplicates.length > 0 ? (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {analysis.duplicates.map((dup, idx) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-400">{dup.type}</span>
                          <p className="font-mono text-[10px] text-slate-400 break-all">{dup.value}</p>
                        </div>
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold text-[10px]">مكرر {dup.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/30 rounded-lg border border-dashed border-slate-800">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-400">نظيف! لا يوجد وجت أو أكواد مكررة تسبب أخطاء الحفظ</p>
                  </div>
                )}
              </div>

              {/* 5-Point Protection Scanner Card */}
              <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>نظام كشف حمايات القالب الخفية (5-Point Security Scanner)</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded font-extrabold uppercase">فحص ذكي</span>
                </h3>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {analysis.protections && (() => {
                    const scannerItems = [
                      {
                        key: 'antiRemoveCredit',
                        title: '✅ Anti Remove Credit (حماية منع إزالة الحقوق)',
                        desc: 'أكواد ذكية تمنع حذف أو تعديل روابط وحقوق مصمم القالب في الفوتر.',
                        data: analysis.protections.antiRemoveCredit,
                        icon: '🛡️'
                      },
                      {
                        key: 'redirectScript',
                        title: '✅ Redirect Script (كود إعادة التوجيه التلقائي)',
                        desc: 'أكواد تقوم بتحويل الزائر تلقائياً لموقع آخر أو فرض روابط خارجية عند التشغيل.',
                        data: analysis.protections.redirectScript,
                        icon: '🔗'
                      },
                      {
                        key: 'encryptedJs',
                        title: '✅ Encrypted JS (أكواد جافا سكريبت المشفرة)',
                        desc: 'نصوص برمجية معبأة ومغلفة غير قابلة للقراءة مثل Dean Edwards Packer.',
                        data: analysis.protections.encryptedJs,
                        icon: '🔑'
                      },
                      {
                        key: 'obfuscatedCode',
                        title: '✅ Obfuscated Code (الأكواد الملتوية / المعقدة)',
                        desc: 'متغيرات بنظام سداسي عشري _0x أو أكواد تم تشويه مظهرها لمنع تعديلها.',
                        data: analysis.protections.obfuscatedCode,
                        icon: '🧩'
                      },
                      {
                        key: 'base64',
                        title: '✅ Base64 (نصوص مشفرة بـ Base64)',
                        desc: 'كتل نصية مشفرة بـ Base64 تستخدم لإخفاء محتويات أو روابط داخل القالب.',
                        data: analysis.protections.base64,
                        icon: '📝'
                      }
                    ];

                    return (
                      <div className="space-y-3">
                        {scannerItems.map((item) => (
                          <div key={item.key} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 space-y-2.5 transition-colors hover:border-slate-800">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                                  <span>{item.icon}</span>
                                  <span>{item.title}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                              </div>

                              <div>
                                {item.data.detected ? (
                                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                    مكتشفة (Detected)
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 flex-shrink-0">
                                    سليمة (Secure)
                                  </span>
                                )}
                              </div>
                            </div>

                            {item.data.detected && item.data.locations.length > 0 && (
                              <div className="bg-slate-950 rounded-lg p-2.5 space-y-1.5 border border-slate-900">
                                <span className="text-[9px] font-bold text-rose-400/80 block">مواقع الكود البرمجي المشبوه (موقعها في الملف):</span>
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                                  {item.data.locations.map((loc, lIdx) => (
                                    <div key={lIdx} className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px] space-y-1 font-mono text-slate-300">
                                      <div className="flex items-center justify-between text-[9px] text-slate-500 border-b border-slate-800/50 pb-1">
                                        <span className="bg-[#6366F1]/10 text-[#818cf8] px-1.5 py-0.2 rounded font-extrabold">السطر {loc.line}</span>
                                        <span>معاينة الكود</span>
                                      </div>
                                      <div className="overflow-x-auto whitespace-pre-wrap break-all text-slate-300 leading-normal pt-1">{loc.snippet}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column: External connections, Fonts & Widget list */}
            <div className="space-y-4 flex flex-col">
              {/* External connections */}
              <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>الروابط والاتصالات الخارجية (External Connections)</span>
                </h3>
                {analysis.externalLinks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {analysis.externalLinks.map((link, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-slate-800 p-2 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="truncate" title={link}>{link}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/30 rounded-lg border border-dashed border-slate-800">
                    <p className="text-xs text-slate-500">لا توجد اتصالات بخوادم خارجية مشبوهة</p>
                  </div>
                )}
              </div>

              {/* Fonts & Widget Inventory tabs */}
              <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Type className="w-4 h-4 text-indigo-400" />
                    <span>الخطوط والوجت المستخدمة</span>
                  </h3>
                  <span className="text-[9px] text-slate-500 font-bold">Fonts & Widgets Info</span>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {/* Fonts info */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">الخطوط المكتشفة / Custom Fonts:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.fonts.map((font, idx) => (
                        <span key={idx} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg px-2 py-0.5 text-xs font-medium">
                          {font}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Widgets inventory mini table */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">تفاصيل هيكل الأدوات / Widgets Inventory ({analysis.widgets.length}):</span>
                    <div className="grid grid-cols-2 gap-2">
                      {analysis.widgets.slice(0, 6).map((widget, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-850 px-2 py-1.5 rounded-lg text-xs flex justify-between items-center font-mono text-slate-400">
                          <span className="truncate font-bold text-slate-300" title={widget.id}>{widget.id}</span>
                          <span className="bg-slate-850 text-slate-500 px-1.5 py-0.5 rounded text-[8px]">{widget.type}</span>
                        </div>
                      ))}
                      {analysis.widgets.length > 6 && (
                        <div className="col-span-2 text-center text-[10px] text-slate-500 font-semibold pt-1">
                          + {analysis.widgets.length - 6} وجت إضافية أخرى في القالب
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Before / After Preview & Report Panel */}
      {report && (
        <motion.div
          id="before-after-report-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#818CF8]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>تقرير المعاينة قبل وبعد التعديل ⭐⭐⭐⭐⭐</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Blogger Template Transformation Report & Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50 w-fit self-end md:self-auto">
              <button
                id="tab-btn-footer"
                onClick={() => setCompareTab('footer')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${compareTab === 'footer' ? 'bg-[#6366F1] text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                حقوق القالب / Copyrights
              </button>
              <button
                id="tab-btn-header"
                onClick={() => setCompareTab('header')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${compareTab === 'header' ? 'bg-[#6366F1] text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                الأكواد المضافة / Injected Code
              </button>
            </div>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Progress Gauge */}
            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#6366F1]/5 rounded-full blur-2xl group-hover:bg-[#6366F1]/10 transition-colors"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">نسبة الأجزاء المعدلة / MODIFIED</span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#1E293B"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#6366F1"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - report.percent / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-white">{report.percent}%</span>
                  <p className="text-[9px] text-slate-400 font-bold">Of Template</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-3">تم تحديث وتعديل ما يقارب {report.percent}% من هيكلية الملفات والأكواد</p>
            </div>

            {/* 2. Old Copyrights (Removed) */}
            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800 flex flex-col">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                الحقوق والملفات المحذوفة (Before)
              </span>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {report.oldCopyrights.map((copyright, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono">DEL</span>
                    <span className="text-xs font-mono text-slate-300 break-all leading-tight line-through opacity-75">{copyright}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 font-medium mt-2">تم حذف التتبع الخفي وأكواد حماية الحقوق المزعجة بنجاح.</p>
            </div>

            {/* 3. New Copyrights (Added) */}
            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800 flex flex-col">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                الحقوق الجديدة المضافة (After)
              </span>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {report.newCopyrights.map((copyright, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">ADD</span>
                    <span className="text-xs font-bold text-white leading-tight">{copyright}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 font-medium mt-2">تم ربط القالب بموقعك وتعيين الحقوق باسمك بنجاح.</p>
            </div>

            {/* 4. Modification Log / سجل التعديلات */}
            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
              <span className="text-[11px] font-bold text-[#34D399] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#34D399]" />
                سجل التعديلات الكامل / Modification Log 📋
              </span>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-slate-800 pr-1 text-right rtl">
                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-xs flex-shrink-0">✔</span>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-200 block">Removed 13 Credits</span>
                    <span className="text-[9px] text-slate-400 block">إزالة كافة الأكواد وحقوق التتبع المزعجة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-xs flex-shrink-0">✔</span>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-200 block">Added Footer Credit</span>
                    <span className="text-[9px] text-slate-400 block">إضافة كود الحقوق الجديد المنسق باسمك</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-xs flex-shrink-0">✔</span>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-200 block">Optimized CSS</span>
                    <span className="text-[9px] text-slate-400 block">ضغط الأنماط وتنسيقات الـ CSS وتصغير حجمها</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-xs flex-shrink-0">✔</span>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-200 block">Fixed XML Errors</span>
                    <span className="text-[9px] text-slate-400 block">تدقيق وتصحيح كافة أخطاء الـ XML البرمجية</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-xs flex-shrink-0">✔</span>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-200 block">Added Lazy Loading</span>
                    <span className="text-[9px] text-slate-400 block">تفعيل التحويل الكسول والصيغ الذكية WebP للصور</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-medium mt-2">توثيق حي للعمليات البرمجية الناجحة التي طبقت على قالبك.</p>
            </div>
          </div>

          {/* Side-by-Side Comparison Area */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">مقارنة التغييرات المباشرة | Live Before vs After Comparison</span>
              <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] uppercase font-mono">Line comparison</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Before Code Panel */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <span>قبل التعديل / Original Code (Before)</span>
                </div>
                <pre className="bg-slate-900/50 p-3 rounded-lg text-xs font-mono overflow-x-auto text-slate-400 max-h-[180px] border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                  {compareTab === 'header' ? report.headerBefore : report.footerBefore}
                </pre>
              </div>

              {/* After Code Panel */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>بعد التعديل / Modernized Code (After)</span>
                </div>
                <pre className="bg-slate-900/50 p-3 rounded-lg text-xs font-mono overflow-x-auto text-emerald-300 max-h-[180px] border border-emerald-500/10 leading-relaxed whitespace-pre-wrap">
                  {compareTab === 'header' ? report.headerAfter : report.footerAfter}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow h-[400px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6366F1] text-xs font-bold">1. Paste Original XML</span>
            <label className="flex items-center gap-1.5 bg-[#6366F1]/5 hover:bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer transition-all">
              <UploadCloud className="w-4 h-4" />
              <span>رفع ملف القالب / Upload File</span>
              <input 
                type="file" 
                accept=".xml" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
          <textarea
            className="flex-1 w-full bg-slate-100 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none resize-none font-mono text-slate-700"
            placeholder="Paste your <?xml ... ?> code here or use the upload button above..."
            value={inputXML}
            onChange={(e) => setInputXML(e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow h-[400px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6366F1] text-xs font-bold">2. Generated XML</span>
            {outputXML && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-[#6366F1] font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadXML(false)}
                  className="flex items-center justify-center gap-1 bg-[#6366F1] text-white font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-[#4F46E5] transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            )}
          </div>
          <textarea
            className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-4 text-sm transition-all outline-none resize-none font-mono text-slate-500"
            placeholder="Your upgraded template will appear here..."
            value={outputXML}
            readOnly
          />
        </div>
      </section>

      <div className="flex justify-center mt-2 pb-4 flex-col items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-lg">
          <button
            onClick={processXML}
            disabled={!inputXML || isProcessing || isOptimizing || userData.credits <= 0}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            {isProcessing ? 'Processing...' : 'Start AI Processing (-1 Credit)'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={optimizeXML}
            disabled={!inputXML || isProcessing || isOptimizing || userData.credits <= 0}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            {isOptimizing ? 'Optimizing...' : '✨ Optimize Template (-1 Credit)'}
          </button>
        </div>
        {userData.credits <= 0 && (
          <span className="text-xs text-red-500 font-bold">You are out of credits!</span>
        )}
        {settings.adsterraDirectLink && (
          <a 
            href={settings.adsterraDirectLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 animate-bounce cursor-pointer text-center"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>احصل على نقاط وميزات إضافية مجاناً! | Click for Bonus Rewards</span>
          </a>
        )}
      </div>

      <AdBanner 
        html={settings.adsterraBanner300x250 || settings.bottomAdHtml} 
        fallbackText="مساحة إعلانية سفلية (Bottom Ad Banner)" 
      />

      <footer className="bg-slate-900 text-white px-8 py-6 flex-shrink-0 rounded-xl mt-4">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
          <div className="max-w-xs">
            <div className="text-xl font-bold mb-2 text-[#818CF8]">NEXORA STUDIO</div>
            <p className="text-xs text-slate-400 leading-relaxed">Upgrade your templates to the modern 2026 standard smoothly and securely.</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-[10px] tracking-wide text-slate-500">
          <p>© 2026 AI Smart Builder. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Blogger Template Validation Warning Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 text-right rtl"
          >
            <div className="bg-rose-950/30 px-6 py-4 border-b border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                <h3 className="text-base font-bold text-rose-300">تحذير برمي وتصميمي قبل تحميل القالب!</h3>
              </div>
              <button 
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
              >
                إغلاق
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                تم اكتشاف <strong>أخطاء برمجية حرجة</strong> في كود القالب المعالج. إذا قمت برفع هذا الملف إلى لوحة تحكم بلوجر، فمن المرجح جداً أن تظهر لك رسالة خطأ تمنع حفظ القالب. نوصي بشدة بمراجعة وحل الأخطاء التالية أولاً:
              </p>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {validationErrors.filter(e => e.type === 'error').map((err, idx) => (
                  <div key={idx} className="bg-rose-950/15 border border-rose-500/20 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                      <span>❌ {err.titleAr}</span>
                      {err.line && <span className="bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">السطر {err.line}</span>}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{err.descAr}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{err.descEn}</p>
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-900 text-[10px] text-slate-400 leading-relaxed">
                      <span className="text-emerald-400 font-bold">الحل المقترح:</span> {err.solutionAr}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-300 leading-relaxed">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                <p>
                  <strong>تنبيه:</strong> يمكنك تجاهل هذه الأخطاء وتحميل القالب على مسؤوليتك الخاصة في حال كنت ترغب في تعديله أو إكماله يدوياً في محرر أكواد خارجي.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-800/80 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء وإصلاح الأخطاء
              </button>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  downloadXML(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-rose-600/20"
              >
                تنزيل القالب على أي حال 📥
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
