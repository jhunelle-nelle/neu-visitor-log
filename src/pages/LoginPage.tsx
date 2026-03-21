import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import libraryBg from "@/assets/library-bg.jpg";

const LoginPage = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("LOGIN PAGE DEBUG");
    console.log("loading:", loading);
    console.log("user:", user);
    console.log("user email:", user?.email);
    console.log("isAdmin:", isAdmin);

    if (!loading && user) {
      if (isAdmin) {
        console.log("Navigating to /admin");
        navigate("/admin");
      } else {
        console.log("Not admin, redirecting to /");
        toast.error("You don't have access");
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://neu-visitor-log-nine.vercel.app/login",
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-8rem)]">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px) brightness(0.35)",
          }}
        />
        <div className="absolute inset-0 z-0 bg-background/20" />

        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh] animate-fade-in">
          <Card className="w-full max-w-md shadow-elevated backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">Admin Login</CardTitle>
              <CardDescription>
                Sign in with your NEU Google account to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                size="lg"
                className="w-full gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
