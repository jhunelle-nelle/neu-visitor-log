import { useState } from "react";
import Layout from "@/components/Layout";
import libraryBg from "@/assets/library-bg.jpg";
import { LogIn, LogOut, Clock3 } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<"clockin" | "clockout">("clockin");

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

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-3xl bg-primary px-8 py-4 shadow-elevated">
              <h1 className="font-display text-5xl font-bold text-white">
                Welcome to
              </h1>
              <h2 className="font-display text-5xl font-bold text-secondary">
                NEU Library
              </h2>
            </div>

            <p className="mt-6 text-3xl text-white/90">Sign in below to log your visit</p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setMode("clockin")}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${
                  mode === "clockin"
                    ? "bg-primary text-white"
                    : "bg-white text-foreground"
                }`}
              >
                <LogIn className="h-4 w-4" />
                Clock In
              </button>

              <button
                onClick={() => setMode("clockout")}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${
                  mode === "clockout"
                    ? "bg-primary text-white"
                    : "bg-white text-foreground"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Clock Out
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-3xl rounded-3xl bg-card/95 p-6 shadow-elevated backdrop-blur-sm">
            {mode === "clockin" ? (
              <>
                <div className="mb-6">
                  <h3 className="text-4xl font-semibold">Clock In</h3>
                  <p className="text-muted-foreground">Enter your details to log your visit</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Student/Employee No. *</label>
                    <input
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                      placeholder="2024-00001"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Full Name *</label>
                    <input
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">College / Department *</label>
                    <select className="w-full rounded-xl border px-4 py-3 outline-none">
                      <option>Select your college</option>
                      <option>CAS</option>
                      <option>CBA</option>
                      <option>CCJE</option>
                      <option>COE</option>
                      <option>CTHM</option>
                      <option>Senior High School</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Purpose of Visit *</label>
                    <select className="w-full rounded-xl border px-4 py-3 outline-none">
                      <option>Select purpose</option>
                      <option>Study</option>
                      <option>Research</option>
                      <option>Borrow Books</option>
                      <option>Internet Use</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Status</label>
                    <select className="w-full rounded-xl border px-4 py-3 outline-none">
                      <option>Student</option>
                      <option>Teacher</option>
                      <option>Staff</option>
                    </select>
                  </div>

                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-white">
                    <Clock3 className="h-4 w-4" />
                    Clock In
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-4xl font-semibold">Clock Out</h3>
                  <p className="text-muted-foreground">Enter your ID number to clock out</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Student/Employee No. *</label>
                    <input
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                      placeholder="2024-00001"
                    />
                  </div>

                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-4 text-secondary-foreground">
                    <LogOut className="h-4 w-4" />
                    Clock Out
                  </button>
                </div>
              </>
            )}
          </div>

          <footer className="mt-10 text-center text-sm text-white/80">
            © 2026 New Era University Library. All rights reserved.
          </footer>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
