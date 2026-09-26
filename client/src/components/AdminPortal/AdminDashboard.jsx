import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Layers, 
  ArrowUpDown, 
  Eye, 
  SlidersHorizontal,
  DollarSign,
  Download,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { SERVICES_LIST, BRANCHES_LIST, STATUS_WORKFLOW, getStatusMeta } from '../../constants/statusWorkflow';
import { apiService } from '../../api/client';

export default function AdminDashboard({ adminUser, onSelectRequest, onOpenSecurityLogs }) {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    newRequests: 0,
    pendingPayments: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    service: 'all',
    branch: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, reqsRes] = await Promise.all([
        apiService.getDashboardMetrics(),
        apiService.getAllRequests(filters)
      ]);

      if (metricsRes.success) setMetrics(metricsRes.metrics);
      if (reqsRes.success) setRequests(reqsRes.requests);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.status, filters.service, filters.branch, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Export orders to CSV
  const handleExportCSV = () => {
    if (!requests || requests.length === 0) {
      alert('No requests available to export.');
      return;
    }

    const headers = ['Request ID', 'Client Name', 'Roll Number', 'Branch', 'Year', 'Mobile', 'Email', 'Service', 'Subject', 'Status', 'Deadline', 'Quotation Total', 'Advance Paid', 'Remaining Paid', 'Total Paid', 'Created At'];
    
    const rows = requests.map(r => [
      `"${r.requestId}"`,
      `"${r.user?.name || ''}"`,
      `"${r.user?.rollNumber || ''}"`,
      `"${r.user?.branch || ''}"`,
      `"${r.user?.year || ''}"`,
      `"${r.user?.mobile || ''}"`,
      `"${r.user?.email || ''}"`,
      `"${r.service || ''}"`,
      `"${(r.subject || '').replace(/"/g, '""')}"`,
      `"${r.currentStatus || ''}"`,
      `"${new Date(r.deadline).toLocaleDateString()}"`,
      r.quotation?.totalAmount || 0,
      r.paymentSummary?.advancePaidAmount || 0,
      r.paymentSummary?.remainingPaidAmount || 0,
      r.paymentSummary?.totalPaid || 0,
      `"${new Date(r.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InstaPrints_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
              Admin Production Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Insta Prints Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong>{adminUser?.email || 'instaprints@gmail.com'}</strong> • Real-time order pipeline active
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export all visible requests to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenSecurityLogs}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit & Login Logs</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{metrics.totalRequests}</p>
          <span className="text-[10px] text-slate-400">All submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">New</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-blue-950 font-mono">{metrics.newRequests}</p>
          <span className="text-[10px] text-blue-700 font-semibold">Needs quotation</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Pay</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono">{metrics.pendingPayments}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Awaiting advance/final</span>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-cyan-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Production</span>
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-cyan-950 font-mono">{metrics.activeOrders}</p>
          <span className="text-[10px] text-cyan-700 font-semibold">Drafting & QA</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-950 font-mono">{metrics.completedOrders}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Fulfilled & closed</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 text-white shadow-2xs">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">₹{metrics.totalRevenue}</p>
          <span className="text-[10px] text-slate-400">Total collected</span>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by Request ID, Name, Roll No, Mobile..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses ({metrics.totalRequests})</option>
              {STATUS_WORKFLOW.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.service}
              onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Services</option>
              {SERVICES_LIST.map(svc => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="deadline_asc">Deadline (Urgent First)</option>
              <option value="deadline_desc">Deadline (Latest First)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Request Ledger ({requests.length})
          </h3>
          <span className="text-xs text-slate-400">Click any row to open the complete control inspector</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading orders ledger...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No service orders found. New user submissions will appear here instantly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Client Details</th>
                  <th className="py-3 px-4">Service & Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Quotation / Paid</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const meta = getStatusMeta(req.currentStatus);
                  const isPastDeadline = new Date(req.deadline) < new Date();

                  return (
                    <tr 
                      key={req._id}
                      onClick={() => onSelectRequest(req.requestId)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {req.requestId}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{req.user?.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {req.user?.rollNumber} • {req.user?.mobile}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {req.user?.branch} ({req.user?.year})
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{req.service}</p>
                        <p className="text-[11px] text-slate-500 truncate" title={req.subject}>
                          {req.subject}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${isPastDeadline ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {new Date(req.deadline).toLocaleDateString()}
                        </span>
                        {isPastDeadline && (
                          <span className="block text-[10px] text-red-500 font-bold">Overdue</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 font-mono">
                          {req.quotation?.totalAmount ? `₹${req.quotation.totalAmount}` : 'Unquoted'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold font-mono">
                          Paid: ₹{req.paymentSummary?.totalPaid || 0}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req.requestId);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
