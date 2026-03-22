import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, Clock3, UserPlus, Sparkles } from "lucide-react";

type FormData = {
  studentNo: string;
  fullName: string;
  college: string;
  purpose: string;
  status: string;
};

const initialForm: FormData = {
  studentNo: "",
  fullName: "",
  college: "",
  purpose: "",
  status: "student",
};

export default function VisitorForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [activeTime, setActiveTime] = useState(new Date());
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setActiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return activeTime.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [activeTime]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateClockIn = () => {
    if (!form.studentNo || !form.fullName || !form.college || !form.purpose || !form.status) {
      setMessage({ type: "error", text: "Please complete all required fields before clocking in." });
      return false;
    }
    return true;
  };

  const handleClockIn = async () => {
    setMessage(null);

    if (!validateClockIn()) return;

    try {
      setLoading("in");

      const res = await fetch("/api/visitor/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Clock in failed.");
      }

      setMessage({ type: "success", text: data?.message || "Clock in successful." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Clock in failed." });
    } finally {
      setLoading(null);
    }
  };

  const handleClockOut = async () => {
    setMessage(null);

    if (!form.studentNo) {
      setMessage({ type: "error", text: "Student/Employee No. is required for clock out." });
      return;
    }

    try {
      setLoading("out");

      const res = await fetch("/api/visitor/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentNo: form.studentNo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Clock out failed.");
      }

      setMessage({ type: "success", text: data?.message || "Clock out successful." });

      setForm(initialForm);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Clock out failed." });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md animate-[fadeIn_0.7s_ease-out]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                <Sparkles size={16} />
                University Library Lab
              </div>
              <h1 className="text-3xl font-bold tracking-tight">NEU Visitor Log System</h1>
              <p className="mt-2 text-sm text-slate-300">
                Secure visitor check-in and check-out with accurate local time.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right shadow-lg animate-pulse">
              <div className="flex items-center justify-end gap-2 text-cyan-300">
                <Clock3 size={18} />
                <span className="text-sm font-medium">Current Time</span>
              </div>
              <p className="mt-1 text-sm text-white">{formattedTime}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md animate-[slideUp_0.6s_ease-out]">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                <UserPlus size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Visitor Information</h2>
                <p className="text-sm text-slate-400">First-time visitors should complete their details.</p>
              </div>
            </div>

            {message && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm transition-all duration-300 ${
                  message.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-slate-300">Student/Employee No.</label>
                <input
                  name="studentNo"
                  value={form.studentNo}
                  onChange={handleChange}
                  placeholder="Enter ID number"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition duration-300 focus:scale-[1.01] focus:border-cyan-400"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-slate-300">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition duration-300 focus:scale-[1.01] focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">College</label>
                <input
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  placeholder="Enter college"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition duration-300 focus:scale-[1.01] focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition duration-300 focus:scale-[1.01] focus:border-cyan-400"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Purpose of Visit</label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  placeholder="Enter reason for visiting the library"
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition duration-300 focus:scale-[1.01] focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md animate-[slideUp_0.8s_ease-out]">
            <h3 className="text-lg font-semibold">Visitor Actions</h3>
            <p className="mt-2 text-sm text-slate-400">
              Use clock in when entering and clock out when leaving.
            </p>

            <div className="mt-6 space-y-4">
              <button
                onClick={handleClockIn}
                disabled={loading !== null}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-4 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="transition duration-300 group-hover:translate-x-1" size={20} />
                {loading === "in" ? "Clocking In..." : "Clock In"}
              </button>

              <button
                onClick={handleClockOut}
                disabled={loading !== null}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-500 px-4 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="transition duration-300 group-hover:translate-x-1" size={20} />
                {loading === "out" ? "Clocking Out..." : "Clock Out"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Note</p>
              <p className="mt-2">
                For clock out, only the Student/Employee No. is required. For first-time visitors, complete all details before clock in.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
