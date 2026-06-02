import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export const useAuthProvider = () => {
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setProfile(profile);
      }
      useAuthStore.setState({ loading: false });
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      useAuthStore.setState({ loading: false });
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile]);
};
