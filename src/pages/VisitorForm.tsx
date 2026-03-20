import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, UserCheck } from "lucide-react";
import Layout from "@/components/Layout";

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
  const [idNumber, setIdNumber] = useState("");
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState<"student" | "teacher" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [clockOutId, setClockOutId] = useState("");
  const [mode, setMode] = useState<"clockin" | "clockout">("clockin");
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  // Auto-fill for returning visitors when ID number is entered
  useEffect(() => {
    const lookup = async () => {
      const trimmed = idNumber.trim();
      if (trimmed.length < 4) {
        setIsReturningVisitor(false);
        return;
      }
      setLookingUp(true);
      const { data } = await supabase
        .from("visitor_logs")
        .select("visitor_name, college, employee_status")
        .eq("id_number", trimmed)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setIsReturningVisitor(true);
        setName(data.visitor_name);
        setCollege(data.college);
        setEmployeeStatus(data.employee_status as "student" | "teacher" | "staff");
      } else {
        setIsReturningVisitor(false);
      }
      setLookingUp(false);
    };

    const timer = setTimeout(lookup, 500);
    return () => clearTimeout(timer);
  }, [idNumber]);

  const handleClockIn = async () => {
    if (!name.trim() || !idNumber.trim() || !college || !purpose) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("visitor_logs").insert({
      visitor_name: name.trim(),
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
      toast.success("Welcome to NEU Library! You've been clocked in.");
      setName("");
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
      toast.error("No active session found for this ID number.");
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
      <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-6 py-3 rounded-2xl gradient-hero">
            <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-primary-foreground tracking-tight">
              Welcome to
            </h2>
            <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-accent tracking-tight">
              NEU Library
            </h2>
          </div>
          <p className="text-lg text-muted-foreground mt-3 max-w-md mx-auto">
            Sign in below to log your visit
          </p>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          <Button
            variant={mode === "clockin" ? "default" : "outline"}
            onClick={() => setMode("clockin")}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Clock In
          </Button>
          <Button
            variant={mode === "clockout" ? "default" : "outline"}
            onClick={() => setMode("clockout")}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Clock Out
          </Button>
        </div>

        {mode === "clockin" ? (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
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
                  <p className="text-xs text-muted-foreground">Looking up your info...</p>
                )}
                {isReturningVisitor && (
                  <p className="text-xs text-primary font-medium">✓ Returning visitor — details auto-filled</p>
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
                <Label>College / Department *</Label>
                <Select value={college} onValueChange={setCollege}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              <Button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                <Clock className="w-4 h-4" />
                {loading ? "Clocking in..." : "Clock In"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-primary" />
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
                className="w-full gap-2"
                size="lg"
                variant="secondary"
              >
                <LogOut className="w-4 h-4" />
                {loading ? "Clocking out..." : "Clock Out"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default VisitorForm;
