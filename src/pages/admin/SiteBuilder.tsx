import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings } from '../../types/admin';
import { Save, MonitorPlay, Palette, Layout } from 'lucide-react';

export default function SiteBuilder() {
  const [settings, setSettings] = useState<SiteSettings>({
    topAdHtml: '',
    bottomAdHtml: '',
    toolEnabled: true,
    heroTitle: 'AI Watermark Remover',
    heroSubtitle: 'Remove watermarks instantly with our advanced AI.',
    primaryColor: '#4f46e5'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        setSettings({ ...settings, ...snap.data() } as SiteSettings);
      }
    } catch (error) {
      console.error("Error fetching", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving", error);
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Site Builder & Settings</h2>
        <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Layout className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Homepage Editor</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-1">Hero Title</label>
            <input type="text" className="w-full border p-2 rounded" value={settings.heroTitle || ''} onChange={e => setSettings({...settings, heroTitle: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Hero Subtitle</label>
            <input type="text" className="w-full border p-2 rounded" value={settings.heroSubtitle || ''} onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Theme Editor</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-1">Primary Color</label>
            <div className="flex items-center gap-4">
              <input type="color" className="w-12 h-12 rounded cursor-pointer" value={settings.primaryColor || '#4f46e5'} onChange={e => setSettings({...settings, primaryColor: e.target.value})} />
              <input type="text" className="border p-2 rounded w-32 font-mono" value={settings.primaryColor || '#4f46e5'} onChange={e => setSettings({...settings, primaryColor: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <MonitorPlay className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Global Tool Access</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input type="checkbox" id="toolEnabled" checked={settings.toolEnabled} onChange={e => setSettings({...settings, toolEnabled: e.target.checked})} className="w-5 h-5" />
            <label htmlFor="toolEnabled" className="font-bold text-slate-700 cursor-pointer">Enable AI Builder Tool (Uncheck to put in maintenance mode)</label>
          </div>
        </div>
      </div>
    </div>
  );
}
