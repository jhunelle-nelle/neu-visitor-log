import { useEffect, useState } from "react";
import { LogIn, LogOut, Mail, User, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  "Study",
  "Use of Computer",
  "Lounge",
  "Reading",
  "Others",
];

const VisitorForm = () => {
  const { user, loading, isAdmin } = useAuth();

  const [mode, setMode] = useState<"clockin" | "clockout">("clockin");
  const [submitting, setSubmitting] = useState(false);

  const [studentNo, setStudentNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [gmail, setGmail] = useState("");
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    if (user) {
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";

      const email = user.email || "";

      setFullName(name);
      setGmail(email);

      void loadLatestProfile(email);
    } else {
      setFullName("");
      setGmail("");
      setStudentNo("");
      setCollege("");
      setPurpose("");
    }
  }, [user]);

  const loadLatestProfile = async (email: string) => {
    const { data, error } = await supabase
      .from("visitor_logs")
      .select("id_number, college, visitor_name, gmail")
      .eq("gmail", email)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setStudentNo(data.id_number ?? "");
      setCollege(data.college ?? "");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Failed to sign out");
      return;
    }

    toast.success("Signed out successfully");
  };

  const handleClockIn = async () => {
    if (!user) {
      toast.error("Please sign in with Google first.");
      return;
    }

    if (!studentNo.trim()) {
      toast.error("Student/Employee No. is required.");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Google name not found.");
      return;
    }

    if (!gmail.trim()) {
      toast.error("Google email not found.");
      return;
    }

    if (!college.trim()) {
      toast.error("Please select your college.");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Please select your purpose of visit.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: existingOpenLog, error: openLogError } = await supabase
        .from("visitor_logs")
        .select("id")
        .eq("gmail", gmail)
        .is("clock_out", null)
        .maybeSingle();

      if (openLogError) {
        toast.error(openLogError.message);
        return;
      }

      if (existingOpenLog) {
        toast.error("You already have an active visit.");
        return;
      }

      const { error } = await supabase.from("visitor_logs").insert({
        visitor_name: fullName,
        gmail,
        id_number: studentNo,
        college,
        purpose,
        employee_status: "student",
        clock_in: new Date().toISOString(),
        clock_out: null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Clocked in successfully");
      setPurpose("");
    } catch {
      toast.error("Clock in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) {
      toast.error("Please sign in with Google first.");
      return;
    }

    if (!gmail.trim()) {
      toast.error("Google email not found.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: openLog, error: fetchError } = await supabase
        .from("visitor_logs")
        .select("id")
        .eq("gmail", gmail)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        toast.error(fetchError.message);
        return;
      }

      if (!openLog) {
        toast.error("No active visit found for this account.");
        return;
      }

      const { error: updateError } = await supabase
        .from("visitor_logs")
        .update({
          clock_out: new Date().toISOString(),
        })
        .eq("id", openLog.id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      toast.success("Clocked out successfully");
    } catch {
      toast.error("Clock out failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-5.5rem)] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px) brightness(0.45)",
          }}
        />
        <div className="absolute inset-0 bg-slate-950/45" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-10">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-[2rem] bg-blue-700/90 px-10 py-5 shadow-2xl">
              <h1 className="text-4xl font-bold text-white md:text-6xl">
                Welcome to
              </h1>
              <h2 className="text-4xl font-bold text-yellow-400 md:text-6xl">
                NEU University Library Lab
              </h2>
            </div>

            <p className="mt-6 text-lg text-white/85">
              Sign in below to log your visit
            </p>
          </div>

          {/* TOP BUTTONS (no more Google button here) */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setMode("clockin")}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                mode === "clockin"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-slate-900"
              }`}
            >
              <LogIn className="h-4 w-4" />
              Clock In
            </button>

            <button
              onClick={() => setMode("clockout")}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                mode === "clockout"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-slate-900"
              }`}
            >
              <LogOut className="h-4 w-4" />
              Clock Out
            </button>

            {!loading && user ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Sign Out
              </button>
            ) : null}
          </div>

          {/* FORM CARD */}
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/30 bg-white/85 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-slate-900">
                {mode === "clockin" ? "Clock In" : "Clock Out"}
              </h3>
              <p className="mt-2 text-slate-500">
                {mode === "clockin"
                  ? "Enter your details to log your visit"
                  : "Use your Google account to close your active visit"}
              </p>
            </div>

            {!user ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="mb-4 text-slate-700">
                  Sign in with your Google account first.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  className="rounded-2xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  Continue with Google
                </button>
              </div>
            ) : (
              <> {/* SAME AS BEFORE */} </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VisitorForm;
