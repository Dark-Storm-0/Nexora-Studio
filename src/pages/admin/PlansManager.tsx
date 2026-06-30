import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plan } from '../../types/admin';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const snap = await getDocs(collection(db, 'plans'));
      setPlans(snap.docs.map(d => ({ ...d.data(), id: d.id } as Plan)));
    } catch (error) {
      console.error("Error fetching plans", error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!editingPlan?.name) return;
    try {
      if (editingPlan.id) {
        await setDoc(doc(db, 'plans', editingPlan.id), editingPlan);
      } else {
        await addDoc(collection(db, 'plans'), editingPlan);
      }
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan", error);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
      setDeletingId(null);
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan", error);
    }
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Plan Management</h2>
        <button 
          onClick={() => setEditingPlan({ name: '', price: 0, credits: 0, features: [], isPopular: false, active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="text-2xl font-black">${plan.price}</div>
              </div>
              <div className="flex gap-2">
                {deletingId === plan.id ? (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-lg text-[10px]">
                    <span className="font-bold text-red-700">تأكيد؟</span>
                    <button 
                      onClick={() => deletePlan(plan.id)} 
                      className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded hover:bg-red-700"
                    >
                      نعم
                    </button>
                    <button 
                      onClick={() => setDeletingId(null)} 
                      className="px-1.5 py-0.5 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
                    >
                      لا
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setEditingPlan(plan)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(plan.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-4">
              <span className="font-bold">{plan.credits}</span> AI Credits
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features?.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {plan.active ? 'Active' : 'Draft'}
              </span>
              {plan.isPopular && <span className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-indigo-100 text-indigo-700">Popular</span>}
            </div>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingPlan.id ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setEditingPlan(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Plan Name</label>
                <input type="text" className="w-full border p-2 rounded" value={editingPlan.name || ''} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Price ($)</label>
                  <input type="number" className="w-full border p-2 rounded" value={editingPlan.price || 0} onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">AI Credits</label>
                  <input type="number" className="w-full border p-2 rounded" value={editingPlan.credits || 0} onChange={e => setEditingPlan({...editingPlan, credits: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Features (comma separated)</label>
                <textarea 
                  className="w-full border p-2 rounded h-24" 
                  value={(editingPlan.features || []).join(', ')} 
                  onChange={e => setEditingPlan({...editingPlan, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  placeholder="Feature 1, Feature 2"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={editingPlan.isPopular || false} onChange={e => setEditingPlan({...editingPlan, isPopular: e.target.checked})} />
                  Popular Badge
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={editingPlan.active || false} onChange={e => setEditingPlan({...editingPlan, active: e.target.checked})} />
                  Active
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setEditingPlan(null)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
              <button onClick={savePlan} className="px-4 py-2 font-bold bg-indigo-600 text-white rounded-lg">Save Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
