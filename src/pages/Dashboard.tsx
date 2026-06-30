import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserData } from '../App';
import { LayoutDashboard, Users, CreditCard, LayoutTemplate, Box, Menu, X, Megaphone } from 'lucide-react';
import UsersManager from './admin/UsersManager';
import PlansManager from './admin/PlansManager';
import PaymentMethodsManager from './admin/PaymentMethodsManager';
import SiteBuilder from './admin/SiteBuilder';
import AdsManager from './admin/AdsManager';

interface DashboardProps {
  userData?: UserData;
}

export default function Dashboard({ userData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'payments' | 'site' | 'ads'>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const navItems = [
    { id: 'users', label: 'Users & Subs', icon: Users },
    { id: 'plans', label: 'Plans & Pricing', icon: Box },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'site', label: 'Site Builder', icon: LayoutTemplate },
    { id: 'ads', label: 'إدارة الإعلانات / Ads', icon: Megaphone }
  ] as const;

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50 relative">
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
      </button>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform absolute md:relative z-40 h-full w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0`}>
        <div className="p-6 border-b border-slate-200 mt-12 md:mt-0">
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" /> Super Admin
          </h1>
        </div>
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'plans' && <PlansManager />}
          {activeTab === 'payments' && <PaymentMethodsManager />}
          {activeTab === 'site' && <SiteBuilder />}
          {activeTab === 'ads' && <AdsManager />}
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </div>
  );
}
