import React, { useState, useEffect } from 'react';
import { ArrowRight, Download, Copy, CheckCircle2, Sparkles, Settings2, MonitorPlay, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../App';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';

interface ToolProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export default function Tool({ userData, setUserData }: ToolProps) {
  const [inputXML, setInputXML] = useState('');
  const [outputXML, setOutputXML] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorUrl, setCreatorUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({ topAdHtml: '', bottomAdHtml: '', toolEnabled: true });

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
      setError('You do not have enough credits to perform this operation. Please contact the administrator.');
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
    } catch (err: any) {
      setError('An error occurred during processing: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputXML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadXML = () => {
    const blob = new Blob([outputXML], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${creatorName.toLowerCase().replace(/\\s+/g, '-') || 'dark-storm'}-theme.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-6">
      {settings.topAdHtml ? (
        <div className="w-full flex justify-center my-2" dangerouslySetInnerHTML={{ __html: settings.topAdHtml }}></div>
      ) : (
        <div className="w-full h-[90px] bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 font-bold shadow-inner relative overflow-hidden group">
          <MonitorPlay className="w-6 h-6 mb-1 text-slate-400 group-hover:text-[#6366F1] transition-colors" />
          <span className="text-xs uppercase tracking-widest group-hover:text-[#6366F1] transition-colors">مساحة إعلانية (Top Banner)</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
        </div>
      )}

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

      <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-3 w-full md:w-1/4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
           <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
             <Settings2 className="w-5 h-5 text-[#6366F1]" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-slate-800">Your Rights</h3>
             <p className="text-xs text-slate-500">Configure your branding</p>
           </div>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Creator / Admin Name</label>
            <input 
              type="text" 
              value={creatorName} 
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Ahmed, Dark Storm, etc."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Website / Social Link</label>
            <input 
              type="url" 
              value={creatorUrl} 
              onChange={(e) => setCreatorUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow h-[400px]">
          <span className="text-[#6366F1] text-xs font-bold mb-3">1. Paste Original XML</span>
          <textarea
            className="flex-1 w-full bg-slate-100 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-[#6366F1] transition-all outline-none resize-none font-mono"
            placeholder="Paste your <?xml ... ?> code here..."
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
                  onClick={downloadXML}
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
        <button
          onClick={processXML}
          disabled={!inputXML || isProcessing || userData.credits <= 0}
          className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Start AI Processing (-1 Credit)'}
          <ArrowRight className="w-5 h-5" />
        </button>
        {userData.credits <= 0 && (
          <span className="text-xs text-red-500 font-bold">You are out of credits!</span>
        )}
      </div>

      {settings.bottomAdHtml ? (
        <div className="w-full flex justify-center my-4" dangerouslySetInnerHTML={{ __html: settings.bottomAdHtml }}></div>
      ) : (
        <div className="w-full h-[120px] bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 font-bold shadow-inner relative overflow-hidden group">
          <MonitorPlay className="w-6 h-6 mb-1 text-slate-400 group-hover:text-[#6366F1] transition-colors" />
          <span className="text-xs uppercase tracking-widest group-hover:text-[#6366F1] transition-colors">مساحة إعلانية (Bottom Ad)</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
        </div>
      )}

      <footer className="bg-slate-900 text-white px-8 py-6 flex-shrink-0 rounded-xl mt-4">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
          <div className="max-w-xs">
            <div className="text-xl font-bold mb-2 text-[#818CF8]">AI BUILDER</div>
            <p className="text-xs text-slate-400 leading-relaxed">Upgrade your templates to the modern 2026 standard smoothly and securely.</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-[10px] tracking-wide text-slate-500">
          <p>© 2026 AI Smart Builder. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
