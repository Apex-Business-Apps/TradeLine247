import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from '@/integrations/supabase/client';
import { ensureMembership } from '@/lib/ensureMembership';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'moderator' | 'user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return () => undefined;
    }

    // Set up auth state listener FIRST with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle token refresh events silently to prevent disconnection errors
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user role when user logs in
          if (session?.user) {
            setTimeout(async () => {
              fetchUserRole(session.user!.id);
              const result = await ensureMembership(session.user!);
              if (result.error) {
                toast({
                  variant: "destructive",
                  title: "Trial Setup Failed",
                  description: result.error,
                });
              }
            }, 0);
          } else {
            setUserRole(null);
          }
          
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
        } else if (event === 'USER_UPDATED') {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchUserRole(session.user.id);
          }
        } else {
          // For other events, update state normally
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(async () => {
              fetchUserRole(session.user!.id);
              const result = await ensureMembership(session.user!);
              if (result.error) {
                toast({
                  variant: "destructive",
                  title: "Trial Setup Failed",
                  description: result.error,
                });
              }
            }, 0);
          } else {
            setUserRole(null);
          }
          
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // If there's a JWT error, clear the corrupted session
      if (error?.message?.includes('malformed') || error?.message?.includes('invalid')) {
        console.warn('[Auth] Detected malformed token, clearing session:', error.message);
        supabase.auth.signOut().catch(() => {/* ignore errors during cleanup */});
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
        ensureMembership(session.user).then((result) => {
          if (result.error) {
            toast({
              variant: "destructive",
              title: "Trial Setup Failed",
              description: result.error,
            });
          }
        });
      }
      
      setLoading(false);
    }).catch((err) => {
      // Catch any unhandled JWT errors
      console.error('[Auth] Session check failed:', err);
      supabase.auth.signOut().catch(() => {/* ignore */});
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    if (!isSupabaseEnabled) {
      setUserRole('user');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `https://tradeline247ai.com/auth/callback`;
    
    if (!isSupabaseEnabled) {
      return { error: new Error('Supabase is disabled') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseEnabled) {
      return { error: new Error('Supabase is disabled') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseEnabled) {
      return { error: new Error('Supabase is disabled') };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // CLIENT-SIDE UX ONLY — NOT SECURITY
  // Do not rely on this for authorization. All admin ops are verified server-side.
  const isAdmin = () => userRole === 'admin';
  const isUser = () => userRole === 'user';

  return {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isUser
  };
};
