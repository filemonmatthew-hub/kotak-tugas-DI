'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface AuthValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  reloadProfile: async () => {},
});

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (u: User | null) => {
    if (!u) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUser(u);
    const { data } = await supabase().from('profiles').select('id, full_name, nim, role').eq('id', u.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      // Jangan memanggil query Supabase langsung di dalam callback ini.
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const reloadProfile = useCallback(async () => {
    const { data } = await supabase().auth.getUser();
    await load(data.user ?? null);
  }, [load]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, reloadProfile }}>{children}</AuthContext.Provider>
  );
}
