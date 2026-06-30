import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings } from '../../types/admin';
import { Save, Globe, Code, HelpCircle, Sparkles, Megaphone, CheckCircle2 } from 'lucide-react';

export default function AdsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    toolEnabled: true,
    heroTitle: 'AI Watermark Remover',
    heroSubtitle: 'Remove watermarks instantly with our advanced AI.',
    primaryColor: '#4f46e5',
    adsterraPopunder: '',
    adsterraSocialBar: '',
    adsterraDirectLink: '',
    adsterraBanner728x90: '',
    adsterraBanner300x250: '',
    popadsPopunder: '',
    monetagPopunder: '',
    monetagVignette: '',
    customHeaderCode: '',
    customFooterCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'adsterra' | 'popads' | 'monetag' | 'custom'>('adsterra');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        setSettings(prev => ({ ...prev, ...snap.data() }));
      }
    } catch (error) {
      console.error("Error fetching ads settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving ads settings:", error);
      alert('فشل في حفظ الإعدادات / Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Megaphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-850">إدارة الإعلانات والربح | Ads & Revenue Manager</h2>
            <p className="text-xs text-slate-500">تحكم بجميع الأكواد والبنرات الإعلانية في مكان واحد لزيادة أرباح موقعك.</p>
          </div>
        </div>
        <button 
          onClick={saveSettings} 
          disabled={saving} 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : 'حفظ الإعلانات / Save Ads'}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in text-right" dir="rtl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ جميع إعدادات الإعلانات بنجاح! وسوف تظهر للزوار فوراً.</span>
        </div>
      )}

      {/* Ad Networks Configuration Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Selection */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 flex gap-2 overflow-x-auto">
          <button 
            type="button"
            onClick={() => setActiveTab('adsterra')}
            className={`py-4 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'adsterra' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
            Adsterra Network
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('popads')}
            className={`py-4 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'popads' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            PopAds Network
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('monetag')}
            className={`py-4 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'monetag' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <span className="inline-block w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
            Monetag / PropellerAds
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-4 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'custom' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <span className="inline-block w-2.5 h-2.5 bg-slate-600 rounded-full"></span>
            Custom Scripts (Header/Footer)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'adsterra' && (
            <div className="space-y-6 animate-fade-in text-right" dir="rtl">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-amber-900">
                <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block mb-1">تعليمات إعلانات Adsterra:</span>
                  قم بإنشاء حساب في Adsterra وأضف موقعك، ثم أنشئ الأكواد الإعلانية المطلوبة والصقها في الحقول التالية. سيتم تشغيل هذه الإعلانات تلقائياً على جميع صفحات الموقع لزيادة العائد المالي.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Adsterra Popunder Code (أكواد النوافذ المنبثقة)</label>
                  <textarea 
                    value={settings.adsterraPopunder || ''} 
                    onChange={e => setSettings({...settings, adsterraPopunder: e.target.value})} 
                    placeholder="<!-- Paste Popunder Javascript code here -->"
                    className="w-full h-28 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Adsterra Social Bar Code (إعلان شريط اجتماعي)</label>
                  <textarea 
                    value={settings.adsterraSocialBar || ''} 
                    onChange={e => setSettings({...settings, adsterraSocialBar: e.target.value})} 
                    placeholder="<!-- Paste Social Bar Javascript code here -->"
                    className="w-full h-28 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <label className="block text-xs font-bold text-slate-700 text-left" dir="ltr">Adsterra Direct Link (الرابط المباشر للمهام / المكافآت)</label>
                  </div>
                  <input 
                    type="url"
                    value={settings.adsterraDirectLink || ''} 
                    onChange={e => setSettings({...settings, adsterraDirectLink: e.target.value})} 
                    placeholder="https://www.highperformanceformat.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">عند إضافة هذا الرابط، سيظهر زر متحرك ملفت للانتباه في صفحة تصفح الأداة يشجع المستخدمين على النقر مقابل نقاط ومكافآت.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Adsterra Banner 728x90 (بنر علوي للموقع)</label>
                  <textarea 
                    value={settings.adsterraBanner728x90 || ''} 
                    onChange={e => setSettings({...settings, adsterraBanner728x90: e.target.value})} 
                    placeholder="<!-- Paste Banner 728x90 HTML code -->"
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Adsterra Banner 300x250 (بنر مربع سفلي)</label>
                  <textarea 
                    value={settings.adsterraBanner300x250 || ''} 
                    onChange={e => setSettings({...settings, adsterraBanner300x250: e.target.value})} 
                    placeholder="<!-- Paste Banner 300x250 HTML code -->"
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'popads' && (
            <div className="space-y-6 animate-fade-in text-right" dir="rtl">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-red-950">
                <HelpCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block mb-1">تعليمات إعلانات PopAds:</span>
                  تعتبر شبكة PopAds رائدة في مجال إعلانات البوب اندر (النوافذ المنبثقة الخلفية). الصق الكود البرمجي الذي تحصل عليه من لوحة التحكم في PopAds أدناه، وسيبدأ فوراً بالعمل وجلب الأرباح لجميع الصفحات.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">PopAds Popunder Code</label>
                <textarea 
                  value={settings.popadsPopunder || ''} 
                  onChange={e => setSettings({...settings, popadsPopunder: e.target.value})} 
                  placeholder="<!-- Paste PopAds Website Code Here -->"
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {activeTab === 'monetag' && (
            <div className="space-y-6 animate-fade-in text-right" dir="rtl">
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-sky-950">
                <HelpCircle className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block mb-1">تعليمات Monetag (PropellerAds):</span>
                  شبكة Monetag ممتازة لشركات الهواتف النقالة والزيارات العالمية. يمكنك تفعيل كود البوب اندر أو كود الفينيت (Vignette script) الذي يتميز بظهور إعلان تغطية كاملة الصفحة عند تصفح المستخدم.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Monetag Popunder/Onclick Code</label>
                  <textarea 
                    value={settings.monetagPopunder || ''} 
                    onChange={e => setSettings({...settings, monetagPopunder: e.target.value})} 
                    placeholder="<!-- Paste Monetag smarttag or onclick code -->"
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Monetag Vignette Banner Code</label>
                  <textarea 
                    value={settings.monetagVignette || ''} 
                    onChange={e => setSettings({...settings, monetagVignette: e.target.value})} 
                    placeholder="<!-- Paste Monetag vignette code -->"
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6 animate-fade-in text-right" dir="rtl">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-slate-800">
                <HelpCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block mb-1">أكواد حقن مخصصة | Custom Injections:</span>
                  تتيح لك هذه الميزة وضع أي أكواد تتبع أو إعلانات تابعة لشركات أخرى (مثل Google AdSense, ExoClick, HilltopAds, PopCash) مباشرة في جميع الصفحات.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Custom Header Code (أكواد داخل وسم &lt;head&gt;)</label>
                  <textarea 
                    value={settings.customHeaderCode || ''} 
                    onChange={e => setSettings({...settings, customHeaderCode: e.target.value})} 
                    placeholder="<!-- Add Google Analytics, Custom Meta tags or Styles here -->"
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-left" dir="ltr">Custom Footer Code (أكواد قبل إغلاق وسم &lt;/body&gt;)</label>
                  <textarea 
                    value={settings.customFooterCode || ''} 
                    onChange={e => setSettings({...settings, customFooterCode: e.target.value})} 
                    placeholder="<!-- Add chat widgets, tracker scripts or body scripts here -->"
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
