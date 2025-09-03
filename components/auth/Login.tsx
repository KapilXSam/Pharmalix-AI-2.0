
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { UserRole, AuthView } from '../../types';

interface LoginProps {
    role: UserRole;
    setAuthView: React.Dispatch<React.SetStateAction<AuthView>>;
}

const Login: React.FC<LoginProps> = ({ role, setAuthView }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-md mx-auto auth-card-gradient p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-center text-white mb-2">
                <span className="capitalize">{role}</span> Login
            </h2>
            <p className="text-center text-slate-400 mb-8">
                Welcome back! Please enter your details.
            </p>

            {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                        Email Address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
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
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <button onClick={() => setAuthView({ view: 'signup', role })} className="font-medium text-[hsl(var(--primary))] hover:opacity-80">
                    Sign Up
                </button>
            </p>
        </div>
    );
};

export default Login;
