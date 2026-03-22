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
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
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
          queryParams: { prompt: "select_account" },
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
      <div className="relative min-h-[calc(100vh-5.5rem)]">
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

        <div className="relative z-10 container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md rounded-3xl bg-card/95 shadow-elevated backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-hero transition-all duration-300 hover:scale-110">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">Admin Login</CardTitle>
              <CardDescription>
                Sign in with your Google account to access the University Library Lab admin panel
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                size="lg"
                className="w-full gap-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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


// ===============================
// FILE: src/pages/VisitorForm.tsx
// ===============================
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, UserCheck, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import libraryBg from "@/assets/library-bg.jpg";

const colleges = [
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Computer Studies",
  "College of Education",
  "College of Engineering",
  "College of Dentistry",
  "College of Law",
  "Graduate School",
  "Other",
];

const purposes = [
  "Study / Research",
  "Borrow Books",
  "Return Books",
  "Use Computers",
  "Group Study",
  "Thesis / Dissertation",
  "Other",
];

const VisitorForm = () => {
  const [name, setName] = useState("");
  const [gmail, setGmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState<"student" | "teacher" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [clockOutId, setClockOutId] = useState("");
  const [mode, setMode] = useState<"clockin" | "clockout">("clockin");
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      const trimmed = idNumber.trim();

      if (trimmed.length < 4) {
        setIsReturningVisitor(false);
        setName("");
        setGmail("");
        setCollege("");
        setEmployeeStatus("student");
        return;
      }

      setLookingUp(true);

      const { data } = await supabase
        .from("visitor_logs")
        .select("visitor_name, college, employee_status, gmail")
        .eq("id_number", trimmed)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsReturningVisitor(true);
        setName(data.visitor_name ?? "");
        setCollege(data.college ?? "");
        setGmail((data as { gmail?: string }).gmail ?? "");
        setEmployeeStatus((data.employee_status as "student" | "teacher" | "staff") ?? "student");
      } else {
        setIsReturningVisitor(false);
        setName("");
        setGmail("");
        setCollege("");
        setEmployeeStatus("student");
      }

      setLookingUp(false);
    };

    const timer = setTimeout(lookup, 500);
    return () => clearTimeout(timer);
  }, [idNumber]);

  const handleClockIn = async () => {
    if (!name.trim() || !gmail.trim() || !idNumber.trim() || !college || !purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const now = new Date().toISOString();

    const { error } = await supabase.from("visitor_logs").insert({
      visitor_name: name.trim(),
      gmail: gmail.trim().toLowerCase(),
      id_number: idNumber.trim(),
      college,
      purpose,
      employee_status: employeeStatus,
      clock_in: now,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to clock in. Please try again.");
    } else {
      toast.success("Welcome to NEU University Library Lab! You've been clocked in.");
      setName("");
      setGmail("");
      setIdNumber("");
      setCollege("");
      setPurpose("");
      setEmployeeStatus("student");
      setIsReturningVisitor(false);
    }
  };

  const handleClockOut = async () => {
    if (!clockOutId.trim()) {
      toast.error("Please enter your ID number");
      return;
    }

    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("visitor_logs")
      .select("id")
      .eq("id_number", clockOutId.trim())
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !data) {
      setLoading(false);
      toast.error("No active visit found for this ID number.");
      return;
    }

    const { error } = await supabase
      .from("visitor_logs")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", data.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to clock out.");
    } else {
      toast.success("You've been clocked out. Goodbye!");
      setClockOutId("");
    }
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-5.5rem)] overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px) brightness(0.4)",
          }}
        />
        <div className="absolute inset-0 z-0 bg-background/30" />

        <div className="relative z-10 container mx-auto max-w-3xl px-4 py-8 animate-fade-in">
          <div className="mb-10 text-center">
            <div className="inline-block mb-4 rounded-3xl gradient-hero px-8 py-4 shadow-elevated transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]">
              <h2 className="text-4xl font-display font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
                Welcome to
              </h2>
              <h2 className="text-4xl font-display font-extrabold tracking-tight text-accent sm:text-5xl">
                NEU University Library Lab
              </h2>
            </div>

            <p className="mx-auto mt-3 max-w-md text-lg text-white/80 drop-shadow-lg">
              Sign in below to log your visit
            </p>
          </div>

          <div className="mb-6 flex justify-center gap-3">
            <Button
              variant={mode === "clockin" ? "default" : "outline"}
              onClick={() => setMode("clockin")}
              className="gap-2 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
            >
              <LogIn className="h-4 w-4" />
              Clock In
            </Button>

            <Button
              variant={mode === "clockout" ? "default" : "outline"}
              onClick={() => setMode("clockout")}
              className="gap-2 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
            >
              <LogOut className="h-4 w-4" />
              Clock Out
            </Button>
          </div>

          {mode === "clockin" ? (
            <Card className="rounded-3xl bg-card/95 shadow-elevated backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-4xl">
                  <UserCheck className="h-6 w-6 text-primary" />
                  Clock In
                </CardTitle>
                <CardDescription>
                  {isReturningVisitor
                    ? "Welcome back! Your details have been auto-filled."
                    : "Enter your details to log your visit"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idNumber">Student/Employee No. *</Label>
                  <Input
                    id="idNumber"
                    placeholder="2024-00001"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="transition-all duration-300 focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                  />
                  {lookingUp && (
                    <p className="text-xs text-muted-foreground">Looking up your information...</p>
                  )}
                  {isReturningVisitor && (
                    <p className="text-xs font-medium text-primary">✓ Returning visitor — details auto-filled</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="transition-all duration-300 focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmail">Gmail *</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gmail"
                      type="email"
                      placeholder="name@gmail.com"
                      value={gmail}
                      onChange={(e) => setGmail(e.target.value)}
                      className="pl-10 transition-all duration-300 focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>College / Department *</Label>
                  <Select value={college} onValueChange={setCollege}>
                    <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Purpose of Visit *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposes.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={employeeStatus} onValueChange={(v) => setEmployeeStatus(v as "student" | "teacher" | "staff")}>
                    <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full gap-2 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl"
                  size="lg"
                >
                  <Clock className="h-4 w-4" />
                  {loading ? "Clocking in..." : "Clock In"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl bg-card/95 shadow-elevated backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-4xl">
                  <LogOut className="h-6 w-6 text-primary" />
                  Clock Out
                </CardTitle>
                <CardDescription>Enter your ID number to clock out</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clockOutId">Student/Employee No. *</Label>
                  <Input
                    id="clockOutId"
                    placeholder="2024-00001"
                    value={clockOutId}
                    onChange={(e) => setClockOutId(e.target.value)}
                    className="transition-all duration-300 focus:scale-[1.01] focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="w-full gap-2 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl"
                  size="lg"
                  variant="secondary"
                >
                  <LogOut className="h-4 w-4" />
                  {loading ? "Clocking out..." : "Clock Out"}
                </Button>
              </CardContent>
            </Card>
          )}

          <footer className="mt-10 text-center text-sm text-white/80">
            © 2026 New Era University Library Lab. All rights reserved.
          </footer>
        </div>
      </div>
    </Layout>
  );
};

export default VisitorForm;

