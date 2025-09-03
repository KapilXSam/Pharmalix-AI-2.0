
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';
import type { Session } from '@supabase/supabase-js';

export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const channelRef = useRef<any>(null);

    const fetchProfile = useCallback(async (user: any) => {
        try {
            setProfileError(null);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                // If profile doesn't exist for a valid user, it's a critical data issue.
                if (error.code === 'PGRST116') { // "No rows found"
                    throw new Error("Your user profile could not be found. Please contact support.");
                }
                throw error;
            }
            
            const userProfile = data as Profile;
            setProfile(userProfile);
            return userProfile;
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            setProfileError(error.message || "Could not load your profile. Please check your network connection.");
            setProfile(null);
            return null;
        }
    }, []);

    const setupPresenceChannel = useCallback((user: any, userProfile: Profile) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        
        const channel = supabase.channel(`online-users`, {
            config: { presence: { key: user.id } },
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ 
                    user_id: user.id, 
                    full_name: userProfile.full_name,
                    role: userProfile.role,
                    online_at: new Date().toISOString() 
                });
            }
        });
        channelRef.current = channel;
    }, []);

    useEffect(() => {
        // 1. Check for an existing session on initial app load.
        // This is a one-time check to quickly determine the auth state.
        const checkCurrentSession = async () => {
            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                setSession(currentSession);
    
                if (currentSession?.user) {
                    const userProfile = await fetchProfile(currentSession.user);
                    if (userProfile) {
                        setupPresenceChannel(currentSession.user, userProfile);
                    }
                }
            } catch (error: any) {
                console.error("Error during initial session check:", error.message);
                // Don't set a profile error here, as a null session is a valid state.
                // The UI will simply show the login page.
            } finally {
                setLoadingInitial(false); // Signal that the initial auth check is complete.
            }
        };

        checkCurrentSession();

        // 2. Set up a listener for real-time auth state changes (e.g., sign in, sign out).
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // The initial session is already handled by getSession(), so we can ignore this event.
                if (event === 'INITIAL_SESSION') {
                    return;
                }

                setSession(session);

                if (session?.user) {
                    // If a user signs in or their info is updated, re-fetch profile.
                    // This also handles token refreshes gracefully.
                    const userProfile = await fetchProfile(session.user);
                    if (userProfile) {
                        setupPresenceChannel(session.user, userProfile);
                    }
                } else {
                    // User signed out, clean up profile and presence channel.
                    if (channelRef.current) {
                        supabase.removeChannel(channelRef.current);
                        channelRef.current = null;
                    }
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [fetchProfile, setupPresenceChannel]);

    return { session, profile, loading: loadingInitial, profileError, setProfileError };
};
