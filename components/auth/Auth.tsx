import React, { useState, Suspense } from 'react';
import type { UserRole, AuthView } from '../../types';
import Login from './Login';
import SignUp from './SignUp';
import { Stethoscope, ArrowLeft, Bot, User, Shield } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import DnaModel from './DnaModel';

const RoleCard: React.FC<{
    role: UserRole;
    description: string;
    icon: React.ReactNode;
    onSelect: (role: UserRole) => void;
}> = ({ role, description, icon, onSelect }) => (
    <div 
        onClick={() => onSelect(role)}
        className="glass-card p-6 rounded-2xl text-center cursor-pointer hover:-translate-y-2 transition-transform duration-300 group"
    >
        <div className="inline-block p-3 bg-white/10 rounded-xl mb-4 transition-colors group-hover:bg-white/20">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white capitalize">{role}</h3>
        <p className="text-slate-400 mt-1 text-sm">{description}</p>
    </div>
);

const Auth: React.FC = () => {
    const [authView, setAuthView] = useState<AuthView>({ view: 'portal', role: null });

    const handleRoleSelect = (role: UserRole) => {
        setAuthView({ view: 'login', role });
    };
    
    const renderContent = () => {
        if (authView.view === 'portal' || authView.role === null) {
            return (
                 <div className="relative z-10 text-center w-full max-w-4xl mx-auto animate-fadeIn">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3 glow-effect">
                       Welcome to <span className="gradient-text">Pharmalix AI</span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-12">The future of personalized healthcare. Please select your role to continue.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <RoleCard role="patient" description="Access AI triage and manage your health." icon={<User className="h-8 w-8 text-[hsl(var(--primary))]"/>} onSelect={handleRoleSelect} />
                        <RoleCard role="doctor" description="Manage consultations and provide care." icon={<Stethoscope className="h-8 w-8 text-[hsl(var(--primary))]"/>} onSelect={handleRoleSelect} />
                        <RoleCard role="admin" description="Oversee the platform and analytics." icon={<Shield className="h-8 w-8 text-[hsl(var(--primary))]"/>} onSelect={handleRoleSelect} />
                    </div>
                </div>
            );
        }
        
         return (
            <div className="w-full max-w-md mx-auto relative z-10 animate-fadeIn">
                 <button onClick={() => setAuthView({ view: 'portal', role: null })} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-[hsl(var(--primary))] mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to role selection
                </button>
                {authView.view === 'login' ? (
                    <Login role={authView.role} setAuthView={setAuthView} />
                ) : (
                    <SignUp role={authView.role} setAuthView={setAuthView} />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
           <div className="absolute inset-0 z-0 opacity-50">
                <Suspense fallback={null}>
                    <Canvas>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <DnaModel />
                    </Canvas>
                </Suspense>
           </div>
           {renderContent()}
        </div>
    );
};

export default Auth;