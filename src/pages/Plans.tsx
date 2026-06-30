import React, { useState, useEffect } from 'react';
import { updateDoc, doc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserData } from '../App';
import { Check, Clock, X } from 'lucide-react';
import { Plan, PaymentMethod } from '../types/admin';
import { useToast } from '../components/Toast';

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 1,
    features: [
      'عدد القوالب: 1 يوميًا / 1 Daily Template',
      'تنظيف الكود / Code Cleaning',
      'تحسين السرعة / Speed Optimization',
      'ضغط ملفات CSS/JS / CSS/JS Compression',
    ],
    isPopular: false,
    active: true
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    credits: 20,
    features: [
      'عدد القوالب: 20 شهريًا / 20 Monthly Templates',
      'تنظيف الكود / Code Cleaning',
      'تحسين السرعة / Speed Optimization',
      'ضغط ملفات CSS/JS / CSS/JS Compression',
      'إزالة الأكواد غير المستخدمة / Unused Code Removal',
      'تخصيص إعدادات القالب / Template Customization',
      'نسخ احتياطية: 5 / 5 Backups',
      'دعم فني: بريد إلكتروني / Email Support',
    ],
    isPopular: false,
    active: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    credits: 100,
    features: [
      'عدد القوالب: 100 شهريًا / 100 Monthly Templates',
      'تنظيف الكود / Code Cleaning',
      'تحسين السرعة / Speed Optimization',
      'ضغط ملفات CSS/JS / CSS/JS Compression',
      'إزالة الأكواد غير المستخدمة / Unused Code Removal',
      'تخصيص إعدادات القالب / Template Customization',
      'نسخ احتياطية: 20 / 20 Backups',
      'دعم فني: أولوية / Priority Support',
      'معالجة سريعة / Fast Processing',
    ],
    isPopular: true,
    active: true
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 19.99,
    credits: 9999,
    features: [
      'عدد القوالب: غير محدود / Unlimited Templates',
      'تنظيف الكود / Code Cleaning',
      'تحسين السرعة / Speed Optimization',
      'ضغط ملفات CSS/JS / CSS/JS Compression',
      'إزالة الأكواد غير المستخدمة / Unused Code Removal',
      'تخصيص إعدادات القالب / Template Customization',
      'نسخ احتياطية: غير محدود / Unlimited Backups',
      'دعم فني: أولوية + محادثة / Priority & Chat Support',
      'معالجة سريعة / Fast Processing',
      'واجهة برمجية API / API Access',
    ],
    isPopular: false,
    active: true
  }
];

interface PlansProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export default function Plans({ userData, setUserData }: PlansProps) {
  const { showToast } = useToast();
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
      let plansList = plansSnap.docs.map(d => ({ ...d.data(), id: d.id } as Plan));

      // Check if any default plan is missing or changed
      const hasAllDefaults = DEFAULT_PLANS.every(dp => 
        plansList.some(p => p.id === dp.id && p.price === dp.price && p.active === dp.active)
      );

      if (plansList.length === 0 || !hasAllDefaults) {
        // If user is admin, we write/update plans in Firestore directly
        if (userData?.role === 'admin') {
          for (const dp of DEFAULT_PLANS) {
            const { id, ...planData } = dp;
            await setDoc(doc(db, 'plans', id), planData);
          }
          // Re-fetch
          const newSnap = await getDocs(collection(db, 'plans'));
          plansList = newSnap.docs.map(d => ({ ...d.data(), id: d.id } as Plan));
        } else if (plansList.length === 0) {
          // Fallback to local default plans if DB is empty and user isn't admin yet
          plansList = DEFAULT_PLANS;
        }
      }

      setPlans(plansList.filter(p => p.active).sort((a, b) => a.price - b.price));

