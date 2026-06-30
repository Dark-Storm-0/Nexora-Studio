import { Link } from 'react-router-dom';
import { UserData } from '../App';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Sparkles, LayoutDashboard, LogOut, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import GoogleTranslator from './GoogleTranslator';

export default function Navbar({ userData }: { userData: UserData | null }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <Link to="/">
        <motion.div 
          animate={{ y: [0, -3, 0] }} 
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="text-2xl font-black bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#818CF8] bg-clip-text text-transparent flex items-center gap-2 drop-shadow-sm"
        >
          <Sparkles className="w-6 h-6 text-[#6366F1] animate-pulse" />
          NEXORA STUDIO
        </motion.div>
      </Link>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {/* Dynamic Multi-Language Google Translator Element */}
        <GoogleTranslator />

        {userData && (
          <div className="flex items-center gap-4">
            <Link to="/plans" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">
              Plans
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm border border-indigo-100 shadow-inner">
              <Coins className="w-4 h-4" />
              <span>{userData.credits} Credits</span>
            </div>
          </div>
        )}

        {userData?.role === 'admin' && (
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        )}

        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}

