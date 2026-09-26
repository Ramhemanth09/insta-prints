import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequestForm from './components/UserPortal/RequestForm';
import SubmissionSuccessModal from './components/UserPortal/SubmissionSuccessModal';
import TrackingView from './components/UserPortal/TrackingView';
import AdminLogin from './components/AdminPortal/AdminLogin';
import AdminDashboard from './components/AdminPortal/AdminDashboard';
import AdminRequestDetailModal from './components/AdminPortal/AdminRequestDetailModal';
import SecurityLogsModal from './components/AdminPortal/SecurityLogsModal';
import { apiService } from './api/client';

export default function App() {
  // Navigation: 'user-submit' | 'user-track' | 'admin-login' | 'admin-dashboard'
  const [activeTab, setActiveTab] = useState('user-submit');

  // Admin Session State
  const [adminUser, setAdminUser] = useState(null);

  // Success Modal State
  const [submissionData, setSubmissionData] = useState(null);

  // Tracking Pre-fill
  const [trackParams, setTrackParams] = useState({ requestId: '', mobile: '' });

  // Admin Request Detail Modal
  const [selectedAdminRequestId, setSelectedAdminRequestId] = useState(null);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);

  // Check saved admin session
  useEffect(() => {
    const savedToken = localStorage.getItem('insta_admin_token');
    const savedEmail = localStorage.getItem('insta_admin_email');
    if (savedToken) {
      setAdminUser({ email: savedEmail || 'instaprints@gmail.com' });
    }

    const handleSessionExpired = () => {
      setAdminUser(null);
      setActiveTab('admin-login');
      alert('Admin session expired. Please log in again.');
    };

    window.addEventListener('admin-auth-expired', handleSessionExpired);
    return () => window.removeEventListener('admin-auth-expired', handleSessionExpired);
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('insta_admin_token');
    localStorage.removeItem('insta_admin_email');
    setAdminUser(null);
    setActiveTab('user-submit');
  };

  const handleAdminLoginSuccess = (admin) => {
    setAdminUser(admin);
    setActiveTab('admin-dashboard');
  };

  const handleSubmitSuccess = (data) => {
    setSubmissionData(data);
    setTrackParams({ requestId: data.requestId, mobile: data.mobile });
  };

  const handleTrackNowFromModal = () => {
    setSubmissionData(null);
    setActiveTab('user-track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* Universal Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main App Workspace Router */}
      <main className="flex-1">
        {activeTab === 'user-submit' && (
          <RequestForm
            onSubmitSuccess={handleSubmitSuccess}
            onSwitchToTrack={() => setActiveTab('user-track')}
          />
        )}

        {activeTab === 'user-track' && (
          <TrackingView
            initialRequestId={trackParams.requestId}
            initialMobile={trackParams.mobile}
          />
        )}

        {activeTab === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onSwitchToUser={() => setActiveTab('user-submit')}
          />
        )}

        {activeTab === 'admin-dashboard' && (
          adminUser ? (
            <AdminDashboard
              adminUser={adminUser}
              onSelectRequest={(reqId) => setSelectedAdminRequestId(reqId)}
              onOpenSecurityLogs={() => setShowSecurityLogs(true)}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onSwitchToUser={() => setActiveTab('user-submit')}
            />
          )
        )}
      </main>

      {/* Submission Celebratory Modal */}
      {submissionData && (
        <SubmissionSuccessModal
          submissionData={submissionData}
          onClose={() => setSubmissionData(null)}
          onTrackNow={handleTrackNowFromModal}
        />
      )}

      {/* Admin Request Inspector Modal */}
      {selectedAdminRequestId && (
        <AdminRequestDetailModal
          requestId={selectedAdminRequestId}
          onClose={() => setSelectedAdminRequestId(null)}
          onRefreshList={() => {}}
        />
      )}

      {/* Admin Security Logs Audit Modal */}
      {showSecurityLogs && (
        <SecurityLogsModal
          onClose={() => setShowSecurityLogs(false)}
        />
      )}

      {/* Universal Modern Footer */}
      <Footer
        onSwitchToAdmin={() => {
          if (adminUser) setActiveTab('admin-dashboard');
          else setActiveTab('admin-login');
        }}
      />

    </div>
  );
}
