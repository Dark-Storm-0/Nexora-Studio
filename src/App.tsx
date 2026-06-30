import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Tool from './pages/Tool';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

export interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  credits: number;
  plan: 'free' | 'pro' | 'business';
  planStatus: 'active' | 'pending';
  requestedPlan?: 'free' | 'pro' | 'business';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Global Ad Networks Script Injector
  useEffect(() => {
    const injectScripts = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const data = snap.data();
          
          const executeScriptHTML = (htmlString: string, id: string) => {
            if (!htmlString) return;
            
            // Clean old elements
            document.querySelectorAll(`[data-injected-ad="${id}"]`).forEach(el => el.remove());
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            
            // Extract and append all scripts
            const scripts = Array.from(tempDiv.getElementsByTagName('script'));
            scripts.forEach(s => {
              const newScript = document.createElement('script');
              newScript.setAttribute('data-injected-ad', id);
              
              // Copy all attributes
              Array.from(s.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });
              
              if (s.src) {
                newScript.src = s.src;
              } else {
                newScript.innerHTML = s.innerHTML;
              }
              document.body.appendChild(newScript);
            });
            
            // Append non-script nodes (iframe, div, noscript, styling)
            const nonScripts = Array.from(tempDiv.childNodes).filter(node => node.nodeName !== 'SCRIPT');
            nonScripts.forEach(node => {
              const clonedNode = node.cloneNode(true);
              if (clonedNode instanceof HTMLElement) {
                clonedNode.setAttribute('data-injected-ad', id);
              }
              document.body.appendChild(clonedNode);
            });
          };

          // Trigger injections for configured providers
          if (data.adsterraPopunder) executeScriptHTML(data.adsterraPopunder, 'adsterra-popunder');
          if (data.adsterraSocialBar) executeScriptHTML(data.adsterraSocialBar, 'adsterra-socialbar');
          if (data.popadsPopunder) executeScriptHTML(data.popadsPopunder, 'popads-popunder');
          if (data.monetagPopunder) executeScriptHTML(data.monetagPopunder, 'monetag-popunder');
          if (data.monetagVignette) executeScriptHTML(data.monetagVignette, 'monetag-vignette');
          
          if (data.customHeaderCode) {
            const tempHead = document.createElement('div');
            tempHead.innerHTML = data.customHeaderCode;
            Array.from(tempHead.childNodes).forEach(node => {
              const clonedNode = node.cloneNode(true);
              if (clonedNode instanceof HTMLElement) {
                clonedNode.setAttribute('data-injected-ad', 'custom-header');
              }
              document.head.appendChild(clonedNode);
            });
          }
          if (data.customFooterCode) executeScriptHTML(data.customFooterCode, 'custom-footer');
        }
      } catch (err) {
        console.error("Error loading and injecting ad network scripts:", err);
      }
    };
    injectScripts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserData(userSnap.data() as UserData);
          } else {
            // First check if a user with this email already has a Firestore document (e.g. from Google auth)
            let existingUser: UserData | null = null;
            if (firebaseUser.email) {
              try {
                const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  existingUser = querySnapshot.docs[0].data() as UserData;
                }
              } catch (err) {
                console.error("Error querying existing user by email:", err);
              }
            }

            if (existingUser) {
              // Copy data from Google Auth account to the new Email/Password Auth account
              const newUser: UserData = {
                ...existingUser,
                uid: firebaseUser.uid, // update to the new Firebase Auth UID
              };
              await setDoc(userRef, newUser);
              setUserData(newUser);
            } else {
              // Check if this is the very first user
              let isFirstUser = false;
              try {
                const usersQuery = query(collection(db, 'users'), limit(1));
                const usersSnapshot = await getDocs(usersQuery);
                isFirstUser = usersSnapshot.empty;
              } catch (err) {
                console.error("Error checking for existing users:", err);
                // If it fails (e.g., due to rules before deploying), default to false
              }

              // Create new user profile
              const newUser: UserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: isFirstUser ? 'admin' : 'user',
                credits: isFirstUser ? 9999 : 3,
                plan: 'free',
                planStatus: 'active'
              };
              await setDoc(userRef, newUser);
              setUserData(newUser);
            }
          }
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [retryTrigger]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
          {user && <Navbar userData={userData} />}
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
              <Route path="/" element={user ? (
                userData ? (
                  <Tool userData={userData} setUserData={setUserData} />
                ) : (
                  <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-6">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-bounce">
                        ⚠️
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold text-slate-800">فشل في تحميل الحساب</h3>
                        <h4 className="text-sm font-semibold text-slate-500">Failed to load user profile</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          قد يكون هذا بسبب مشكلة مؤقتة في الاتصال بالإنترنت، أو أن حسابك قيد الإعداد. يرجى المحاولة مرة أخرى أو تسجيل الخروج والمحاولة لاحقاً.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => setRetryTrigger(prev => prev + 1)}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                        >
                          إعادة المحاولة / Retry Connection
                        </button>
                        <button 
                          onClick={() => {
                            import('firebase/auth').then(({ signOut }) => signOut(auth));
                          }}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                        >
                          تسجيل الخروج / Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : <Navigate to="/auth" />} />
              <Route path="/plans" element={user && userData ? <Plans userData={userData} setUserData={setUserData} /> : <Navigate to="/auth" />} />
              <Route path="/dashboard" element={user && userData?.role === 'admin' ? <Dashboard userData={userData} /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
