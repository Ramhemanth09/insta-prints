import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldAlert, Key, Printer } from 'lucide-react';

export default function SubmissionSuccessModal({ submissionData, onClose, onTrackNow }) {
  const [copied, setCopied] = useState(false);

  if (!submissionData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionData.requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        
        {/* Decorative Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Celebratory Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10 animate-bounce-short" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Request Submitted Successfully!
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Hello <strong>{submissionData.name}</strong>, your order for <strong>{submissionData.service}</strong> is recorded.
        </p>

        {/* Crucial Request ID Box */}
        <div className="my-6 p-5 rounded-2xl bg-slate-900 text-white shadow-xl relative group">
          <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1 flex items-center justify-center gap-1.5">
            <Key className="w-3.5 h-3.5" /> Your Central Request ID
          </p>
          <div className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-emerald-400 py-1 select-all">
            {submissionData.requestId}
          </div>
          
          <button
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Request ID</span>
              </>
            )}
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-left flex items-start gap-2.5 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">IMPORTANT: Save this Request ID!</p>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Insta Prints does not require student account logins. This <strong>Request ID</strong> along with your mobile number <strong>({submissionData.mobile})</strong> is your ONLY credential to track progress, accept quotations, make payments, chat with the team, and download finished deliverables.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onTrackNow}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <span>Track Order Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
          >
            Submit Another Request
          </button>
        </div>

      </div>
    </div>
  );
}
