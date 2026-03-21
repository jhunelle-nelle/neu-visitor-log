import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
      console.log("No current user");
      setIsAdmin(false);
      return;
    }

    const allowedAdmins = [
      "jcesperanza@neu.edu.ph",
      "jhunnelleremo71@gmail.com",
    ];

    console.log("Logged in user object:", currentUser);
    console.log("Logged in email:", currentUser.email);
    console.log("Allowed admins:", allowedAdmins);

    const adminCheck = allowedAdmins.includes(
      (currentUser.email ?? "").toLowerCase().trim()
    );

    console.log("Is admin?", adminCheck);
    setIsAdmin(adminCheck);
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
        console.error("Error getting session:", error.message);
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log("Initial session:", session);

      setSession(session ?? null);
      setUser(session?.user ?? null);
      checkAdmin(session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session);

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
