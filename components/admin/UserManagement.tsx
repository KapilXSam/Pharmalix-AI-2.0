import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { ManagedUser } from '../../types';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { Search, FilePenLine, Trash2 } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, full_name, role, created_at')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setUsers(data as ManagedUser[]);
        } catch (err: any) {
            setError('Failed to fetch user data. Please check your connection and permissions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const getRoleStyles = (role: ManagedUser['role']) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'doctor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'patient': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };
    
    if (loading) return <LoadingState message="Loading User Data..." />;
    if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg text-white animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Full Name</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">User Since</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                    {user.full_name || 'N/A'}
                                </th>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getRoleStyles(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <button
                                        disabled
                                        title="User editing requires server-side setup."
                                        className="text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                    >
                                        <FilePenLine className="h-5 w-5" />
                                    </button>
                                     <button
                                        disabled
                                        title="User deletion requires server-side setup."
                                        className="text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <p className="text-center py-8 text-slate-400">No users found.</p>
                )}
            </div>
            <div className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                <p><strong>Note:</strong> Editing and deleting users requires secure server-side logic (e.g., Supabase Edge Functions) to be implemented for safety. These controls are currently disabled in this client-side demo.</p>
            </div>
        </div>
    );
};

export default UserManagement;