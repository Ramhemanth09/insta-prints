import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Send, 
  FileUp, 
  Download, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  DollarSign, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  Check, 
  Shield, 
  RefreshCw 
} from 'lucide-react';
import { STATUS_WORKFLOW, getStatusMeta } from '../../constants/statusWorkflow';
import { apiService } from '../../api/client';

export default function AdminRequestDetailModal({ requestId, onClose, onRefreshList }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, quotation, status, payments, files, chat, history

  // Quotation Form State
  const [quoteTotal, setQuoteTotal] = useState('');
  const [quoteAdvPct, setQuoteAdvPct] = useState(50);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  // Status Form State
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('advance');
  const [payRef, setPayRef] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [savingPay, setSavingPay] = useState(false);

  // Deliverable Upload State
  const [uploadCategory, setUploadCategory] = useState('admin_deliverable');
  const [deliverableFiles, setDeliverableFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  // Load details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await apiService.getRequestDetails(requestId);
      if (res.success) {
        setData(res.data);
        setNextStatus(res.data.request.currentStatus);
        setQuoteTotal(res.data.request.quotation?.totalAmount || '');
        setQuoteAdvPct(res.data.request.quotation?.advancePercentage || 50);
        setQuoteNotes(res.data.request.quotation?.notes || '');
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      alert('Failed to load request: ' + (err.response?.data?.message || err.message));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchDetails();
    }
  }, [requestId]);

  // Scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Save Quotation
  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    const total = parseFloat(quoteTotal);
    if (isNaN(total) || total <= 0) {
      alert('Please enter a valid positive quotation amount.');
      return;
    }

    try {
      setSavingQuote(true);
      const res = await apiService.setQuotation(requestId, {
        totalAmount: total,
        advancePercentage: quoteAdvPct,
        notes: quoteNotes,
        autoUpdateStatus: true
      });
      if (res.success) {
        alert('Quotation saved and sent to user!');
        await fetchDetails();
        onRefreshList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save quotation.');
    } finally {
      setSavingQuote(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!nextStatus) return;

    try {
      setSavingStatus(true);
      const res = await apiService.updateRequestStatus(requestId, nextStatus, statusNote);
      if (res.success) {
        setStatusNote('');
        await fetchDetails();
        onRefreshList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter valid amount.');
      return;
    }

    try {
      setSavingPay(true);
      const res = await apiService.recordPayment({
        requestId,
        amount: amt,
        type: payType,
        status: 'paid',
        transactionRef: payRef,
        paymentMethod: payMethod
      });
      if (res.success) {
        setPayAmount('');
        setPayRef('');
        await fetchDetails();
        onRefreshList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSavingPay(false);
    }
  };

  // Upload Deliverables/Previews
  const handleUploadDeliverables = async (e) => {
    e.preventDefault();
    if (deliverableFiles.length === 0) return;

    try {
      setUploadingFiles(true);
      const formData = new FormData();
      formData.append('requestId', requestId);
      formData.append('fileCategory', uploadCategory);
      deliverableFiles.forEach(f => formData.append('files', f));

      const res = await apiService.uploadFiles(formData);
      if (res.success) {
        setDeliverableFiles([]);
        await fetchDetails();
        onRefreshList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload deliverable.');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setSendingChat(true);
      const res = await apiService.sendMessage(requestId, {
        text: chatInput.trim()
      });
      if (res.success) {
        setChatInput('');
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      alert('Failed to send chat: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingChat(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 flex items-center gap-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading Request Console...</span>
        </div>
      </div>
    );
  }

  const { request, files, statusHistory, payments } = data;
  const meta = getStatusMeta(request.currentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black bg-slate-800 text-emerald-400 px-3 py-1 rounded-lg">
              {request.requestId}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                  {request.subject}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {request.user.name} ({request.user.rollNumber}, {request.user.branch}) • Due: {new Date(request.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDetails}
              title="Refresh"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tab Strip */}
        <div className="flex bg-slate-50 border-b border-slate-200 px-4 gap-2 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('quotation')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quotation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Quotation Manager
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Workflow Status
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'files' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Files & Deliverables ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'chat' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Chat Thread ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Audit History
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Requirements</h4>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {request.requirements}
                  </p>

                  {request.specificInstructions && (
                    <div className="mt-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Specific Instructions</h4>
                      <p className="text-xs text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        {request.specificInstructions}
                      </p>
                    </div>
                  )}

                  {request.otherServiceExplanation && (
                    <div className="mt-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Custom Service Detail</h4>
                      <p className="text-xs text-indigo-900 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                        {request.otherServiceExplanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Identity Info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 border-b pb-2">User Profile</h4>
                <div>
                  <span className="text-slate-400">Name:</span>
                  <p className="font-bold text-slate-800">{request.user.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Roll Number:</span>
                  <p className="font-bold text-slate-800">{request.user.rollNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400">Branch & Class:</span>
                  <p className="font-semibold text-slate-800">{request.user.branch} • {request.user.year} ({request.user.section})</p>
                </div>
                <div>
                  <span className="text-slate-400">Mobile:</span>
                  <p className="font-semibold text-indigo-600">{request.user.mobile}</p>
                </div>
                {request.user.email && (
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <p className="font-semibold text-slate-800">{request.user.email}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: QUOTATION */}
          {activeTab === 'quotation' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>Issue / Update Service Quotation</span>
              </h4>

              <form onSubmit={handleSaveQuotation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Quotation Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quoteTotal}
                    onChange={(e) => setQuoteTotal(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Percentage: <strong>{quoteAdvPct}%</strong> (Minimum 50%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={quoteAdvPct}
                    onChange={(e) => setQuoteAdvPct(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>50% (Standard)</span>
                    <span>100% (Full Upfront)</span>
                  </div>
                </div>

                {quoteTotal > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-indigo-900">
                      <span>Advance Amount:</span>
                      <span>₹{Math.round((quoteTotal * quoteAdvPct) / 100)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-indigo-900">
                      <span>Remaining Balance:</span>
                      <span>₹{quoteTotal - Math.round((quoteTotal * quoteAdvPct) / 100)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quotation Notes / Terms for User
                  </label>
                  <textarea
                    rows={3}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Includes 2 revision rounds, printout binding, and AutoCAD DWG source files..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingQuote ? 'Saving Quotation...' : 'Issue & Send Quotation to User'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: WORKFLOW STATUS */}
          {activeTab === 'status' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Transition Order Workflow Status</span>
              </h4>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select New Status
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUS_WORKFLOW.map(s => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audit Note / Transition Reason
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Drafting completed, sent for user preview"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingStatus}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {savingStatus ? 'Updating Status...' : 'Apply Status Transition'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Record Payment Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Record Incoming Payment
                </h4>
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="e.g. 750"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                      <select
                        value={payType}
                        onChange={(e) => setPayType(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="advance">Advance</option>
                        <option value="remaining">Remaining</option>
                        <option value="full">Full Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Cash">Cash at Desk</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. UPI/2026/89481"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPay}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    {savingPay ? 'Recording...' : 'Record Payment & Auto-Confirm'}
                  </button>
                </form>
              </div>

              {/* Payments Ledger */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Payment History ({payments.length})
                </h4>
                {payments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p._id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">₹{p.amount} ({p.type})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">Ref: {p.transactionRef || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(p.recordedAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: FILES & DELIVERABLES */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              
              {/* Admin Upload Zone */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Upload Deliverable / Progress Proof
                </h4>

                <form onSubmit={handleUploadDeliverables} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="admin_deliverable">Final Deliverable (Finished Blueprint/Report)</option>
                      <option value="admin_preview">Work Preview / Draft Proof (For Review)</option>
                    </select>
                  </div>

                  <input
                    type="file"
                    multiple
                    onChange={(e) => setDeliverableFiles(Array.from(e.target.files || []))}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />

                  {deliverableFiles.length > 0 && (
                    <button
                      type="submit"
                      disabled={uploadingFiles}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      {uploadingFiles ? 'Uploading Files...' : `Upload ${deliverableFiles.length} Deliverable(s)`}
                    </button>
                  )}
                </form>
              </div>

              {/* All files in this Request */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Files Linked to Request ID ({files.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map(f => (
                    <div key={f._id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mr-1.5">
                          {f.uploadedBy}
                        </span>
                        <p className="font-bold text-slate-800 truncate" title={f.originalName}>{f.originalName}</p>
                        <p className="text-[10px] text-slate-400">{f.fileCategory} • {(f.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <a
                        href={apiService.getSecureFileUrl(f._id, request.requestId)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Get</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[460px] overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-12">No messages yet. Send a message to the user.</p>
                ) : (
                  messages.map((m, i) => {
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div key={i} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-400 mb-0.5">
                          {isAdmin ? 'You (Admin)' : `${request.user.name} (User)`} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs max-w-md ${
                          isAdmin ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send direct reply to user for this Request ID..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Full Transition Log ({statusHistory.length})
              </h4>
              <div className="space-y-3">
                {statusHistory.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="uppercase text-indigo-700">{h.status}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.changedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{h.note}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Operator: {h.changedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
