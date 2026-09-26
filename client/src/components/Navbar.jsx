import React from 'react';
import { Printer, Shield, Search, PlusCircle, LogOut, CheckCircle, PhoneCall, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, adminUser, onAdminLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17">
          
          {/* Brand Logo & Commercial Wordmark */}
          <div 
            onClick={() => setActiveTab('user-submit')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-all">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-950 group-hover:text-indigo-600 transition-colors">
                  Insta Prints
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                  Studio Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Engineering Drawings • Technical Reports • Presentation Decks • Printouts
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setActiveTab('user-submit')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'user-submit'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Order Service</span>
            </button>

            <button
              onClick={() => setActiveTab('user-track')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'user-track'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Order</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Admin Hub</span>
                  <span className="sm:hidden">Admin</span>
                </button>
                
                <button
                  onClick={onAdminLogout}
                  title="Log out from Admin"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('admin-login')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeTab === 'admin-login'
                    ? 'border-slate-900 bg-slate-950 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Admin Login</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
