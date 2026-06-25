import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserData } from '../../App';
import { Users, Receipt, CheckCircle, XCircle } from 'lucide-react';

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

  const approvePayment = async (paymentId: string, uid: string, plan: string) => {
    if (!window.confirm(`Approve ${plan} plan for user?`)) return;
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: 'approved' });
      
      const userToUpdate = users.find(u => u.uid === uid);
      if (userToUpdate) {
        // Find plan credits in real app, here we hardcode or just give them active status. We should fetch from plan db.
        // For simplicity, we just set plan to active and maybe let admin add credits manually if needed, or we query plans.
        // Assuming Pro=50, Business=9999 as before.
        const addedCredits = plan === 'pro' ? 50 : (plan === 'business' ? 9999 : 0);
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
      alert("Failed to approve payment");
    }
  };

  const rejectPayment = async (paymentId: string, uid: string) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected', rejectionReason: reason });
      await updateDoc(doc(db, 'users', uid), { planStatus: 'active', requestedPlan: null });
      setUsers(users.map(u => u.uid === uid ? { ...u, planStatus: 'active', requestedPlan: undefined } : u));
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'rejected', rejectionReason: reason } : p));
    } catch (error) {
      console.error("Error rejecting payment", error);
      alert("Failed to reject payment");
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
                        <div className="flex justify-end gap-2">
                          <button onClick={() => approvePayment(payment.id, payment.uid, payment.plan)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => rejectPayment(payment.id, payment.uid)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
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
                      <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Edit User</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
