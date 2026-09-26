export const STATUS_WORKFLOW = [
  { key: 'submitted', label: 'Submitted', description: 'Request received and queued for review', step: 1, color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { key: 'under_review', label: 'Under Review', description: 'Admin is evaluating requirements and effort', step: 2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'quotation_sent', label: 'Quotation Sent', description: 'Pricing details and advance terms issued', step: 3, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'awaiting_confirmation', label: 'Awaiting Confirmation', description: 'Awaiting user quotation acceptance', step: 4, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'awaiting_advance_payment', label: 'Awaiting Advance', description: '50% advance payment required to start work', step: 5, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'confirmed', label: 'Order Confirmed', description: 'Advance received; order approved and scheduled', step: 6, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'work_in_progress', label: 'Work in Progress', description: 'Design/drafting/printing underway', step: 7, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { key: 'review_or_revision', label: 'Review & Revision', description: 'Deliverable drafted; internal QA or user feedback check', step: 8, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'ready_for_final_delivery', label: 'Ready for Delivery', description: 'Completed files prepared for final handover', step: 9, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'awaiting_remaining_payment', label: 'Awaiting Remaining Pay', description: 'Pending final balance clearance before file unlock', step: 10, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'completed', label: 'Completed', description: 'Order fully fulfilled and closed', step: 11, color: 'bg-green-50 text-green-700 border-green-300' },
  { key: 'cancelled', label: 'Cancelled', description: 'Request closed without completion', step: -1, color: 'bg-red-50 text-red-700 border-red-200' }
];

export const SERVICES_LIST = [
  'Engineering Drawing',
  'AutoCAD Drawing',
  'Printout Arrangement',
  'CBP Project Development',
  'Project Report & Documentation',
  'PPT & Presentation Support',
  'Other'
];

export const BRANCHES_LIST = [
  'AIML',
  'R&AI',
  'IOT'
];

export const getStatusMeta = (statusKey) => {
  const found = STATUS_WORKFLOW.find(s => s.key === statusKey);
  return found || {
    key: statusKey,
    label: statusKey ? statusKey.replace(/_/g, ' ') : 'Unknown',
    description: '',
    step: 0,
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  };
};
