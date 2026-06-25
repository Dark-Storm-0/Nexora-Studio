import React, { useState, useEffect } from 'react';
import { updateDoc, doc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserData } from '../App';
import { Check, Clock, X } from 'lucide-react';
import { Plan, PaymentMethod } from '../types/admin';

interface PlansProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export default function Plans({ userData, setUserData }: PlansProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);

  useEffect(() => {
    fetchData();
    checkPendingPayment();
  }, [userData]);

  const fetchData = async () => {
    try {
      const plansSnap = await getDocs(collection(db, 'plans'));
      setPlans(plansSnap.docs.map(d => ({ ...d.data(), id: d.id } as Plan)).filter(p => p.active).sort((a, b) => a.price - b.price));

      const methodsSnap = await getDocs(collection(db, 'paymentMethods'));
      setPaymentMethods(methodsSnap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethod)).filter(m => m.active));
    } catch (error) {
      console.error("Error fetching admin data", error);
    }
  };

  const checkPendingPayment = async () => {
    try {
      const q = query(collection(db, 'payments'), where('uid', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      const pending = querySnapshot.docs.find(doc => doc.data().status === 'pending');
      if (pending) {
        setPendingPayment(pending.data());
      } else {
        setPendingPayment(null);
      }
    } catch (error) {
      console.error("Error fetching payments", error);
    }
  };

  const handleRequestPlanClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = paymentMethods.find(m => m.id === selectedPaymentMethodId);
    if (!method || !transactionId || !selectedPlan) return alert("Please fill all fields");
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        uid: userData.uid,
        email: userData.email,
        plan: selectedPlan.name,
        planId: selectedPlan.id,
        paymentMethod: method.name,
        transactionId,
        status: 'pending',
        amount: selectedPlan.price,
        timestamp: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', userData.uid), {
        requestedPlan: selectedPlan.name,
        planStatus: 'pending'
      });
      
      setUserData(prev => prev ? { ...prev, requestedPlan: selectedPlan.name as any, planStatus: 'pending' } : null);
      setShowPaymentModal(false);
      checkPendingPayment();
    } catch (error) {
      console.error("Error submitting payment", error);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPending = userData.planStatus === 'pending' || pendingPayment !== null;
  const activeMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);

  return (
    <div className="max-w-6xl mx-auto p-8 relative">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
        <p className="text-lg text-slate-600">Upgrade to get more credits and unlock advanced AI builder features.</p>
      </div>

      {isPending && (
        <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl flex flex-col items-center justify-center gap-3 max-w-2xl mx-auto shadow-sm text-center">
          <Clock className="w-8 h-8 mb-2" />
          <h3 className="font-bold text-lg">Payment Received - Verification Pending</h3>
          <p className="font-medium text-sm">Your request for the <span className="font-bold capitalize">{userData.requestedPlan || pendingPayment?.plan}</span> plan is currently under review.</p>
          <p className="text-sm opacity-80">Estimated review time: 1-2 hours.</p>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-700">No plans available at the moment.</h3>
          <p className="text-slate-500 mt-2">Please check back later or contact support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border p-8 flex flex-col relative overflow-hidden ${plan.isPopular ? 'border-2 border-indigo-500 shadow-md transform md:-translate-y-4' : 'border-slate-200'}`}>
              {plan.isPopular && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-slate-500 font-medium">{plan.price === 0 ? '/forever' : '/month'}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-indigo-500" /> {plan.credits} AI Credits</li>
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3"><Check className="w-5 h-5 text-indigo-500" /> {feature}</li>
                ))}
              </ul>
              <button 
                onClick={() => plan.price > 0 ? handleRequestPlanClick(plan) : null}
                disabled={loading || isPending || userData.plan === plan.name.toLowerCase()}
                className={`w-full py-3 rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : plan.price === 0 ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {userData.plan === plan.name.toLowerCase() ? 'Current Plan' : (userData.requestedPlan === plan.name && isPending ? 'Requested' : plan.price === 0 ? 'Current Plan' : `Select ${plan.name}`)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Complete Payment</h2>
              <p className="text-sm text-slate-500 mt-1">Plan: <span className="font-bold capitalize text-indigo-600">{selectedPlan.name}</span> (${selectedPlan.price})</p>
            </div>
            <form onSubmit={submitPayment} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                  <select 
                    value={selectedPaymentMethodId}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a method</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>{method.name} ({method.type})</option>
                    ))}
                  </select>
                </div>
                {activeMethod && activeMethod.instructions && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800 font-mono whitespace-pre-wrap">
                    {activeMethod.instructions}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Transaction ID / Reference</label>
                  <input 
                    type="text" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter the transaction ID"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading || !selectedPaymentMethodId || !transactionId}
                className="w-full mt-6 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit Payment for Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
