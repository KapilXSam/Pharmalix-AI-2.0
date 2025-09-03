
import React, { useState } from 'react';
import type { View } from '../types';
import { 
    LayoutDashboard, HeartPulse, Bone, Scan, BrainCircuit, Activity, Waves, Layers, MapPin, 
    FlaskConical, ClipboardList, MessageSquare, Stethoscope, Store, Pill, HeartHandshake, ArrowLeft, ArrowRight
} from 'lucide-react';
import Modal from './Modal';
import Tooltip from './Tooltip';
import { useSettings } from '../contexts/SettingsContext';

interface SidebarProps {
  currentView: View;
  setCurrentView: React.Dispatch<React.SetStateAction<View>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed }) => {
  const content = (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center w-full text-sm font-medium rounded-lg transition-all duration-200 ease-in-out group relative
        ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}
        ${
          isActive
            ? 'text-white shadow-lg bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]'
            : 'text-slate-400 hover:bg-sky-500/10 dark:hover:bg-sky-500/10 hover:text-sky-300 dark:hover:text-sky-300'
        }`}
    >
      {!isActive && <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_hsl(var(--primary)_/_0.5)]"></div>}
      <span className={isCollapsed ? '' : 'mr-4'}>{icon}</span>
      <span className={`transform transition-transform duration-200 whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
    </button>
  );

  return isCollapsed ? <Tooltip content={label} position="right">{content}</Tooltip> : content;
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, setIsCollapsed }) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const { isLiteMode } = useSettings();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5"/> },
    { id: 'chatbot', label: 'AI Triage Chat', icon: <MessageSquare className="h-5 w-5"/> },
    { id: 'connect-doctor', label: 'Connect Doctor', icon: <Stethoscope className="h-5 w-5"/> },
  ];
  
  const allAnalyzerItems = [
    { id: 'symptom-checker', label: 'Symptom Checker', icon: <HeartPulse className="h-5 w-5"/> },
    { id: 'xray-analyzer', label: 'CXR Analyzer', icon: <Bone className="h-5 w-5"/> },
    { id: 'lab-test-analyzer', label: 'Lab Test Analyzer', icon: <FlaskConical className="h-5 w-5"/> },
    { id: 'prescription-analyzer', label: 'Prescription Analyzer', icon: <ClipboardList className="h-5 w-5"/> },
    { id: 'ct-analyzer', label: 'CT Scan Analyzer', icon: <Scan className="h-5 w-5"/> },
    { id: 'mri-analyzer', label: 'MRI Scan Analyzer', icon: <BrainCircuit className="h-5 w-5"/> },
    { id: 'ecg-analyzer', label: 'ECG Analyzer', icon: <Activity className="h-5 w-5"/> },
    { id: 'eeg-analyzer', label: 'EEG Analyzer', icon: <Waves className="h-5 w-5"/> },
    { id: 'derma-scan-analyzer', label: 'Derma Scan Analyzer', icon: <Layers className="h-5 w-5"/> },
    { id: 'pain-locator', label: 'AI Pain Locator', icon: <MapPin className="h-5 w-5"/> },
  ];

  const liteAnalyzerIds = ['symptom-checker', 'xray-analyzer', 'lab-test-analyzer', 'prescription-analyzer'];
  const analyzerItems = isLiteMode ? allAnalyzerItems.filter(item => liteAnalyzerIds.includes(item.id)) : allAnalyzerItems;
  
  const utilityItems = [
    { id: 'pharmacies', label: 'Find Pharmacies', icon: <Store className="h-5 w-5"/> },
    { id: 'medicine-search', label: 'Medicine Search', icon: <Pill className="h-5 w-5"/> },
    { id: 'donate', label: 'Medical Aid', icon: <HeartHandshake className="h-5 w-5"/> },
  ];

  return (
    <>
    <aside className={`relative sidebar-container flex-shrink-0 text-white flex flex-col p-4 shadow-2xl transition-all duration-300 ease-in-out m-4 rounded-2xl ${isCollapsed ? 'w-24' : 'w-72'}`}>
      <div className={`flex items-center mb-10 pt-2 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
         <div className="bg-[hsl(var(--primary))] p-2 rounded-lg flex-shrink-0">
             <Stethoscope className="text-white h-6 w-6"/>
         </div>
        <h1 className={`text-xl font-bold tracking-wider ml-3 whitespace-nowrap text-white ${isCollapsed ? 'hidden' : 'block'}`}>Pharmalix AI</h1>
      </div>
      
      <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.id}
            onClick={() => setCurrentView(item.id as View)}
            isCollapsed={isCollapsed}
          />
        ))}

        <p className={`px-4 pt-4 pb-2 text-xs font-semibold uppercase text-slate-400 tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
            AI Analyzers
        </p>
        
        {analyzerItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.id}
            onClick={() => setCurrentView(item.id as View)}
            isCollapsed={isCollapsed}
          />
        ))}
        
         <p className={`px-4 pt-4 pb-2 text-xs font-semibold uppercase text-slate-400 tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
            Utilities
        </p>
        
        {utilityItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.id}
            onClick={() => setCurrentView(item.id as View)}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-white/10 dark:border-white/10">
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full py-2 text-slate-400 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            {isCollapsed ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
    <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="Emergency Alert"
      >
        <p>This is a demo of the emergency alert feature. In a real application, this would notify emergency services and your designated contacts immediately.</p>
        <p className="font-bold mt-4">Please do not use this for real emergencies.</p>
    </Modal>
    </>
  );
};

export default Sidebar;
