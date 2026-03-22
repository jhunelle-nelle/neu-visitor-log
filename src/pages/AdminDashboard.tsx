import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Download,
  Trash2,
  LayoutDashboard,
  ClipboardList,
  Users,
  Shield,
  TrendingUp,
  UserRound,
  Clock3,
  Filter,
} from "lucide-react";

type LogRow = {
  id: string;
  visitor_name: string | null;
  gmail?: string | null;
  id_number: string | null;
  college: string | null;
  purpose: string | null;
  employee_status: string | null;
  clock_in: string | null;
  clock_out: string | null;
};

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"dashboard" | "visit_logs" | "visitors" | "admin">("dashboard");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [search, setSearch] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please log in first.");
        navigate("/login");
      } else if (!isAdmin) {
        toast.error("You do not have admin access.");
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);

      const { data, error } = await supabase
        .from("visitor_logs")
        .select("id, visitor_name, gmail, id_number, college, purpose, employee_status, clock_in, clock_out")
        .order("clock_in", { ascending: false });

      if (error) {
        toast.error("Failed to load visitor logs");
      } else {
        setLogs((data as LogRow[]) ?? []);
      }

      setLoadingLogs(false);
    };

    if (user && isAdmin) {
      void fetchLogs();
    }
  }, [user, isAdmin]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return logs;

    return logs.filter((row) => {
      const values = [
        row.id_number,
        row.visitor_name,
        row.gmail,
        row.purpose,
        row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : "",
        row.clock_in ? new Date(row.clock_in).toLocaleDateString() : "",
        row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : "",
        row.clock_out ? new Date(row.clock_out).toLocaleDateString() : "",
      ];

      return values.some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [logs, search]);

  const totalVisits = logs.length;
  const currentlyActive = logs.filter((l) => !l.clock_out).length;
  const uniqueVisitors = new Set(logs.map((l) => l.id_number).filter(Boolean)).size;

  const avgDuration = useMemo(() => {
    const completed = logs.filter((l) => l.clock_in && l.clock_out);

    if (!completed.length) return 0;

    const totalMinutes = completed.reduce((sum, row) => {
      const start = new Date(row.clock_in as string).getTime();
      const end = new Date(row.clock_out as string).getTime();
      return sum + Math.max(0, Math.round((end - start) / 60000));
    }, 0);

    return Math.round(totalMinutes / completed.length);
  }, [logs]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Admin";

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <p>Loading admin panel...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">
              Welcome, {displayName}!
            </h1>
            <p className="mt-2 text-muted-foreground">University Library Lab — Admin Panel</p>
            <span className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              Admin
            </span>
          </div>

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-muted hover:shadow-lg">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-red-600 hover:shadow-lg">
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border bg-card p-3 shadow-card transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student no., name, gmail, purpose, time, date..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border bg-card p-2 shadow-card md:grid-cols-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
              activeTab === "dashboard" ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("visit_logs")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
              activeTab === "visit_logs" ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Visit Logs
          </button>

          <button
            onClick={() => setActiveTab("visitors")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
              activeTab === "visitors" ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Visitors
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
              activeTab === "admin" ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Visits</p>
                    <p className="mt-2 text-4xl font-bold">{totalVisits}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Currently Active</p>
                    <p className="mt-2 text-4xl font-bold">{currentlyActive}</p>
                  </div>
                  <div className="rounded-2xl bg-yellow-50 p-3">
                    <Users className="h-5 w-5 text-amber-700" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="mt-2 text-4xl font-bold">{uniqueVisitors}</p>
                  </div>
                  <div className="rounded-2xl bg-yellow-50 p-3">
                    <UserRound className="h-5 w-5 text-amber-700" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Duration</p>
                    <div className="mt-2 flex items-end gap-1">
                      <p className="text-4xl font-bold">{avgDuration}</p>
                      <span className="pb-1 text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-muted p-3">
                    <Clock3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-xl">
              <div className="mb-5 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Filters</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Date Range</label>
                  <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary">
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Purpose</label>
                  <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary">
                    <option>All Purposes</option>
                    <option>Study / Research</option>
                    <option>Borrow Books</option>
                    <option>Return Books</option>
                    <option>Use Computers</option>
                    <option>Group Study</option>
                    <option>Thesis / Dissertation</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">College</label>
                  <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary">
                    <option>All Colleges</option>
                    <option>College of Arts and Sciences</option>
                    <option>College of Business Administration</option>
                    <option>College of Computer Studies</option>
                    <option>College of Education</option>
                    <option>College of Engineering</option>
                    <option>College of Dentistry</option>
                    <option>College of Law</option>
                    <option>Graduate School</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Employee Status</label>
                  <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary">
                    <option>All</option>
                    <option>Student</option>
                    <option>Teacher</option>
                    <option>Staff</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "visit_logs" && (
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-2xl font-semibold">Visit Logs</h2>
            {loadingLogs ? (
              <p>Loading logs...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-3">Student No.</th>
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Gmail</th>
                      <th className="px-3 py-3">Purpose</th>
                      <th className="px-3 py-3">Time In</th>
                      <th className="px-3 py-3">Time Out</th>
                      <th className="px-3 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((row) => (
                      <tr key={row.id} className="border-b last:border-b-0">
                        <td className="px-3 py-3">{row.id_number}</td>
                        <td className="px-3 py-3">{row.visitor_name}</td>
                        <td className="px-3 py-3">{row.gmail ?? "-"}</td>
                        <td className="px-3 py-3">{row.purpose}</td>
                        <td className="px-3 py-3">{row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : "-"}</td>
                        <td className="px-3 py-3">{row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : "-"}</td>
                        <td className="px-3 py-3">{row.clock_in ? new Date(row.clock_in).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "visitors" && (
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-2xl font-semibold">Visitors</h2>
            <p className="text-muted-foreground">
              This tab can be expanded later to show unique visitor profiles grouped by student/employee number.
            </p>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-2xl font-semibold">Admin</h2>
            <p><strong>Logged in as:</strong> {user.email}</p>
            <p className="mt-2 text-muted-foreground">
              Google authentication only. Authorized admins:
              <br />
              jhunelle.remo@neu.edu.ph
              <br />
              jcesperanza@neu.edu.ph
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
