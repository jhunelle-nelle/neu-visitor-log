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
    const { data } = await supabase
      .from("visitor_logs")
      .select("id_number, college")
      .eq("gmail", email)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
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

    if (error) toast.error(error.message);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error("Failed to sign out");
    toast.success("Signed out successfully");
  };

  const handleClockIn = async () => {
    if (!user) return toast.error("Please sign in first.");
    if (!studentNo || !college || !purpose)
      return toast.error("Please complete all fields.");

    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("visitor_logs")
        .select("id")
        .eq("gmail", gmail)
        .is("clock_out", null)
        .maybeSingle();

      if (existing) {
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
      });

      if (error) throw error;

      toast.success("Clocked in!");
      setPurpose("");
    } catch {
      toast.error("Clock in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return toast.error("Please sign in first.");

    setSubmitting(true);

    try {
      const { data } = await supabase
        .from("visitor_logs")
        .select("id")
        .eq("gmail", gmail)
        .is("clock_out", null)
        .maybeSingle();

      if (!data) {
        toast.error("No active visit.");
        return;
      }

      await supabase
        .from("visitor_logs")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", data.id);

      toast.success("Clocked out!");
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

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              NEU Library Lab
            </h1>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <button onClick={() => setMode("clockin")} className="btn">
              Clock In
            </button>
            <button onClick={() => setMode("clockout")} className="btn">
              Clock Out
            </button>

            {user && (
              <button onClick={handleSignOut} className="btn bg-red-500 text-white">
                Sign Out
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            {!user ? (
              <div className="text-center">
                <button
                  onClick={handleGoogleLogin}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl"
                >
                  Continue with Google
                </button>
              </div>
            ) : (
              <>
                <p><b>Name:</b> {fullName}</p>
                <p><b>Email:</b> {gmail}</p>

                {mode === "clockin" ? (
                  <>
                    <input
                      placeholder="Student No"
                      value={studentNo}
                      onChange={(e) => setStudentNo(e.target.value)}
                      className="input"
                    />

                    <select value={college} onChange={(e) => setCollege(e.target.value)} className="input">
                      <option value="">Select College</option>
                      {colleges.map((c) => <option key={c}>{c}</option>)}
                    </select>

                    <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input">
                      <option value="">Purpose</option>
                      {purposes.map((p) => <option key={p}>{p}</option>)}
                    </select>

                    <button onClick={handleClockIn} className="btn w-full">
                      {submitting ? "Loading..." : "Clock In"}
                    </button>
                  </>
                ) : (
                  <button onClick={handleClockOut} className="btn w-full">
                    {submitting ? "Loading..." : "Clock Out"}
                  </button>
                )}

                {isAdmin && <a href="/admin">Admin</a>}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VisitorForm;
