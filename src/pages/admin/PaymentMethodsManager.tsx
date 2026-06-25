import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PaymentMethod } from '../../types/admin';
import { Plus, Edit2, Trash2, X, CreditCard, Wallet, Building2 } from 'lucide-react';

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PaymentMethod> | null>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const snap = await getDocs(collection(db, 'paymentMethods'));
      setMethods(snap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethod)));
    } catch (error) {
      console.error("Error fetching", error);
    } finally {
      setLoading(false);
    }
  };

  const saveMethod = async () => {
    if (!editing?.name) return;
    try {
      if (editing.id) {
        await setDoc(doc(db, 'paymentMethods', editing.id), editing);
      } else {
        await addDoc(collection(db, 'paymentMethods'), editing);
      }
      setEditing(null);
      fetchMethods();
    } catch (error) {
      console.error("Error saving", error);
    }
  };

  const deleteMethod = async (id: string) => {
    if (!window.confirm('Delete this payment method?')) return;
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
      fetchMethods();
    } catch (error) {
      console.error("Error deleting", error);
    }
  };

  if (loading) return <div>Loading payment methods...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Payment Methods</h2>
        <button 
          onClick={() => setEditing({ name: '', type: 'bank', instructions: '', active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map(method => (
          <div key={method.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                  {method.type === 'crypto' ? <Wallet className="w-6 h-6" /> : method.type === 'bank' ? <Building2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{method.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${method.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {method.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(method)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMethod(method.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm font-mono bg-slate-50 p-4 rounded border border-slate-100 whitespace-pre-wrap flex-1">
              {method.instructions}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold">{editing.id ? 'Edit Method' : 'New Payment Method'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Method Name (e.g., Vodafone Cash, USDT)</label>
                <input type="text" className="w-full border p-2 rounded" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Type</label>
                <select className="w-full border p-2 rounded" value={editing.type || 'bank'} onChange={e => setEditing({...editing, type: e.target.value})}>
                  <option value="bank">Bank Transfer / Wallet</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="card">Credit Card / Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Payment Instructions (Account numbers, wallets, etc)</label>
                <textarea 
                  className="w-full border p-2 rounded h-32 font-mono text-sm" 
                  value={editing.instructions || ''} 
                  onChange={e => setEditing({...editing, instructions: e.target.value})}
                  placeholder="Transfer to IBAN: 123...&#10;or Wallet Address: 0x..."
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={editing.active || false} onChange={e => setEditing({...editing, active: e.target.checked})} />
                  Enabled
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
              <button onClick={saveMethod} className="px-4 py-2 font-bold bg-indigo-600 text-white rounded-lg">Save Method</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
