import React, { useState, useEffect, useRef } from 'react';
import type { Profile } from '../types';
import { User, Settings, Bell, ChevronDown, LogOut, Siren, Search, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  title: string;
  profile: Profile;
  setCurrentView: (view: any) => void;
  onLogout: () => void;
  onEmergency: () => void;
}

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useSettings();
  
  // To determine the effective theme, we must check system preference if theme is 'system'
  const isEffectiveDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    // A simple toggle button should switch between light and dark, overriding 'system'
    setTheme(isEffectiveDark ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      className="!rounded-full text-[hsl(var(--muted-foreground))]"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
};


const Header: React.FC<HeaderProps> = ({ title, profile, setCurrentView, onLogout, onEmergency }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const handleNavigateToSettings = () => {
    setCurrentView('settings');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-4 mx-4 sm:mx-6 lg:mx-8 mt-4 z-10 glass-card p-4 rounded-2xl flex justify-between items-center gap-4">
      <h2 className="text-2xl font-bold whitespace-nowrap">{title}</h2>
      
      <div className="relative flex-1 max-w-xl hidden lg:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
        <Input type="text" placeholder="Search doctors, reports, medicines…" className="pl-12 w-full bg-[hsl(var(--input))] !rounded-full" />
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button onClick={onEmergency} variant="destructive" size="sm" className="hidden sm:inline-flex items-center gap-2">
            <Siren className="h-4 w-4" />
            <span>Emergency</span>
        </Button>
        <Button onClick={onEmergency} variant="destructive" size="icon" className="sm:hidden">
            <Siren className="h-5 w-5" />
        </Button>
        
        <ThemeToggle />

        <button className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center cursor-pointer group" aria-haspopup="true" aria-expanded={isDropdownOpen}>
            <div className="h-9 w-9 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center font-bold">
              <User className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="text-left ml-3 hidden md:block">
              <p className="text-sm font-semibold">{profile.full_name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{profile.role}</p>
            </div>
            <ChevronDown className={`ml-2 h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 group-hover:text-[hsl(var(--foreground))] ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-[hsl(var(--popover))] rounded-xl shadow-lg py-2 z-10 animate-scaleIn" role="menu">
              <button
                onClick={handleNavigateToSettings}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--muted))]"
                role="menuitem"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;