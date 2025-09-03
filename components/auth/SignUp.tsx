
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { UserRole, AuthView } from '../../types';

interface SignUpProps {
    role: UserRole;
    setAuthView: React.Dispatch<React.SetStateAction<AuthView>>;
}

const SignUp: React.FC<SignUpProps> = ({ role, setAuthView }) => {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        if (!fullName.trim()) {
            setError('Full name is required.');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName.trim(),
                    app_role: role,
                },
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };
    
    if (success) {
        return (
             <div className="w-full max-w-md mx-auto auth-card-gradient p-8 rounded-2xl text-center">
                 <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
                 <p className="text-slate-300">
                    We've sent a verification link to <strong className="text-[hsl(var(--primary))]">{email}</strong>. Please click the link to complete your registration.
                 </p>
             </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto auth-card-gradient p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-center text-white mb-2">
                Create <span className="capitalize">{role}</span> Account
            </h2>
            <p className="text-center text-slate-400 mb-8">
                Get started with your free account today.
            </p>

            {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
                 <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                        Full Name
                    </label>
                    <div className="mt-1">
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 text-white border border-slate-700 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))] sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email-signup" className="block text-sm font-medium text-slate-300">
                        Email Address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email-signup"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 text-white border border-slate-700 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))] sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password-signup" className="block text-sm font-medium text-slate-300">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password-signup"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 text-white border border-slate-700 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))] sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-full shadow-sm text-sm font-bold text-[hsl(var(--primary-foreground))] gradient-button disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <button onClick={() => setAuthView({ view: 'login', role })} className="font-medium text-[hsl(var(--primary))] hover:opacity-80">
                    Login
                </button>
            </p>
        </div>
    );
};

export default SignUp;
