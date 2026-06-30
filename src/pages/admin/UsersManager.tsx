import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserData } from '../../App';
import { Users, Receipt, CheckCircle, XCircle, Edit } from 'lucide-react';

export default function UsersManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData)));

      const paymentsSnap = await getDocs(query(collection(db, 'payments'), orderBy('timestamp', 'desc')));
      setPayments(paymentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (uid: string, currentCredits: number, change: number) => {
    try {
      const newCredits = Math.max(0, currentCredits + change);
      await updateDoc(doc(db, 'users', uid), { credits: newCredits });
      setUsers(users.map(u => u.uid === uid ? { ...u, credits: newCredits } : u));
    } catch (error) {
      console.error("Error updating credits", error);
    }
  };

  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject'; uid: string; plan?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // User Edit Modal States
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<{
    role: 'admin' | 'user';
    credits: number;
    plan: 'free' | 'pro' | 'business';
    planStatus: 'active' | 'pending';
  }>({
    role: 'user',
    credits: 0,
    plan: 'free',
    planStatus: 'active'
  });

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || 'user',
      credits: user.credits || 0,
      plan: user.plan || 'free',
      planStatus: user.planStatus || 'active'
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        role: editForm.role,
        credits: Number(editForm.credits),
        plan: editForm.plan,
        planStatus: editForm.planStatus
      });
      setUsers(users.map(u => u.uid === editingUser.uid ? {
        ...u,
        role: editForm.role,
        credits: Number(editForm.credits),
        plan: editForm.plan,
        planStatus: editForm.planStatus
      } : u));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user", error);
      alert('Failed to update user');
    }
  };

  const handleApproveConfirm = async () => {
    if (!pendingAction || pendingAction.type !== 'approve') return;
    const { id: paymentId, uid, plan } = pendingAction;
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: 'approved' });
      
      const userToUpdate = users.find(u => u.uid === uid);
      if (userToUpdate) {
        // Find plan credits in real app, here we hardcode or just give them active status. We should fetch from plan db.
        // For simplicity, we just set plan to active and maybe let admin add credits manually if needed, or we query plans.
        // Assuming Pro=100, Ultimate=9999, Basic=20, Free=1.
        let addedCredits = 0;
        const normPlan = (plan || '').toLowerCase();
        if (normPlan === 'pro') addedCredits = 100;
        else if (normPlan === 'ultimate') addedCredits = 9999;
        else if (normPlan === 'basic') addedCredits = 20;
        else if (normPlan === 'free') addedCredits = 1;

        const newCredits = userToUpdate.credits + addedCredits;
        
        await updateDoc(doc(db, 'users', uid), { 
          plan: plan,
          planStatus: 'active',
          requestedPlan: null,
          credits: newCredits
        });
        
        setUsers(users.map(u => u.uid === uid ? { ...u, plan: plan as any, planStatus: 'active', requestedPlan: undefined, credits: newCredits } : u));
        setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'approved' } : p));
      }
    } catch (error) {
      console.error("Error approving payment", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!pendingAction || pendingAction.type !== 'reject') return;
    const { id: paymentId, uid } = pendingAction;
    try {
      const reason = rejectReason || 'تم رفض الدفع من قبل المشرف | Payment rejected by admin';
      await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected', rejectionReason: reason });
      await updateDoc(doc(db, 'users', uid), { planStatus: 'active', requestedPlan: null });
      setUsers(users.map(u => u.uid === uid ? { ...u, planStatus: 'active', requestedPlan: undefined } : u));
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'rejected', rejectionReason: reason } : p));
    } catch (error) {
      console.error("Error rejecting payment", error);
    } finally {
      setPendingAction(null);
      setRejectReason('');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Receipt className="w-5 h-5 text-indigo-600" /> Payment Requests
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Plan / Amount</th>
                  <th className="px-6 py-4">Method / ID</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-500">No payment requests found.</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{payment.email}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold uppercase text-indigo-600">{payment.plan}</div>
                      <div className="text-xs text-slate-500">${payment.amount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold uppercase text-slate-700 text-xs">{payment.paymentMethod}</div>
                      <div className="font-mono text-xs text-slate-500 mt-1">{payment.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        payment.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                     <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end items-center gap-2">
                          {pendingAction?.id === payment.id ? (
                            <div className="flex flex-col items-end gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs max-w-[200px] text-right">
                              {pendingAction.type === 'approve' ? (
                                <>
                                  <span className="font-bold text-slate-700">تأكيد الموافقة؟</span>
                                  <div className="flex gap-1 justify-end">
                                    <button 
                                      onClick={() => handleApproveConfirm()} 
                                      className="px-2 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 text-[10px]"
                                    >
                                      نعم
                                    </button>
                                    <button 
                                      onClick={() => setPendingAction(null)} 
                                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 text-[10px]"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-700">سبب الرفض:</span>
                                  <input 
                                    type="text" 
                                    placeholder="اكتب السبب..." 
                                    value={rejectReason} 
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="border px-1.5 py-1 rounded w-full text-[10px] text-right"
                                  />
                                  <div className="flex gap-1 w-full justify-end">
                                    <button 
                                      onClick={() => handleRejectConfirm()} 
                                      className="px-2 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700 text-[10px]"
                                    >
                                      رفض
                                    </button>
                                    <button 
                                      onClick={() => { setPendingAction(null); setRejectReason(''); }} 
                                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 text-[10px]"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setPendingAction({ id: payment.id, type: 'approve', uid: payment.uid, plan: payment.plan })} 
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                              >
                                <CheckCircle className="w-4 h-4" /> موافقة
                              </button>
                              <button 
                                onClick={() => setPendingAction({ id: payment.id, type: 'reject', uid: payment.uid })} 
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                              >
                                <XCircle className="w-4 h-4" /> رفض
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Users className="w-5 h-5 text-indigo-600" /> Users Directory
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role & Plan</th>
                  <th className="px-6 py-4 text-center">Credits</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{user.email}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">{user.uid}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                          {user.role}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.plan === 'business' ? 'bg-amber-100 text-amber-700' : user.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                          Plan: {user.plan || 'Free'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => updateCredits(user.uid, user.credits, -1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">-</button>
                        <span className="font-bold text-lg w-12 text-center">{user.credits}</span>
                        <button onClick={() => updateCredits(user.uid, user.credits, 1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">+</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5" /> تعديل / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-fade-in text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center" dir="ltr">
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold"
              >
                ✕
              </button>
              <h3 className="font-extrabold text-slate-800 text-base">تعديل حساب المستخدم | Edit User</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني / Email</label>
                <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg text-sm font-mono text-left" dir="ltr">
                  {editingUser.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الرتبة / Role</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-right"
                >
                  <option value="user">مستخدم عادي / user</option>
                  <option value="admin">مشرف / admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">الباقة / Plan</label>
                  <select 
                    value={editForm.plan}
                    onChange={e => setEditForm({ ...editForm, plan: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-right"
                  >
                    <option value="free">مجاني / Free</option>
                    <option value="pro">مميز / Pro</option>
                    <option value="business">شركات / Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">حالة الاشتراك / Plan Status</label>
                  <select 
                    value={editForm.planStatus}
                    onChange={e => setEditForm({ ...editForm, planStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-right"
                  >
                    <option value="active">نشط / active</option>
                    <option value="pending">معلق / pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">النقاط / Credits</label>
                <input 
                  type="number" 
                  min="0"
                  value={editForm.credits}
                  onChange={e => setEditForm({ ...editForm, credits: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء / Cancel
              </button>
              <button 
                type="button"
                onClick={saveUserEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all"
              >
                حفظ التغييرات / Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
