import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../lib/firebase';
import { Sparkles } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Auth() {
  const { showToast } = useToast();
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      setView('reset');
      setResetCode(oobCode);
      setLoading(true);
      verifyPasswordResetCode(auth, oobCode)
        .then((emailAddress) => {
          setEmail(emailAddress);
          setMessage(`تعيين كلمة مرور جديدة للحساب: ${emailAddress}`);
        })
        .catch((err) => {
          setError('رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('تم تسجيل الدخول بنجاح! | Signed in successfully!', 'success');
      } else if (view === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('تم إنشاء الحساب بنجاح! يرجى الاستمتاع بالخدمة. | Account created successfully!', 'success');
      } else if (view === 'forgot') {
        const actionCodeSettings = {
          url: window.location.origin + '/auth',
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        const successMsg = 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح! برجاء مراجعة صندوق الوارد (أو مجلد البريد العشوائي/Spam).';
        setMessage(successMsg);
        showToast('تم إرسال رابط إعادة التعيين بنجاح! | Reset email sent successfully!', 'success');
      }
    } catch (err: any) {
      let friendlyError = err.message;
      if (err.code === 'auth/user-not-found') {
        friendlyError = 'هذا البريد الإلكتروني غير مسجل لدينا. يرجى إنشاء حساب جديد.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'كلمة المرور أو البريد الإلكتروني غير صحيح! يرجى المحاولة مرة أخرى.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
      } else if (err.code === 'auth/invalid-action-code') {
        friendlyError = 'كود إعادة التعيين غير صالح أو انتهت صلاحيته.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'صيغة البريد الإلكتروني المدخلة غير صحيحة. يرجى كتابة بريد حقيقي وصالح.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'فشل الاتصال بالإنترنت. يرجى التأكد من شبكة الإنترنت والمحاولة مرة أخرى.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'لقد حاولت عدة مرات خاطئة وتم تجميد العمليات مؤقتاً لحمايتك. يرجى تجربة إعادة التعيين أو المحاولة لاحقاً.';
      }
      setError(friendlyError);
      showToast(friendlyError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      const msg = 'كلمتا المرور غير متطابقتين. | Passwords do not match.';
      setError(msg);
      showToast(msg, 'warning');
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل. | New password must be at least 6 characters.';
      setError(msg);
      showToast(msg, 'warning');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, resetCode, newPassword);
      const successMsg = 'تم تغيير كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...';
      setMessage(successMsg);
      showToast('تم تغيير كلمة المرور بنجاح! | Password changed successfully!', 'success');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setView('login');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMessage('');
        setError('');
      }, 3000);
    } catch (err: any) {
      const errorMsg = 'فشلت إعادة تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('popup') ||
        err.message?.includes('blocked')
      ) {
        setError('تم حظر النافذة المنبثقة بواسطة المتصفح. جاري التحويل لتسجيل الدخول...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          setError(redirectErr.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('popup') ||
        err.message?.includes('blocked')
      ) {
        setError('تم حظر النافذة المنبثقة بواسطة المتصفح. جاري التحويل لتسجيل الدخول...');
        try {
          await signInWithRedirect(auth, facebookProvider);
        } catch (redirectErr: any) {
          setError(redirectErr.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-3xl font-black bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#818CF8] bg-clip-text text-transparent items-center gap-2 drop-shadow-sm mb-6">
          <Sparkles className="w-8 h-8 text-[#6366F1]" />
          NEXORA STUDIO
        </div>
        <h2 className="mt-2 text-center text-2xl font-bold text-slate-900">
          {view === 'login' && 'تسجيل الدخول | Sign In'}
          {view === 'signup' && 'إنشاء حساب جديد | Sign Up'}
          {view === 'forgot' && 'استعادة كلمة المرور | Reset Password'}
          {view === 'reset' && 'تعيين كلمة المرور الجديدة | New Password'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          {view === 'reset' ? (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center font-medium border border-emerald-100 animate-pulse">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 flex justify-between">
                  <span>New Password</span>
                  <span>كلمة المرور الجديدة</span>
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 flex justify-between">
                  <span>Confirm New Password</span>
                  <span>تأكيد كلمة المرور الجديدة</span>
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'جاري الحفظ... / Saving...' : 'تأكيد كلمة المرور / Reset Password'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleEmailAuth}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center font-medium border border-emerald-100">
                  {message}
                </div>
              )}


              
              <div>
                <label className="block text-sm font-medium text-slate-700 flex justify-between">
                  <span>Email address</span>
                  <span>البريد الإلكتروني</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 flex justify-between">
                    <span>Password</span>
                    <span>كلمة المرور</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  {view === 'login' && (
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setView('forgot');
                          setError('');
                          setMessage('');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        نسيت كلمة المرور؟ | Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'جاري التحميل... / Processing...' : (
                    view === 'login' ? 'تسجيل دخول / Sign In' : 
                    view === 'signup' ? 'إنشاء حساب / Sign Up' : 
                    'إرسال رابط إعادة التعيين / Send Link'
                  )}
                </button>
              </div>
            </form>
          )}

          {(view === 'login' || view === 'signup') && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-medium">
                    أو تابع باستخدام | Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleAuth}
                  type="button"
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors gap-2 items-center cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.63 1.39 7.47l3.87 3C6.22 7.37 8.89 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.98 3.73-4.9 3.73-8.54z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.26 14.47c-.23-.69-.36-1.42-.36-2.19s.13-1.5.36-2.19L1.39 7.1C.51 8.87 0 10.87 0 13s.51 4.13 1.39 5.9l3.87-3.43z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.08.73-2.47 1.16-4.26 1.16-3.11 0-5.78-2.33-6.74-5.43l-3.87 3C3.37 20.37 7.35 23 12 23z"
                    />
                  </svg>
                  <span className="font-semibold text-xs">Google</span>
                </button>

                <button
                  onClick={handleFacebookAuth}
                  type="button"
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors gap-2 items-center cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="font-semibold text-xs">Facebook</span>
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 border-t border-slate-100 pt-6 flex flex-col gap-3 text-center text-sm">
            {view === 'login' ? (
              <>
                <button
                  onClick={() => {
                    setView('signup');
                    setError('');
                    setMessage('');
                  }}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  ليس لديك حساب؟ سجل الآن | Don't have an account? Sign up
                </button>
              </>
            ) : view === 'signup' ? (
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                  setMessage('');
                }}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                لديك حساب بالفعل؟ سجل دخول | Already have an account? Sign in
              </button>
            ) : (
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                  setMessage('');
                }}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                العودة لتسجيل الدخول | Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
