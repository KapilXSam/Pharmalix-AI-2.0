
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { View, Profile, DoctorView, AdminView, Consultation } from './types';
import { supabase } from './lib/supabaseClient';
import { SettingsProvider } from './contexts/SettingsContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Auth from './components/auth/Auth';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorState from './components/ErrorState';
import DoctorSidebar from './components/doctor/DoctorSidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import SuspenseLoading from './components/SuspenseLoading';
import { useAuth } from './hooks/useAuth';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { clearAllClientCookies, clearNonAuthCookies } from './lib/utils';
import Notification from './components/Notification';
import EmergencyModal from './components/EmergencyModal';
import SessionTimeoutModal from './components/SessionTimeoutModal';

// Lazy-loaded common components
const NewsTicker = lazy(() => import('./components/NewsTicker'));

// Patient Views (Lazy Loaded)
const Dashboard = lazy(() => import('./components/Dashboard'));
const AiChatbot = lazy(() => import('./components/AiChatbot'));
const ConnectDoctor = lazy(() => import('./components/ConnectDoctor'));
const SymptomChecker = lazy(() => import('./components/SymptomChecker'));
const XRayAnalyzer = lazy(() => import('./components/XRayAnalyzer'));
const LabTestAnalyzer = lazy(() => import('./components/LabTestAnalyzer'));
const PrescriptionAnalyzer = lazy(() => import('./components/PrescriptionAnalyzer'));
const Pharmacies = lazy(() => import('./components/Pharmacies'));
const Donate = lazy(() => import('./components/Donate'));
const CTAnalyzer = lazy(() => import('./components/CTAnalyzer'));
const MRIAnalyzer = lazy(() => import('./components/MRIAnalyzer'));
const ECGAnalyzer = lazy(() => import('./components/ECGAnalyzer'));
const EEGAnalyzer = lazy(() => import('./components/EEGAnalyzer'));
const DermaScanAnalyzer = lazy(() => import('./components/DermaScanAnalyzer'));
const PainLocator = lazy(() => import('./components/PainLocator'));
const UserSettings = lazy(() => import('./components/UserSettings'));
const MedicineSearch = lazy(() => import('./components/MedicineSearch'));
const LiveChat = lazy(() => import('./components/LiveChat'));
const PatientMessages = lazy(() => import('./components/patient/Messages'));
const PrakrutiParikshana = lazy(() => import('./components/PrakrutiParikshana'));
const PrakrutiProgress = lazy(() => import('./components/PrakrutiProgress'));
const DiabeticRetinopathyAnalyzer = lazy(() => import('./components/DiabeticRetinopathyAnalyzer'));


// Doctor Views (Lazy Loaded)
const DoctorDashboard = lazy(() => import('./components/DoctorDashboard'));
const MyPatients = lazy(() => import('./components/doctor/MyPatients'));
const Messages = lazy(() => import('./components/doctor/Messages'));
const MySchedule = lazy(() => import('./components/doctor/MySchedule'));
const ConsultationDetails = lazy(() => import('./components/doctor/ConsultationDetails'));

// Admin Views (Lazy Loaded)
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const PlatformAnalytics = lazy(() => import('./components/admin/PlatformAnalytics'));

interface AppShellProps {
    profile: Profile;
    onLogout: () => void;
    onEmergency: () => void;
}

