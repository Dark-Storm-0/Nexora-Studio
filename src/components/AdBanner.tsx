import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  html?: string;
  fallbackText?: string;
}

export default function AdBanner({ html, fallbackText }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!html || !containerRef.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. First, append all non-script elements
    const nonScripts = Array.from(tempDiv.childNodes).filter(node => node.nodeName !== 'SCRIPT');
    nonScripts.forEach(node => {
      containerRef.current?.appendChild(node.cloneNode(true));
    });

    // 2. Next, dynamically execute script elements sequentially
    const scripts = Array.from(tempDiv.getElementsByTagName('script'));
    
    // We load them one by one to preserve execution order (crucial for option configs)
    const loadScript = (index: number) => {
      if (index >= scripts.length) return;
      const s = scripts[index];
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(s.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      if (s.src) {
        newScript.src = s.src;
        newScript.onload = () => loadScript(index + 1);
        newScript.onerror = () => loadScript(index + 1);
      } else {
        newScript.innerHTML = s.innerHTML;
        containerRef.current?.appendChild(newScript);
        loadScript(index + 1);
      }

      if (s.src) {
        containerRef.current?.appendChild(newScript);
      }
    };

    loadScript(0);
  }, [html]);

  if (!html) {
    return (
      <div className="w-full h-[90px] bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 font-bold shadow-inner relative overflow-hidden group">
        <span className="text-xs uppercase tracking-widest">{fallbackText || 'مساحة إعلانية مخصصة | Custom Banner Area'}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-hidden min-h-[90px] my-3" />
  );
}
