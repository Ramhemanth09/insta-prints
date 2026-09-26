import React, { useState } from 'react';
import { 
  FileUp, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  FileText, 
  Calendar, 
  User, 
  Layers, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Award,
  Zap,
  Lock
} from 'lucide-react';
import { SERVICES_LIST, BRANCHES_LIST } from '../../constants/statusWorkflow';
import { apiService } from '../../api/client';

export default function RequestForm({ onSubmitSuccess, onSwitchToTrack }) {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    branch: 'AIML',
    year: '3rd Year',
    section: 'A',
    mobile: '',
    email: '',
    service: 'Engineering Drawing',
    otherServiceExplanation: '',
    subject: '',
    requirements: '',
    deadline: '',
    specificInstructions: ''
  });

  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle File Selections
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 10) {
        setErrorMsg('Maximum 10 files allowed per request.');
        return;
      }
      setFiles(prev => [...prev, ...selected]);
      setErrorMsg('');
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.name.trim() || !formData.rollNumber.trim() || !formData.mobile.trim() || !formData.subject.trim() || !formData.requirements.trim() || !formData.deadline) {
      setErrorMsg('Please complete all required fields marked with *');
      return;
    }

    // Phone validation
    const cleanMobile = formData.mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (formData.service === 'Other' && !formData.otherServiceExplanation.trim()) {
      setErrorMsg('Please explain your requirements for the "Other" service category.');
      return;
    }

    const selectedDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setErrorMsg('Deadline date cannot be in the past.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
      });

      files.forEach(f => {
        data.append('files', f);
      });

      const response = await apiService.submitRequest(data);
      if (response.success) {
        onSubmitSuccess({
          requestId: response.requestId,
          mobile: formData.mobile,
          name: formData.name,
          service: formData.service
        });
      } else {
        setErrorMsg(response.message || 'Submission failed.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Hero Header & Value Props */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Professional Service Booking & Drafting Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
          Insta Prints Service Request
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Submit your project requirements, schematics, and formatting instructions. You will receive a unique <strong>Request ID</strong> to track progress, quotation, payments, and private chat.
        </p>

        {/* Commercial Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mt-6 text-left">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Guaranteed On-Time SLA</p>
              <p className="text-[10px] text-slate-500">Delivered strictly before deadline</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Standard Precision Drafting</p>
              <p className="text-[10px] text-slate-500">AutoCAD & Report specifications</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">100% Confidential</p>
              <p className="text-[10px] text-slate-500">Request ID scoped security</p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs sm:text-sm animate-pulse-subtle">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Submission Notice</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-100 p-6 sm:p-10">
        
        {/* Section 1: User Identity Dossier */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <User className="w-5 h-5 text-indigo-600" />
            <h2>1. User Identification Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Alex Johnson"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Roll Number / User ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Roll Number / User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g., 23AI089"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Branch (AIML, R&AI, IOT) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch / Specialization <span className="text-red-500">*</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {BRANCHES_LIST.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Year / Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Year / Level <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Post Graduate / Master">Post Graduate / Master</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section / Batch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="section"
                required
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g., A, B, or 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number (For Order Tracking) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g., 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional for notifications)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Service Selection & Requirements */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2>2. Service Scope & Problem Statement</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Service Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {SERVICES_LIST.map(svc => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>

            {/* Subject / Course */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject / Project Title & Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Computer Vision Project or Machine Drawing"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Conditional Other explanation */}
            {formData.service === 'Other' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-indigo-900 mb-1">
                  Please describe your custom service requirement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="otherServiceExplanation"
                  required
                  value={formData.otherServiceExplanation}
                  onChange={handleChange}
                  placeholder="Specify custom drafting, coding, or printing needs..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Submission Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Submission Deadline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  name="deadline"
                  required
                  min={minDateString}
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Specific Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Sheet / Page Formatting Standards
              </label>
              <input
                type="text"
                name="specificInstructions"
                value={formData.specificInstructions}
                onChange={handleChange}
                placeholder="e.g., A2 Sheet, First Angle Projection, Color Print, Spiral Binding"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Detailed Requirements */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Technical Specifications & Questions <span className="text-red-500">*</span>
              </label>
              <textarea
                name="requirements"
                rows={4}
                required
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List problem statements, software requirements (AutoCAD, Python, PPT), slide counts, dimensions, or specific grading criteria..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>
        </div>

        {/* Section 3: Reference Documents & Schematics Upload */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <FileUp className="w-5 h-5 text-indigo-600" />
              <h2>3. Upload Reference Files & Rough Schematics</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Up to 10 files (50MB limit)</span>
          </div>

          <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-6 text-center transition-all cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.dwg,.dxf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt,.png,.jpg,.jpeg,.webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                <FileUp className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Click to attach reference documents or drag and drop
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supported: PDF, DWG, DXF, Word DOCX, PPTX, Excel, Images, ZIP
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-slate-700">Attached Files ({files.length}):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate font-semibold text-slate-800">{file.name}</span>
                      <span className="text-slate-400 shrink-0">({formatSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Security Guarantee */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>End-to-end encrypted. Generated Request ID enables real-time tracking.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Request ID & Place Order</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Direct Tracking Link */}
      <div className="text-center mt-6">
        <p className="text-xs text-slate-500 font-medium">
          Already placed a request?{' '}
          <button
            onClick={onSwitchToTrack}
            className="text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-2 ml-1 cursor-pointer"
          >
            Track your order status & chat with studio →
          </button>
        </p>
      </div>

    </div>
  );
}