      const methodsSnap = await getDocs(collection(db, 'paymentMethods'));
      setPaymentMethods(methodsSnap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethod)).filter(m => m.active));
    } catch (error) {
      console.error("Error fetching admin data", error);
      // Fallback
      if (plans.length === 0) {
        setPlans(DEFAULT_PLANS);
      }
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
    if (!method || !transactionId || !selectedPlan) {
      showToast("الرجاء ملء جميع الحقول المطلوبة | Please fill all required fields", "warning");
      return;
    }
    
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
      showToast("تم إرسال طلب الاشتراك بنجاح وهو قيد المراجعة الآن | Subscription request submitted successfully for review!", "success");
    } catch (error) {
      console.error("Error submitting payment", error);
      showToast("فشل في إرسال طلب الدفع. يرجى المحاولة مرة أخرى | Failed to submit payment. Please try again.", "error");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col relative overflow-hidden ${plan.isPopular ? 'border-2 border-indigo-500 shadow-md transform lg:-translate-y-2' : 'border-slate-200'}`}>
              {plan.isPopular && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">POPULAR</div>}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-slate-500 font-medium text-xs">{plan.price === 0 ? '/forever' : '/month'}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-indigo-500 flex-shrink-0" /> {plan.credits} AI Credits</li>
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" /> <span>{feature}</span></li>
                ))}
              </ul>
              <button 
                onClick={() => plan.price > 0 ? handleRequestPlanClick(plan) : null}
                disabled={loading || isPending || userData.plan === plan.name.toLowerCase()}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : plan.price === 0 ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {userData.plan === plan.name.toLowerCase() ? 'Current Plan' : (userData.requestedPlan === plan.name && isPending ? 'Requested' : plan.price === 0 ? 'Current Plan' : `Select ${plan.name}`)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Features Comparison Table */}
      <div className="mt-16 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="plans-comparison">
        <div className="p-6 border-b border-slate-200 bg-slate-50/75 flex flex-col md:flex-row justify-between items-center gap-2">
          <h2 className="text-xl font-bold text-slate-950 font-sans tracking-tight">جدول مقارنة الميزات | Features Comparison Table</h2>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">جميع المميزات والتفاصيل الكاملة</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-slate-900 font-bold text-xs">الميزة | Feature</th>
                <th className="p-4 text-slate-950 font-bold text-xs text-center border-l border-slate-100">Free</th>
                <th className="p-4 text-slate-950 font-bold text-xs text-center border-l border-slate-100">Basic</th>
                <th className="p-4 text-slate-950 font-bold text-xs text-center border-l border-indigo-100 text-indigo-600 bg-indigo-50/20">Pro</th>
                <th className="p-4 text-slate-950 font-bold text-xs text-center border-l border-slate-100">Ultimate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">السعر | Price</td>
                <td className="p-4 text-center font-bold text-emerald-600 border-l border-slate-100">مجانًا / Free</td>
                <td className="p-4 text-center font-bold text-slate-900 border-l border-slate-100">$4.99</td>
                <td className="p-4 text-center font-bold text-indigo-600 border-l border-indigo-100 bg-indigo-50/20">$9.99</td>
                <td className="p-4 text-center font-bold text-slate-900 border-l border-slate-100">$19.99</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">عدد القوالب | Templates</td>
                <td className="p-4 text-center border-l border-slate-100">1 يوميًا / Daily</td>
                <td className="p-4 text-center border-l border-slate-100">20 شهريًا / Monthly</td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/20">100 شهريًا / Monthly</td>
                <td className="p-4 text-center font-bold text-indigo-600 border-l border-slate-100">غير محدود / Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">تنظيف الكود | Code Cleaning</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">تحسين السرعة | Speed Optimization</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">ضغط ملفات CSS/JS | CSS/JS Compression</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">إزالة الأكواد غير المستخدمة | Unused Code Removal</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">تخصيص إعدادات القالب | Settings Customization</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">نسخ احتياطية | Backups</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100 font-bold">5</td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/20 font-bold">20</td>
                <td className="p-4 text-center border-l border-slate-100 font-bold text-indigo-600">غير محدود / Unlimited</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">دعم فني | Technical Support</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100 font-semibold text-slate-600">بريد إلكتروني / Email</td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/20 font-semibold text-indigo-700">أولوية / Priority</td>
                <td className="p-4 text-center border-l border-slate-100 font-bold text-indigo-600">أولوية + محادثة / Priority & Chat</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">معالجة سريعة | Fast Processing</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">واجهة برمجية | API</td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-indigo-100 bg-indigo-50/10"><span className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ لا</span></td>
                <td className="p-4 text-center border-l border-slate-100"><span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">✅ نعم</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
