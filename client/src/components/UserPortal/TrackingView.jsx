import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Download, 
  Send, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  User, 
  Layers, 
  RefreshCw,
  Printer,
  Copy,
  Check,
  Zap,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { STATUS_WORKFLOW, getStatusMeta } from '../../constants/statusWorkflow';
import { apiService } from '../../api/client';

export default function TrackingView({ initialRequestId = '', initialMobile = '' }) {
  const [requestIdInput, setRequestIdInput] = useState(initialRequestId);
  const [mobileInput, setMobileInput] = useState(initialMobile);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Loaded Data
  const [requestData, setRequestData] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, files, chat, payments, receipt, history

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  // Payment Ref Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTypeSelected, setPaymentTypeSelected] = useState('advance');
  const [txnRefInput, setTxnRefInput] = useState('');
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Quotation acceptance state
  const [isAcceptingQuotation, setIsAcceptingQuotation] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (initialRequestId && initialMobile) {
      handleTrackSubmit(null, initialRequestId, initialMobile);
    }
  }, [initialRequestId, initialMobile]);

  useEffect(() => {
    if (!isVerified || !requestData) return;

    const interval = setInterval(() => {
      fetchLatestData(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [isVerified, requestData]);

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleTrackSubmit = async (e, forcedId, forcedMobile) => {
    if (e) e.preventDefault();
    setAuthError('');

    const targetId = forcedId || requestIdInput;
    const targetMobile = forcedMobile || mobileInput;

    if (!targetId.trim() || !targetMobile.trim()) {
      setAuthError('Please enter both your Request ID and registered mobile number.');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await apiService.trackRequest(targetId.trim(), targetMobile.trim());
      if (res.success) {
        setRequestData(res.data.request);
        setFilesList(res.data.files || []);
        setStatusHistory(res.data.statusHistory || []);
        setPaymentsList(res.data.payments || []);
        setIsVerified(true);
        fetchMessages(targetId.trim(), targetMobile.trim());
      } else {
        setAuthError(res.message || 'Verification failed.');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid Request ID or Mobile number mismatch.');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchLatestData = async (showLoading = true) => {
    if (!requestData) return;
    try {
      if (showLoading) setIsVerifying(true);
      const res = await apiService.trackRequest(requestData.requestId, requestData.user.mobile);
      if (res.success) {
        setRequestData(res.data.request);
        setFilesList(res.data.files || []);
        setStatusHistory(res.data.statusHistory || []);
        setPaymentsList(res.data.payments || []);
        fetchMessages(requestData.requestId, requestData.user.mobile);
      }
    } catch (err) {
      console.warn('Background refresh error:', err);
    } finally {
      if (showLoading) setIsVerifying(false);
    }
  };

  const fetchMessages = async (reqId, mob) => {
    try {
      const res = await apiService.getMessages(reqId, mob);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.warn('Error loading chat:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setIsSendingChat(true);
      const res = await apiService.sendMessage(requestData.requestId, {
        text: chatInput.trim(),
        mobileNumber: requestData.user.mobile
      });
      if (res.success) {
        setChatInput('');
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleAcceptQuotation = async () => {
    if (!window.confirm('Accept this quotation and proceed to advance payment?')) return;
    try {
      setIsAcceptingQuotation(true);
      const res = await apiService.acceptQuotation(requestData.requestId, requestData.user.mobile);
      if (res.success) {
        await fetchLatestData(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept quotation.');
    } finally {
      setIsAcceptingQuotation(false);
    }
  };

  const handleSubmitTxnRef = async (e) => {
    e.preventDefault();
    if (!txnRefInput.trim()) return;

    try {
      setIsSubmittingTxn(true);
      const res = await apiService.submitPaymentRef({
        requestId: requestData.requestId,
        mobileNumber: requestData.user.mobile,
        transactionRef: txnRefInput.trim(),
        paymentType: paymentTypeSelected,
        amount: paymentTypeSelected === 'advance' 
          ? requestData.quotation?.advanceAmount 
          : requestData.quotation?.remainingAmount
      });

      if (res.success) {
        setPaymentSuccessMsg('Transaction reference recorded! Admin will verify and confirm your order shortly.');
        setTxnRefInput('');
        setShowPaymentModal(false);
        await fetchLatestData(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit transaction reference.');
    } finally {
      setIsSubmittingTxn(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('instaprints@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const currentMeta = requestData ? getStatusMeta(requestData.currentStatus) : null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Verification Gate */}
      {!isVerified ? (
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-100 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Track Service Order
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Enter your <strong>Request ID</strong> and <strong>registered mobile number</strong> to access your order dossier, files, payments, and private chat.
            </p>

            {authError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleTrackSubmit(e)} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Request ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requestIdInput}
                  onChange={(e) => setRequestIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g., IP-2026-89421"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  placeholder="e.g., 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Open Order Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confidential. Accessible only via matching mobile authorization.</span>
            </div>

          </div>
        </div>
      ) : (
        /* VERIFIED ORDER WORKSPACE */
        <div className="space-y-6">
          
          {/* Top Order Badge & Controls */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold bg-slate-900 text-emerald-400 px-3 py-1 rounded-lg">
                  {requestData.requestId}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentMeta?.color || 'bg-slate-100 text-slate-800'}`}>
                  {currentMeta?.label}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {requestData.service}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {requestData.subject}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Deadline: <strong className="text-slate-800">{new Date(requestData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> • Client: <strong className="text-slate-800">{requestData.user.name}</strong> ({requestData.user.rollNumber}, {requestData.user.branch})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLatestData(true)}
                disabled={isVerifying}
                title="Refresh Status & Messages"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsVerified(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Exit Order
              </button>
            </div>
          </div>

          {/* Workflow Stepper Bar */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
              <span>Order Fulfillment Progression</span>
              <span className="text-indigo-600 font-bold">{currentMeta?.description}</span>
            </h3>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-[760px] justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                {STATUS_WORKFLOW.filter(s => s.step > 0).map((stepItem) => {
                  const isCurrent = stepItem.key === requestData.currentStatus;
                  const isPast = (currentMeta?.step || 0) > stepItem.step;
                  return (
                    <div key={stepItem.key} className="flex flex-col items-center relative z-10 text-center px-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110 shadow-md' 
                          : isPast 
                            ? 'bg-emerald-500 text-white shadow-xs' 
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}>
                        {isPast ? <Check className="w-4 h-4" /> : stepItem.step}
                      </div>
                      <span className={`text-[11px] font-semibold mt-2 max-w-[75px] leading-tight ${
                        isCurrent ? 'text-indigo-700 font-bold' : isPast ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {stepItem.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Callout if quotation sent */}
          {requestData.quotation?.totalAmount > 0 && !requestData.quotation?.isAccepted && (
            <div className="p-6 rounded-3xl bg-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">Official Quotation Issued</span>
                <h4 className="text-xl font-bold text-white mt-1">
                  Total Amount: ₹{requestData.quotation.totalAmount} (50% Advance: ₹{requestData.quotation.advanceAmount})
                </h4>
                <p className="text-xs text-indigo-200 mt-1">
                  {requestData.quotation.notes || 'Please accept the quotation to proceed with advance payment and start production.'}
                </p>
              </div>
              <button
                onClick={handleAcceptQuotation}
                disabled={isAcceptingQuotation}
                className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                {isAcceptingQuotation ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Quotation & Proceed</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Payment Prompt if awaiting advance or remaining */}
          {((requestData.currentStatus === 'awaiting_advance_payment' && !requestData.paymentSummary?.advancePaid) ||
            (requestData.currentStatus === 'awaiting_remaining_payment' && !requestData.paymentSummary?.remainingPaid)) && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-700">Payment Action Required</span>
                <h4 className="text-base font-bold text-amber-950 mt-1">
                  {requestData.currentStatus === 'awaiting_advance_payment' 
                    ? `Advance Payment Due: ₹${requestData.quotation?.advanceAmount || 0}`
                    : `Final Remaining Balance Due: ₹${requestData.quotation?.remainingAmount || 0}`
                  }
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Transfer via UPI to <strong className="font-mono">instaprints@upi</strong> or pay at studio desk, then submit your transaction reference number.
                </p>
              </div>
              <button
                onClick={() => {
                  setPaymentTypeSelected(requestData.currentStatus === 'awaiting_advance_payment' ? 'advance' : 'remaining');
                  setShowPaymentModal(true);
                }}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <CreditCard className="w-4 h-4" />
                <span>Submit UTR / Ref Number</span>
              </button>
            </div>
          )}

          {paymentSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{paymentSuccessMsg}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Order Dossier</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'files'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Files & Deliverables ({filesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Studio Chat ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Gateway / UPI</span>
            </button>

            <button
              onClick={() => setActiveTab('receipt')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'receipt'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Official Invoice Receipt</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Status Timeline ({statusHistory.length})</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Project Requirements
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {requestData.requirements}
                  </p>

                  {requestData.specificInstructions && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Formatting & Sheet Instructions
                      </h4>
                      <p className="text-xs text-slate-700 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
                        {requestData.specificInstructions}
                      </p>
                    </div>
                  )}

                  {requestData.otherServiceExplanation && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                        Custom Service Notes
                      </h4>
                      <p className="text-xs text-indigo-900 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                        {requestData.otherServiceExplanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                    Client Details
                  </h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <p className="font-bold text-slate-900">{requestData.user.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">User ID / Roll No:</span>
                      <p className="font-bold text-slate-900 uppercase font-mono">{requestData.user.rollNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Branch & Specialization:</span>
                      <p className="font-semibold text-slate-800">{requestData.user.branch} • {requestData.user.year} (Sec {requestData.user.section})</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile:</span>
                      <p className="font-semibold text-indigo-600">{requestData.user.mobile}</p>
                    </div>
                    {requestData.user.email && (
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <p className="font-semibold text-slate-800">{requestData.user.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Financial Status
                  </h4>
                  <div className="text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Quotation Total:</span>
                      <strong className="text-white font-mono">₹{requestData.quotation?.totalAmount || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <strong className="text-emerald-400 font-mono">₹{requestData.paymentSummary?.totalPaid || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Balance:</span>
                      <strong className="text-amber-300 font-mono">
                        ₹{Math.max(0, (requestData.quotation?.totalAmount || 0) - (requestData.paymentSummary?.totalPaid || 0))}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FILES */}
          {activeTab === 'files' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deliverable Repository ({filesList.length})
                </h4>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Download Stream
                </span>
              </div>

              {filesList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No files attached to this request yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filesList.map((file) => {
                    const downloadUrl = apiService.getSecureFileUrl(file._id, requestData.requestId, requestData.user.mobile);
                    const isDeliverable = file.fileCategory === 'admin_deliverable';
                    const isPreview = file.fileCategory === 'admin_preview';

                    return (
                      <div 
                        key={file._id} 
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          isDeliverable 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : isPreview 
                              ? 'bg-indigo-50/60 border-indigo-200' 
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isDeliverable 
                                ? 'bg-emerald-600 text-white' 
                                : isPreview 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isDeliverable ? 'Final Deliverable' : isPreview ? 'Work Preview' : 'Reference File'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(file.uploadedAt || file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate" title={file.originalName}>
                            {file.originalName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType}
                          </p>
                        </div>

                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-2xs transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Download</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[520px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Private Request Chat Thread
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Direct channel with Insta Prints Studio
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-mono font-bold">
                  {requestData.requestId}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No messages in this request thread yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Send a message below to ask questions or discuss drafting details.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender === 'user';
                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-500">
                            {isMe ? 'You (Client)' : 'Insta Prints Studio'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message regarding this request..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSendingChat ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: PAYMENTS & UPI */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Payment Channels & UPI Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  
                  {/* UPI Box */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">UPI Instant Transfer</span>
                      <QrCode className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-indigo-200 flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-900">instaprints@upi</span>
                      <button
                        onClick={handleCopyUpi}
                        className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Scan or pay via Google Pay, PhonePe, Paytm, or BHIM UPI to complete advance or remaining balance.
                    </p>
                  </div>

                  {/* Cash / Desk Pay */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Studio Desk Payment</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You may also settle payment in cash or via card swipe directly at the Insta Prints Studio front desk by providing your Request ID.
                    </p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Submit Payment Reference ID</span>
                    </button>
                  </div>

                </div>

                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Transaction Audit Log ({paymentsList.length})
                </h5>
                {paymentsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentsList.map((pay) => (
                      <div key={pay._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 font-mono">₹{pay.amount}</span>
                            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                              {pay.type}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              pay.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pay.status}
                            </span>
                          </div>
                          {pay.transactionRef && (
                            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                              Ref: {pay.transactionRef}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(pay.recordedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: OFFICIAL INVOICE RECEIPT */}
          {activeTab === 'receipt' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">IP</div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Insta Prints</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Official Service Quotation & Tax Invoice Receipt</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-500">INVOICE FOR</span>
                  <p className="font-mono text-sm font-bold text-indigo-600">{requestData.requestId}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Billed To:</p>
                  <p className="text-slate-700">{requestData.user.name}</p>
                  <p className="text-slate-500">Roll/ID: {requestData.user.rollNumber}</p>
                  <p className="text-slate-500">{requestData.user.branch} ({requestData.user.year})</p>
                  <p className="text-slate-500">Mobile: {requestData.user.mobile}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Studio Provider:</p>
                  <p className="text-slate-700">Insta Prints Academic & Engineering</p>
                  <p className="text-slate-500">Contact: instaprints@gmail.com</p>
                  <p className="text-slate-500">Fulfillment Status: <strong className="text-emerald-600 uppercase">{currentMeta?.label}</strong></p>
                </div>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-t border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{requestData.service}</p>
                      <p className="text-slate-500 text-[11px]">{requestData.subject}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{requestData.quotation?.totalAmount || 0}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td className="py-2 px-3 font-bold text-slate-700">Total Billed:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{requestData.quotation?.totalAmount || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-700">Total Paid Amount:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">₹{requestData.paymentSummary?.totalPaid || 0}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2 px-3 font-bold text-slate-900">Balance Remaining:</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-amber-700">
                      ₹{Math.max(0, (requestData.quotation?.totalAmount || 0) - (requestData.paymentSummary?.totalPaid || 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Invoice Receipt</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: STATUS HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Lifecycle Status Audit Trail ({statusHistory.length})
              </h4>
              <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
                {statusHistory.map((hist, i) => (
                  <div key={hist._id || i} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 uppercase">
                        {hist.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(hist.changedAt).toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        by {hist.changedBy}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {hist.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Manual Payment Reference Submission Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Submit Transaction Reference
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter your UPI / Bank UTR transaction ID for payment verification.
            </p>

            <form onSubmit={handleSubmitTxnRef} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={paymentTypeSelected}
                  onChange={(e) => setPaymentTypeSelected(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="advance">Advance Payment (₹{requestData?.quotation?.advanceAmount || 0})</option>
                  <option value="remaining">Remaining Balance (₹{requestData?.quotation?.remainingAmount || 0})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Reference Number / UTR <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={txnRefInput}
                  onChange={(e) => setTxnRefInput(e.target.value)}
                  placeholder="e.g., UPI/2026/9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingTxn}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingTxn ? 'Submitting...' : 'Submit Reference'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
