import React from 'react';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function Footer({ onSwitchToAdmin }) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Insta Prints</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                Central Request Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Enterprise academic and engineering service fulfillment engine. Every drawing, report, presentation, and printout is strictly scoped to a unique verified Request ID.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% On-Time Fulfillment
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5" /> End-to-End Privacy
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Service Catalog</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Engineering & AutoCAD Drawings</li>
              <li>CBP Project Development</li>
              <li>Project Reports & Documentation</li>
              <li>PPT & Presentation Support</li>
              <li>High-Resolution Printout Arrangement</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Security & Governance</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Locked Single Admin Console</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bcrypt Cost-12 Encryption</span>
              </li>
              <li>
                <button 
                  onClick={onSwitchToAdmin}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                >
                  Internal Admin Gateway
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Insta Prints. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Powered by</span>
            <strong className="text-slate-700 font-semibold">Insta Prints Core Engine</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
