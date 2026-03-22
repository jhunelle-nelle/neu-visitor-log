import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import libraryBg from "@/assets/library-bg.jpg";
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
  const [selectedCollege, setSelectedCollege] = useState("All Colleges");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPurpose, setSelectedPurpose] = useState("All Purposes");
  const [dateRange, setDateRange] = useState("Today");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please log in first.");
        navigate("/login");
      } else if (!isAdmin) {
        toast.error("You don't have access");
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
        console.error(error);
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
    let result = [...logs];

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((row) => {
        const values = [
          row.id_number,
          row.visitor_name,
          row.gmail,
          row.purpose,
          row.college,
          row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : "",
          row.clock_in ? new Date(row.clock_in).toLocaleDateString() : "",
          row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : "",
          row.clock_out ? new Date(row.clock_out).toLocaleDateString() : "",
        ];

        return values.some((v) => String(v ?? "").toLowerCase().includes(q));
      });
    }

    if (selectedCollege !== "All Colleges") {
      result = result.filter((row) => row.college === selectedCollege);
    }

    if (selectedStatus !== "All") {
      result = result.filter((row) => row.employee_status === selectedStatus.toLowerCase());
    }

    if (selectedPurpose !== "All Purposes") {
      result = result.filter((row) => row.purpose === selectedPurpose);
    }

    const now = new Date();
    if (dateRange === "Today") {
      result = result.filter((row) => {
        if (!row.clock_in) return false;
        const d = new Date(row.clock_in);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateRange === "This Week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);

      result = result.filter((row) => {
        if (!row.clock_in) return false;
        return new Date(row.clock_in) >= start;
      });
    } else if (dateRange === "This Month") {
      result = result.filter((row) => {
        if (!row.clock_in) return false;
        const d = new Date(row.clock_in);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    return result;
  }, [logs, search, selectedCollege, selectedStatus, selectedPurpose, dateRange]);

  const totalVisits = filteredLogs.length;
  const currentlyActive = filteredLogs.filter((l) => !l.clock_out).length;
  const uniqueVisitors = new Set(filteredLogs.map((l) => l.id_number).filter(Boolean)).size;

  const avgDuration = useMemo(() => {
    const completed = filteredLogs.filter((l) => l.clock_in && l.clock_out);

    if (!completed.length) return 0;

    const totalMinutes = completed.reduce((sum, row) => {
      const start = new Date(row.clock_in as string).getTime();
      const end = new Date(row.clock_out as string).getTime();
      return sum + Math.max(0, Math.round((end - start) / 60000));
    }, 0);

    return Math.round(totalMinutes / completed.length);
  }, [filteredLogs]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Admin";

  const uniqueVisitorRows = useMemo(() => {
    const map = new Map<string, LogRow>();

    filteredLogs.forEach((row) => {
      const key = row.id_number || row.gmail || row.id;
      if (!map.has(key)) {
        map.set(key, row);
      }
    });

    return Array.from(map.values());
  }, [filteredLogs]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <p>Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) return null;

  const renderLogsTable = () => (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          Visit Logs ({filteredLogs.length})
        </h2>
      </div>

      {loadingLogs ? (
        <p className="text-white/80">Loading logs...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="px-3 py-3">Gmail</th>
                <th className="px-3 py-3">Student Number</th>
                <th className="px-3 py-3">Full Name</th>
                <th className="px-3 py-3">College</th>
                <th className="px-3 py-3">Purpose</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Date & Time In</th>
                <th className="px-3 py-3">Time Out</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((row) => (
                <tr key={row.id} className="border-b border-white/10">
                  <td className="px-3 py-3">{row.gmail ?? "-"}</td>
                  <td className="px-3 py-3">{row.id_number ?? "-"}</td>
                  <td className="px-3 py-3">{row.visitor_name ?? "-"}</td>
                  <td className="px-3 py-3">{row.college ?? "-"}</td>
                  <td className="px-3 py-3">{row.purpose ?? "-"}</td>
                  <td className="px-3 py-3 capitalize">{row.employee_status ?? "-"}</td>
                  <td className="px-3 py-3">
                    {row.clock_in ? new Date(row.clock_in).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-3">
                    {row.clock_out ? new Date(row.clock_out).toLocaleString() : "Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-5.5rem)] overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px) brightness(0.22)",
          }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/60" />

        <div className="relative z-10 container mx-auto px-4 py-8 animate-in fade-in duration-700">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold text-white">
                Welcome, {displayName}!
              </h1>
              <p className="mt-2 text-white/70">University Library Lab — Admin Panel</p>
              <span className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                Admin
              </span>
            </div>

            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-white/20 hover:shadow-lg">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-red-600 hover:shadow-lg">
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-card backdrop-blur-md">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <Search className="h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search by student no., name, gmail, purpose, time, date..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-card backdrop-blur-md md:grid-cols-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                activeTab === "dashboard" ? "bg-white/15 font-medium text-white" : "text-white/70"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("visit_logs")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                activeTab === "visit_logs" ? "bg-white/15 font-medium text-white" : "text-white/70"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Visit Logs
            </button>

            <button
              onClick={() => setActiveTab("visitors")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                activeTab === "visitors" ? "bg-white/15 font-medium text-white" : "text-white/70"
              }`}
            >
              <Users className="h-4 w-4" />
              Visitors
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                activeTab === "admin" ? "bg-white/15 font-medium text-white" : "text-white/70"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          </div>

          {(activeTab === "dashboard" || activeTab === "visit_logs") && (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/70">Total Visits</p>
                      <p className="mt-2 text-4xl font-bold text-white">{totalVisits}</p>
                    </div>
                    <div className="rounded-2xl bg-blue-500/20 p-3">
                      <TrendingUp className="h-5 w-5 text-blue-300" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/70">Currently Active</p>
                      <p className="mt-2 text-4xl font-bold text-white">{currentlyActive}</p>
                    </div>
                    <div className="rounded-2xl bg-yellow-500/20 p-3">
                      <Users className="h-5 w-5 text-yellow-300" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/70">Unique Visitors</p>
                      <p className="mt-2 text-4xl font-bold text-white">{uniqueVisitors}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/20 p-3">
                      <UserRound className="h-5 w-5 text-amber-300" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/70">Avg. Duration</p>
                      <div className="mt-2 flex items-end gap-1">
                        <p className="text-4xl font-bold text-white">{avgDuration}</p>
                        <span className="pb-1 text-sm text-white/70">min</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Clock3 className="h-5 w-5 text-white/70" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md">
                <div className="mb-5 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-white" />
                  <h2 className="text-xl font-semibold text-white">Filters</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
                    >
                      <option className="text-black">Today</option>
                      <option className="text-black">This Week</option>
                      <option className="text-black">This Month</option>
                      <option className="text-black">All Dates</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">Purpose</label>
                    <select
                      value={selectedPurpose}
                      onChange={(e) => setSelectedPurpose(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
                    >
                      <option className="text-black">All Purposes</option>
                      <option className="text-black">Study / Research</option>
                      <option className="text-black">Borrow Books</option>
                      <option className="text-black">Return Books</option>
                      <option className="text-black">Use Computers</option>
                      <option className="text-black">Group Study</option>
                      <option className="text-black">Thesis / Dissertation</option>
                      <option className="text-black">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">College</label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
                    >
                      <option className="text-black">All Colleges</option>
                      <option className="text-black">College of Arts and Sciences</option>
                      <option className="text-black">College of Business Administration</option>
                      <option className="text-black">College of Computer Studies</option>
                      <option className="text-black">College of Education</option>
                      <option className="text-black">College of Engineering</option>
                      <option className="text-black">College of Dentistry</option>
                      <option className="text-black">College of Law</option>
                      <option className="text-black">Graduate School</option>
                      <option className="text-black">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">Employee Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
                    >
                      <option className="text-black">All</option>
                      <option className="text-black">Student</option>
                      <option className="text-black">Teacher</option>
                      <option className="text-black">Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {renderLogsTable()}
            </>
          )}

          {activeTab === "visitors" && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md">
              <h2 className="mb-4 text-2xl font-semibold text-white">
                Visitors ({uniqueVisitorRows.length})
              </h2>

              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-3 py-3">Student Number</th>
                      <th className="px-3 py-3">Full Name</th>
                      <th className="px-3 py-3">Gmail</th>
                      <th className="px-3 py-3">College</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueVisitorRows.map((row) => (
                      <tr key={row.id} className="border-b border-white/10">
                        <td className="px-3 py-3">{row.id_number ?? "-"}</td>
                        <td className="px-3 py-3">{row.visitor_name ?? "-"}</td>
                        <td className="px-3 py-3">{row.gmail ?? "-"}</td>
                        <td className="px-3 py-3">{row.college ?? "-"}</td>
                        <td className="px-3 py-3 capitalize">{row.employee_status ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-card backdrop-blur-md">
              <h2 className="mb-4 text-2xl font-semibold text-white">Admin</h2>
              <p className="text-white"><strong>Logged in as:</strong> {user.email}</p>
              <p className="mt-2 text-white/70">
                Authorized admins:
                <br />
                jhunelle.remo@neu.edu.ph
                <br />
                jcesperanza@neu.edu.ph
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
