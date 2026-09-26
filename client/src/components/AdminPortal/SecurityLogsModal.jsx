import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiService } from '../../api/client';

export default function SecurityLogsModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSecurityLogs();
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3>Security & Failed Login Audit</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {loading ? (
            <p className="text-center text-xs text-slate-400 py-8">Loading security logs...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <p className="font-semibold text-emerald-600">✓ No suspicious or failed login attempts recorded.</p>
              <p className="text-[11px] text-slate-400 mt-1">Single admin account is locked and secure.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-3 rounded-xl border border-red-100 bg-red-50/50 text-xs">
                <div className="flex justify-between font-bold text-red-900">
                  <span>Failed Login: {log.emailAttempted}</span>
                  <span className="text-[10px] text-red-600">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">IP Address: {log.ip}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">Agent: {log.userAgent}</p>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