// Patient application shell
const PatientApp = ({ profile, onLogout, onEmergency }: AppShellProps) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeChat, setActiveChat] = useState<{ consultationId: number; doctor: Profile } | null>(null);

  const handleStartChat = async (doctor: Profile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to start a chat.");

    const { error: linkError } = await supabase
      .from('patient_doctor_links')
      .upsert({
          patient_id: user.id,
          doctor_id: doctor.id,
          relationship_type: 'consultation',
          active: true
      }, {
          onConflict: 'patient_id, doctor_id'
      });

    if (linkError) {
      console.error("Failed to create/update patient-doctor link:", linkError);
    }

    const { data: newConsultation, error } = await supabase
        .from('consultations')
        .insert({
            patient_id: user.id,
            doctor_id: doctor.id,
            subject: `Live Chat with ${doctor.full_name}`
        })
        .select()
        .single();
    
    if (error) throw error;
    if (!newConsultation) throw new Error("Failed to create consultation record.");

    setActiveChat({
        consultationId: newConsultation.id,
        doctor: doctor
    });
    setCurrentView('live-chat');
  };

  const handleViewConsultation = (consultation: Consultation & { profiles?: Partial<Profile> }) => {
    const doctorProfile: Profile = {
        id: consultation.doctor_id,
        full_name: consultation.profiles?.full_name || 'Doctor',
        avatar_url: consultation.profiles?.avatar_url || null,
        role: 'doctor',
        email: null, phone: null, dob: null, created_at: '', updated_at: ''
    };

    setActiveChat({
        consultationId: consultation.id,
        doctor: doctorProfile
    });
    setCurrentView('live-chat');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} onEmergency={onEmergency} onViewConsultation={handleViewConsultation} />;
      case 'chatbot':
        return <AiChatbot />;
      case 'connect-doctor':
        return <ConnectDoctor onStartChat={handleStartChat} />;
      case 'messages':
        return <PatientMessages onManageConsultation={handleViewConsultation} />;
      case 'live-chat':
          return activeChat ? <LiveChat consultationId={activeChat.consultationId} doctor={activeChat.doctor} onBack={() => { setActiveChat(null); setCurrentView('messages'); }} /> : <ConnectDoctor onStartChat={handleStartChat} />;
      case 'symptom-checker':
        return <SymptomChecker />;
      case 'prakruti-parikshana':
        return <PrakrutiParikshana setCurrentView={setCurrentView} />;
      case 'prakruti-progress':
        return <PrakrutiProgress setCurrentView={setCurrentView} />;
      case 'xray-analyzer':
        return <XRayAnalyzer />;
      case 'lab-test-analyzer':
        return <LabTestAnalyzer />;
      case 'prescription-analyzer':
        return <PrescriptionAnalyzer />;
      case 'ct-analyzer':
        return <CTAnalyzer />;
      case 'mri-analyzer':
        return <MRIAnalyzer />;
      case 'ecg-analyzer':
        return <ECGAnalyzer />;
      case 'eeg-analyzer':
        return <EEGAnalyzer />;
      case 'derma-scan-analyzer':
        return <DermaScanAnalyzer />;
      case 'diabetic-retinopathy-analyzer':
        return <DiabeticRetinopathyAnalyzer />;
      case 'pain-locator':
        return <PainLocator />;
      case 'medicine-search':
        return <MedicineSearch />;
      case 'pharmacies':
        return <Pharmacies />;
      case 'donate':
        return <Donate />;
      case 'settings':
        return <UserSettings profile={profile} />;
      default:
        return <Dashboard setCurrentView={setCurrentView} onEmergency={onEmergency} onViewConsultation={handleViewConsultation} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Health Overview',
    chatbot: 'AI Triage Chatbot',
    'connect-doctor': 'Connect with a Doctor',
    'messages': 'My Consultations',
    'live-chat': 'Live Chat',
    'symptom-checker': 'AI Symptom Checker',
    'prakruti-parikshana': 'Ayurvedic Prakruti Analysis',
    'prakruti-progress': 'Prakruti Progress Tracker',
    'xray-analyzer': 'CXR Analyzer',
    'lab-test-analyzer': 'Lab Test Analyzer',
    'prescription-analyzer': 'Prescription Analyzer',
    'ct-analyzer': 'CT Scan Analyzer',
    'mri-analyzer': 'MRI Scan Analyzer',
    'ecg-analyzer': 'ECG Analyzer',
    'eeg-analyzer': 'EEG Analyzer',
    'derma-scan-analyzer': 'Derma Scan Analyzer',
    'diabetic-retinopathy-analyzer': 'Diabetic Retinopathy Analyzer',
    'pain-locator': 'AI Pain Locator',
    'medicine-search': 'Medicine Database',
    pharmacies: 'Find Nearby Pharmacies',
    donate: 'Donate for Medical Aid',
    settings: 'Settings',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={viewTitles[currentView]} profile={profile} setCurrentView={setCurrentView} onLogout={onLogout} onEmergency={onEmergency} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <Suspense fallback={null}>
            <NewsTicker />
          </Suspense>
          <Suspense fallback={<SuspenseLoading />}>
            <ErrorBoundary onReset={() => setCurrentView('dashboard')}>
              {renderView()}
            </ErrorBoundary>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// Doctor application shell
const DoctorApp = ({ profile, onLogout, onEmergency }: AppShellProps) => {
    const [currentView, setCurrentView] = useState<DoctorView>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(null);

    const handleManageConsultation = (consultationId: number) => {
        setSelectedConsultationId(consultationId);
        setCurrentView('consultation-details');
    };
    
    const renderView = () => {
        const dashboard = <DoctorDashboard setCurrentView={setCurrentView} onManageConsultation={handleManageConsultation} />;

        switch (currentView) {
            case 'dashboard':
                return dashboard;
            case 'patients':
                return <MyPatients />;
            case 'messages':
                return <Messages onManageConsultation={handleManageConsultation} />;
            case 'schedule':
                return <MySchedule />;
            case 'consultation-details':
                if (!selectedConsultationId) return dashboard;
                return <ConsultationDetails consultationId={selectedConsultationId} onBack={() => setCurrentView('messages')} />;
            case 'medicine-search':
                return <MedicineSearch />;
            case 'settings':
                return <UserSettings profile={profile} />;
            default:
                return dashboard;
        }
    };
    
    const viewTitles: Record<DoctorView, string> = {
        dashboard: 'Doctor Dashboard',
        patients: 'My Patients',
        messages: 'Messages',
        schedule: 'My Schedule',
        'medicine-search': 'Medicine Database',
        settings: 'Settings',
        'consultation-details': 'Consultation Room'
    };

    return (
        <div className="flex min-h-screen">
            <DoctorSidebar 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={viewTitles[currentView]} profile={profile} setCurrentView={setCurrentView} onLogout={onLogout} onEmergency={onEmergency} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                  <Suspense fallback={null}>
                    <NewsTicker />
                  </Suspense>
                  <Suspense fallback={<SuspenseLoading />}>
                    <ErrorBoundary onReset={() => setCurrentView('dashboard')}>
                        {renderView()}
                    </ErrorBoundary>
                  </Suspense>
                </div>
            </main>
        </div>
    );
}

