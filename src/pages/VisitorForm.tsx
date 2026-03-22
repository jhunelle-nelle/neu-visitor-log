import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, UserCheck, Mail, Sparkles, CheckCircle2 } from "lucide-react";
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

  const [showClockInPopup, setShowClockInPopup] = useState(false);
  const [showClockOutPopup, setShowClockOutPopup] = useState(false);

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
      console.error("CLOCK IN ERROR:", error);
      toast.error(error.message || "Failed to clock in. Please try again.");
    } else {
      setShowClockInPopup(true);
      setTimeout(() => setShowClockInPopup(false), 3000);

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

    if (fetchError) {
      console.error("CLOCK OUT FETCH ERROR:", fetchError);
      setLoading(false);
      toast.error(fetchError.message || "Failed to find active visit.");
      return;
    }

    if (!data) {
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
      console.error("CLOCK OUT UPDATE ERROR:", error);
      toast.error(error.message || "Failed to clock out.");
    } else {
      setShowClockOutPopup(true);
      setTimeout(() => setShowClockOutPopup(false), 3000);
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
            <Card className="rounded-3xl bg-card/95 shadow-elevated backdrop-blur-sm">
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
                  />
                  {lookingUp && (
                    <p className="text-xs text-muted-foreground">Looking up your details...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>College / Department *</Label>
                  <Select value={college} onValueChange={setCollege}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Purpose of Visit *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposes.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={employeeStatus}
                    onValueChange={(v) => setEmployeeStatus(v as "student" | "teacher" | "staff")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleClockIn} disabled={loading} className="w-full gap-2 rounded-xl" size="lg">
                  <Clock className="h-4 w-4" />
                  {loading ? "Clocking in..." : "Clock In"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl bg-card/95 shadow-elevated backdrop-blur-sm">
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
                  />
                </div>

                <Button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="w-full gap-2 rounded-xl"
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

        {showClockInPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-primary">Welcome to NEU Library!</h2>
              <p className="mb-5 text-muted-foreground">
                Your visit has been successfully recorded.
              </p>
              <Button
                onClick={() => setShowClockInPopup(false)}
                className="rounded-xl px-6"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {showClockOutPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-primary">Thank you for visiting!</h2>
              <p className="mb-5 text-muted-foreground">
                You have successfully clocked out. Have a great day.
              </p>
              <Button
                onClick={() => setShowClockOutPopup(false)}
                variant="secondary"
                className="rounded-xl px-6"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VisitorForm;
