

import React from 'react';
import type { DoctorView } from '../../types';
import { LayoutDashboard, Users, MessageSquare, Pill, ArrowLeft, Stethoscope, ArrowRight, CalendarDays } from 'lucide-react';
import Tooltip from '../Tooltip';


interface DoctorSidebarProps {
  currentView: DoctorView;
  setCurrentView: React.Dispatch<React.SetStateAction<DoctorView>>;
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
              : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-300'
          }`}
      >
        {!isActive && <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_hsl(var(--primary)_/_0.5)]"></div>}
        <span className={isCollapsed ? '' : 'mr-4'}>{icon}</span>
        <span className={`transform transition-transform duration-200 whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
      </button>
  );

  return isCollapsed ? <Tooltip content={label} position="right">{content}</Tooltip> : content;
};

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ currentView, setCurrentView, isCollapsed, setIsCollapsed }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'patients', label: 'My Patients', icon: <Users className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'schedule', label: 'My Schedule', icon: <CalendarDays className="h-5 w-5" /> },
    { id: 'medicine-search', label: 'Medicine Search', icon: <Pill className="h-5 w-5" /> },
  ];

  return (
    <aside className={`relative sidebar-container flex-shrink-0 text-white flex flex-col p-4 shadow-2xl transition-all duration-300 ease-in-out m-4 rounded-2xl ${isCollapsed ? 'w-24' : 'w-72'}`}>
      <div className={`flex items-center mb-10 pt-2 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
         <div className="bg-sky-500 p-2 rounded-lg mr-3 flex-shrink-0">
             <Stethoscope className="text-white h-6 w-6"/>
         </div>
        <h1 className={`text-xl font-bold tracking-wider whitespace-nowrap text-white ${isCollapsed ? 'hidden' : 'block'}`}>Doctor Portal</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.id}
            onClick={() => setCurrentView(item.id as DoctorView)}
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
  );
};

export default DoctorSidebar;