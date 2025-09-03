import React, { useState, useMemo, useEffect } from 'react';
import type { View } from '../types';
import { 
    LayoutDashboard, HeartPulse, Bone, Scan, BrainCircuit, Activity, Waves, Layers, MapPin, 
    FlaskConical, ClipboardList, MessageSquare, Stethoscope, Store, Pill, HeartHandshake, ArrowLeft, ArrowRight,
    Leaf, TrendingUp, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import Tooltip from './Tooltip';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

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
  isSubItem?: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed, isSubItem = false }) => {
  const content = (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(`flex items-center w-full text-sm font-medium rounded-full transition-all duration-200 ease-in-out group relative`,
        isCollapsed ? 'p-3 justify-center' : `py-3 ${isSubItem ? 'pl-10 pr-4' : 'px-4'}`,
        isActive
          ? 'text-[hsl(var(--primary-foreground))] shadow-lg bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]'
          : 'text-slate-400 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'
      )}
    >
      <span className={cn(isCollapsed ? '' : 'mr-4', isSubItem && !isCollapsed && 'absolute left-4')}>{icon}</span>
      <span className={`transform transition-transform duration-200 whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
    </button>
  );

  return isCollapsed ? <Tooltip content={label} position="right">{content}</Tooltip> : content;
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, setIsCollapsed }) => {
  const { isLiteMode } = useSettings();
  
  const allAnalyzerItems = useMemo(() => [
    { id: 'symptom-checker', label: 'Symptom Checker', icon: <HeartPulse className="h-5 w-5"/> },
    { id: 'prakruti-parikshana', label: 'Prakruti Analysis', icon: <Leaf className="h-5 w-5"/> },
    { id: 'xray-analyzer', label: 'CXR Analyzer', icon: <Bone className="h-5 w-5"/> },
    { id: 'lab-test-analyzer', label: 'Lab Test Analyzer', icon: <FlaskConical className="h-5 w-5"/> },
    { id: 'prescription-analyzer', label: 'Prescription Analyzer', icon: <ClipboardList className="h-5 w-5"/> },
    { id: 'prakruti-progress', label: 'Prakruti Progress', icon: <TrendingUp className="h-5 w-5"/> },
    { id: 'derma-scan-analyzer', label: 'Derma Scan Analyzer', icon: <Layers className="h-5 w-5"/> },
    { id: 'pain-locator', label: 'AI Pain Locator', icon: <MapPin className="h-5 w-5"/> },
    { id: 'ct-analyzer', label: 'CT Scan Analyzer', icon: <Scan className="h-5 w-5"/> },
    { id: 'mri-analyzer', label: 'MRI Scan Analyzer', icon: <BrainCircuit className="h-5 w-5"/> },
    { id: 'ecg-analyzer', label: 'ECG Analyzer', icon: <Activity className="h-5 w-5"/> },
    { id: 'eeg-analyzer', label: 'EEG Analyzer', icon: <Waves className="h-5 w-5"/> },
    { id: 'diabetic-retinopathy-analyzer', label: 'Diabetic Retinopathy', icon: <Eye className="h-5 w-5"/> },
  ], []);

  const analyzerIds = useMemo(() => allAnalyzerItems.map(item => item.id), [allAnalyzerItems]);
  const isCurrentViewAnalyzer = analyzerIds.includes(currentView);

  const [isAnalyzersOpen, setIsAnalyzersOpen] = useState(isCurrentViewAnalyzer);

  useEffect(() => {
    if (isCurrentViewAnalyzer) {
        setIsAnalyzersOpen(true);
    }
  }, [currentView, isCurrentViewAnalyzer]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5"/> },
    { id: 'chatbot', label: 'AI Triage Chat', icon: <MessageSquare className="h-5 w-5"/> },
    { id: 'connect-doctor', label: 'Connect Doctor', icon: <Stethoscope className="h-5 w-5"/> },
    { id: 'messages', label: 'My Consultations', icon: <ClipboardList className="h-5 w-5"/> },
  ];

  const utilityItems = [
    { id: 'pharmacies', label: 'Find Pharmacies', icon: <Store className="h-5 w-5"/> },
    { id: 'medicine-search', label: 'Medicine Search', icon: <Pill className="h-5 w-5"/> },
    { id: 'donate', label: 'Medical Aid', icon: <HeartHandshake className="h-5 w-5"/> },
  ];

  return (
    <>
    <aside className={`relative sidebar-container flex-shrink-0 text-white flex flex-col p-4 shadow-2xl transition-all duration-300 ease-in-out m-4 rounded-2xl ${isCollapsed ? 'w-24' : 'w-72'}`}>
      <div className={`flex items-center mb-10 pt-2 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
         <Stethoscope className="text-[hsl(var(--primary))] h-8 w-8 flex-shrink-0"/>
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
        
        {/* AI Analyzers Collapsible Section */}
        <div className="pt-2">
            <button
              onClick={() => setIsAnalyzersOpen(!isAnalyzersOpen)}
              aria-expanded={isAnalyzersOpen}
              className={cn(`flex items-center w-full text-sm font-medium rounded-full transition-all duration-200 ease-in-out group`,
                isCollapsed ? 'p-3 justify-center' : 'px-4 py-3',
                isCurrentViewAnalyzer 
                  ? 'text-[hsl(var(--primary))] bg-[hsl(var(--muted))]' 
                  : 'text-slate-400 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'
              )}
            >
              <span className={isCollapsed ? '' : 'mr-4'}><BrainCircuit className="h-5 w-5"/></span>
              <span className={`flex-1 text-left whitespace-nownowrap ${isCollapsed ? 'hidden' : 'block'}`}>AI Analyzers</span>
              {!isCollapsed && (isAnalyzersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </button>
            {!isCollapsed && (
                <div 
                    className="transition-all duration-300 ease-in-out overflow-hidden" 
                    style={{ maxHeight: isAnalyzersOpen ? `${allAnalyzerItems.length * 52}px` : '0px' }}
                >
                    <div className="space-y-2 pt-2">
                        {allAnalyzerItems.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentView === item.id}
                                onClick={() => setCurrentView(item.id as View)}
                                isCollapsed={false}
                                isSubItem={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
        
         <p className={`px-4 pt-4 pb-2 text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
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
            className="flex items-center justify-center w-full py-2 text-slate-400 hover:bg-[hsl(var(--muted))] rounded-full hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            {isCollapsed ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;