// Admin application shell
const AdminApp = ({ profile, onLogout, onEmergency }: AppShellProps) => {
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                 return <AdminDashboard setCurrentView={setCurrentView} />;
            case 'users':
                 return <UserManagement />;
            case 'analytics':
                 return <PlatformAnalytics />;
            case 'settings':
                return <UserSettings profile={profile} />;
            default:
                 return <AdminDashboard setCurrentView={setCurrentView} />;
        }
    };
    
     const viewTitles: Record<AdminView, string> = {
        dashboard: 'Admin Dashboard',
        users: 'User Management',
        analytics: 'Platform Analytics',
        settings: 'Settings',
    };

    return (
        <div className="flex min-h-screen">
            <AdminSidebar 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={viewTitles[currentView]} profile={profile} setCurrentView={setCurrentView} onLogout={onLogout} onEmergency={onEmergency} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                  <Suspense fallback={null}>
                    <NewsTicker />
                  </Suspense>
                  <Suspense fallback={<SuspenseLoading />}>
                    <ErrorBoundary onReset={() => setCurrentView('dashboard')}>
                        {renderView()}
                    </ErrorBoundary>
                  </Suspense>
                </div>
            </main>
        </div>
    );
};


const AppContent = () => {
    const { session, profile, loading, profileError, setProfileError } = useAuth();
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

    const handleLogout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out from Supabase:', error.message);
        }
        clearAllClientCookies();
        sessionStorage.clear();
        localStorage.clear();
    }, []);

    const { isWarningVisible, handleStayLoggedIn } = useSessionTimeout({
        onLogout: handleLogout,
        enabled: !!session,
        timeout: 15 * 60 * 1000, // 15 minutes
        warningTime: 1 * 60 * 1000 // 1 minute warning
    });
    
    useEffect(() => {
        if (session) {
            const cookieClearInterval = setInterval(clearNonAuthCookies, 5 * 60 * 1000);
            return () => clearInterval(cookieClearInterval);
        }
    }, [session]);
    
    const handleRetryAuth = useCallback(() => {
        setProfileError(null);
        window.location.reload();
    }, [setProfileError]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (profileError) {
        return (
             <div className="flex items-center justify-center h-screen bg-[hsl(var(--muted))]">
                <ErrorState message={profileError} onRetry={handleRetryAuth} />
            </div>
        )
    }
    
    if (!session || !profile) {
        return <Auth />;
    }

    const onEmergency = () => setIsEmergencyModalOpen(true);
    const appProps = { profile, onLogout: handleLogout, onEmergency };

    return (
        <>
            {(() => {
                switch(profile.role) {
                    case 'doctor':
                        return <DoctorApp {...appProps} />;
                    case 'admin':
                        return <AdminApp {...appProps} />;
                    case 'patient':
                    default:
                        return <PatientApp {...appProps} />;
                }
            })()}
            <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} profile={profile} />
            <SessionTimeoutModal
                isOpen={isWarningVisible}
                onStay={handleStayLoggedIn}
                onLogout={handleLogout}
            />
        </>
    );
};

const App = () => (
    <SettingsProvider>
        <AppContentWrapper />
    </SettingsProvider>
);

// A wrapper component is needed to access the context from SettingsProvider
const AppContentWrapper = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    
    // Logic to show welcome notification only once per session
    useEffect(() => {
      if (!sessionStorage.getItem('welcomeNotificationShown')) {
        setShowWelcome(true);
        sessionStorage.setItem('welcomeNotificationShown', 'true');
      }
    }, []);

    return (
        <>
            <AppContent />
            {showWelcome && (
                <Notification
                    title="Welcome to Pharmalix AI!"
                    message="For your security, please remember to log out when your session is complete. Stay Healthy! ♥️"
                    onClose={() => setShowWelcome(false)}
                />
            )}
        </>
    );
};

export default App;
