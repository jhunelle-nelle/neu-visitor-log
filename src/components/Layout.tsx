import { Link, useLocation } from "react-router-dom";
import { BookOpen, Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-foreground leading-tight">
                NEU Library
              </h1>
              <p className="text-xs text-primary-foreground/70">Visitor Log System</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className={location.pathname !== "/" ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : ""}
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Visitor Log
              </Button>
            </Link>
            {user && (
              <Link to="/admin">
                <Button
                  variant={location.pathname === "/admin" ? "secondary" : "ghost"}
                  size="sm"
                  className={location.pathname !== "/admin" ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : ""}
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
            )}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  <User className="w-4 h-4 mr-1.5" />
                  Admin Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} New Era University Library. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
