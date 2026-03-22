import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";

const Layout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Failed to sign out");
      return;
    }

    toast.success("Signed out successfully");
    navigate("/");
  };

  const isVisitorPage = location.pathname === "/";
  const isLoginPage = location.pathname === "/login";
  const isAdminPage = location.pathname === "/admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <div className="text-2xl font-bold md:text-3xl">NEU University Library Lab</div>
              <div className="text-sm opacity-90">Visitor Log</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {!isVisitorPage && (
              <Link to="/">
                <Button
                  className="gap-2 rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
                  variant="secondary"
                >
                  <BookOpen className="h-4 w-4" />
                  Visitor Log
                </Button>
              </Link>
            )}

            {!user && !isLoginPage && (
              <Link to="/login">
                <Button className="gap-2 rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg">
                  <Shield className="h-4 w-4" />
                  Admin Login
                </Button>
              </Link>
            )}

            {user && isAdmin && !isAdminPage && (
              <Link to="/admin">
                <Button className="gap-2 rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg">
                  <UserCog className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}

            {user && isAdmin && (
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="gap-2 rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
};

export default Layout;
