import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }

    const allowedAdmins = [
      "jhunelle.remo@neu.edu.ph",
      "jcesperanza@neu.edu.ph",
    ];

    const email = (currentUser.email ?? "").toLowerCase().trim();
    setIsAdmin(allowedAdmins.includes(email));
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setSession(session ?? null);
      setUser(session?.user ?? null);
      checkAdmin(session?.user ?? null);
      setLoading(false);
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setSession(session ?? null);
      setUser(session?.user ?? null);
      checkAdmin(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

