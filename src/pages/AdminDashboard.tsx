import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  UserRound,
  Clock3,
  Filter,
  Shield,
  GraduationCap,
  RefreshCw,
  UserPlus,
  Ban,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import libraryBg from "@/assets/library-bg.jpg";

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

type ManagedEmail = {
  id: string;
  email: string;
  addedBy: string;
  dateAdded: string;
};

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("All Colleges");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPurpose, setSelectedPurpose] = useState("All Purposes");
  const [dateRange, setDateRange] = useState("Today");

  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const [adminEmail, setAdminEmail] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const [admins, setAdmins] = useState<ManagedEmail[]>([
    {
      id: "1",
      email: "jhunelle.remo@neu.edu.ph",
      addedBy: "system",
      dateAdded: new Date().toLocaleDateString(),
    },
    {
      id: "2",
      email: "jcesperanza@neu.edu.ph",
      addedBy: "system",
      dateAdded: new Date().toLocaleDateString(),
    },
  ]);

  const [staffFaculty, setStaffFaculty] = useState<ManagedEmail[]>([
    {
      id: "1",
      email: "jcesperanza@neu.edu.ph",
      addedBy: "system",
      dateAdded: new Date().toLocaleDateString(),
    },
  ]);

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

  const fetchLogs = async () => {
    setLoadingLogs(true);

    const { data, error } = await supabase
      .from("visitor_logs")
      .select(
        "id, visitor_name, gmail, id_number, college, purpose, employee_status, clock_in, clock_out"
      )
      .order("clock_in", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load visitor logs");
    } else {
      setLogs((data as LogRow[]) ?? []);
    }

    setLoadingLogs(false);
  };

  useEffect(() => {
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
          row.visitor_name,
          row.gmail,
          row.id_number,
          row.college,
          row.purpose,
          row.employee_status,
          row.clock_in ? new Date(row.clock_in).toLocaleString() : "",
          row.clock_out ? new Date(row.clock_out).toLocaleString() : "",
        ];

        return values.some((v) => String(v ?? "").toLowerCase().includes(q));
      });
    }

    if (selectedCollege !== "All Colleges") {
      result = result.filter((row) => row.college === selectedCollege);
    }

    if (selectedStatus !== "All") {
      result = result.filter(
        (row) =>
          (row.employee_status ?? "").toLowerCase() ===
          selectedStatus.toLowerCase()
      );
    }

    if (selectedPurpose !== "All Purposes") {
      result = result.filter((row) => row.purpose === selectedPurpose);
    }

    const now = new Date();

    if (dateRange === "Today") {
      result = result.filter((row) => {
        if (!row.clock_in) return false;
        return new Date(row.clock_in).toDateString() === now.toDateString();
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
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }

    return result;
  }, [logs, search, selectedCollege, selectedStatus, selectedPurpose, dateRange]);

  const uniqueVisitors = new Set(
    filteredLogs.map((row) => row.id_number || row.gmail || row.id).filter(Boolean)
  ).size;

  const activeVisitors = filteredLogs.filter((row) => !row.clock_out).length;

  const avgDuration = useMemo(() => {
    const completed = filteredLogs.filter((row) => row.clock_in && row.clock_out);
    if (!completed.length) return 0;

    const total = completed.reduce((sum, row) => {
      const start = new Date(row.clock_in as string).getTime();
      const end = new Date(row.clock_out as string).getTime();
      return sum + Math.max(0, Math.round((end - start) / 60000));
    }, 0);

    return Math.round(total / completed.length);
  }, [filteredLogs]);

  const todayCount = useMemo(() => {
    const now = new Date();
    return logs.filter((row) => {
      if (!row.clock_in) return false;
      return new Date(row.clock_in).toDateString() === now.toDateString();
    }).length;
  }, [logs]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    return logs.filter((row) => {
      if (!row.clock_in) return false;
      return new Date(row.clock_in) >= start;
    }).length;
  }, [logs]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return logs.filter((row) => {
      if (!row.clock_in) return false;
      const d = new Date(row.clock_in);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [logs]);

  const collegeStats = useMemo(() => {
    const map = new Map<
      string,
      {
        totalVisits: number;
        uniqueVisitors: Set<string>;
      }
    >();

    filteredLogs.forEach((row) => {
      const college = row.college?.trim() || "Other";
      const visitorKey = row.id_number || row.gmail || row.id;

      if (!map.has(college)) {
        map.set(college, {
          totalVisits: 0,
          uniqueVisitors: new Set<string>(),
        });
      }

      const entry = map.get(college)!;
      entry.totalVisits += 1;
      if (visitorKey) entry.uniqueVisitors.add(visitorKey);
    });

    return Array.from(map.entries())
      .map(([college, data]) => ({
        college,
        totalVisits: data.totalVisits,
        uniqueVisitors: data.uniqueVisitors.size,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits);
  }, [filteredLogs]);

  const collegeOptions = useMemo(() => {
    const values = Array.from(
      new Set(logs.map((row) => row.college).filter(Boolean))
    ) as string[];
    return values.sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const purposeOptions = useMemo(() => {
    const values = Array.from(
      new Set(logs.map((row) => row.purpose).filter(Boolean))
    ) as string[];
    return values.sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const handleToggleBlock = (rowId: string) => {
    setBlockedIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );

    const isBlocked = blockedIds.includes(rowId);
    toast.success(isBlocked ? "Visitor unblocked" : "Visitor blocked");
  };

  const handleAddAdmin = () => {
    const email = adminEmail.trim().toLowerCase();

    if (!email) {
      toast.error("Enter admin email first");
      return;
    }

    if (!email.endsWith("@neu.edu.ph")) {
      toast.error("Use a valid NEU email");
      return;
    }

    if (admins.some((item) => item.email === email)) {
      toast.error("Admin already exists");
      return;
    }

    setAdmins((prev) => [
      {
        id: crypto.randomUUID(),
        email,
        addedBy: user?.email || "system",
        dateAdded: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);
    setAdminEmail("");
    toast.success("Admin added");
  };

  const handleRemoveAdmin = (id: string) => {
    setAdmins((prev) => prev.filter((item) => item.id !== id));
    toast.success("Admin removed");
  };

  const handleAddStaff = () => {
    const email = staffEmail.trim().toLowerCase();

    if (!email) {
      toast.error("Enter staff/faculty email first");
      return;
    }

    if (!email.endsWith("@neu.edu.ph")) {
      toast.error("Use a valid NEU email");
      return;
    }

    if (staffFaculty.some((item) => item.email === email)) {
      toast.error("Staff/Faculty already exists");
      return;
    }

    setStaffFaculty((prev) => [
      {
        id: crypto.randomUUID(),
        email,
        addedBy: user?.email || "system",
        dateAdded: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);
    setStaffEmail("");
    toast.success("Staff/Faculty added");
  };

  const handleRemoveStaff = (id: string) => {
    setStaffFaculty((prev) => prev.filter((item) => item.id !== id));
    toast.success("Staff/Faculty removed");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 text-white">
          Loading admin dashboard...
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-5.5rem)] overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px) brightness(0.18)",
          }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/75" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_30%)]" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-200">
                <Shield className="h-3.5 w-3.5" />
                Admin Control Center
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-white/65">
                Monitor visitor activity, manage access, review logs, and organize
                admin and staff permissions in one dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <p className="text-sm text-white/60">Logged in as</p>
              <p className="font-medium text-white">{user.email}</p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Activity className="h-5 w-5 text-blue-300" />}
              title="Filtered Visits"
              value={filteredLogs.length}
              subtitle="Current results"
              accent="blue"
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-emerald-300" />}
              title="Active Visitors"
              value={activeVisitors}
              subtitle="Still inside"
              accent="emerald"
            />
            <StatCard
              icon={<UserRound className="h-5 w-5 text-amber-300" />}
              title="Unique Visitors"
              value={uniqueVisitors}
              subtitle="Distinct people"
              accent="amber"
            />
            <StatCard
              icon={<Clock3 className="h-5 w-5 text-violet-300" />}
              title="Avg. Duration"
              value={`${avgDuration} min`}
              subtitle="Completed visits"
              accent="violet"
            />
          </div>

          <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Visitor Statistics</h2>
                <p className="text-sm text-white/55">
                  Quick overview for today, this week, and this month
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MiniStatCard label="Today" value={todayCount} />
              <MiniStatCard label="This Week" value={thisWeekCount} />
              <MiniStatCard label="This Month" value={thisMonthCount} />
            </div>
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Visitors by College</h2>
                <p className="text-sm text-white/55">
                  College-based breakdown based on the current filters
                </p>
              </div>
            </div>

            {collegeStats.length === 0 ? (
              <p className="text-white/60">No college data available.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collegeStats.map((item) => (
                  <div
                    key={item.college}
                    className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07]"
                  >
                    <h3 className="text-lg font-bold uppercase tracking-wide text-white">
                      {item.college}
                    </h3>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/65">
                        <span>Total Visits</span>
                        <span className="text-base font-semibold text-white">
                          {item.totalVisits}
                        </span>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="flex items-center justify-between text-sm text-white/65">
                        <span>Unique Visitors</span>
                        <span className="text-base font-semibold text-white">
                          {item.uniqueVisitors}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">Search & Filter Visitors</h2>
              <p className="text-sm text-white/55">
                Find visitor records by email, student number, name, college, purpose, or date
              </p>
            </div>

            <div className="mb-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by name, email, student number, college, reason, date..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Date Range">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="dashboard-select"
                >
                  <option className="text-black">Today</option>
                  <option className="text-black">This Week</option>
                  <option className="text-black">This Month</option>
                  <option className="text-black">All Dates</option>
                </select>
              </FilterField>

              <FilterField label="College">
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="dashboard-select"
                >
                  <option className="text-black">All Colleges</option>
                  {collegeOptions.map((college) => (
                    <option key={college} className="text-black">
                      {college}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Purpose">
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="dashboard-select"
                >
                  <option className="text-black">All Purposes</option>
                  {purposeOptions.map((purpose) => (
                    <option key={purpose} className="text-black">
                      {purpose}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Employee Status">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="dashboard-select"
                >
                  <option className="text-black">All</option>
                  <option className="text-black">Student</option>
                  <option className="text-black">Teacher</option>
                  <option className="text-black">Staff</option>
                </select>
              </FilterField>
            </div>
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Visitor Results ({filteredLogs.length})
                </h2>
                <p className="text-sm text-white/55">
                  Live visitor records from your visitor log table
                </p>
              </div>
            </div>

            {loadingLogs ? (
              <p className="text-white/60">Loading visitor logs...</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/[0.06] text-white/55">
                    <tr>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Student Number</th>
                      <th className="px-4 py-3 font-medium">Full Name</th>
                      <th className="px-4 py-3 font-medium">College</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((row) => {
                      const isBlocked = blockedIds.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          className="border-t border-white/8 transition-colors hover:bg-white/[0.035]"
                        >
                          <td className="px-4 py-3">{row.gmail ?? "-"}</td>
                          <td className="px-4 py-3">{row.id_number ?? "-"}</td>
                          <td className="px-4 py-3">{row.visitor_name ?? "-"}</td>
                          <td className="px-4 py-3">{row.college ?? "-"}</td>
                          <td className="px-4 py-3">{row.purpose ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                row.clock_out
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : "bg-amber-400/10 text-amber-300"
                              }`}
                            >
                              {row.clock_out ? "Completed" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {row.clock_in
                              ? new Date(row.clock_in).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleBlock(row.id)}
                              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                                isBlocked
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                                  : "border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15"
                              }`}
                            >
                              {isBlocked ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Block
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {!filteredLogs.length && (
                  <div className="px-4 py-8 text-center text-white/55">
                    No visitor records found.
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-300" />
                  <h2 className="text-xl font-semibold text-white">
                    Admin Management
                  </h2>
                </div>
                <p className="text-sm text-white/55">
                  Add or remove admin access for NEU email accounts
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
  <table className="min-w-[720px] w-full text-left text-sm text-white">
    <thead className="bg-white/[0.06] text-white/55">
      <tr>
        <th className="px-4 py-3 font-medium">Email</th>
        <th className="px-4 py-3 font-medium">Added By</th>
        <th className="px-4 py-3 font-medium">Date Added</th>
        <th className="px-4 py-3 font-medium w-[120px] text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {admins.map((item) => (
        <tr key={item.id} className="border-t border-white/8">
          <td className="px-4 py-3">{item.email}</td>
          <td className="px-4 py-3">{item.addedBy}</td>
          <td className="px-4 py-3">{item.dateAdded}</td>
          <td className="px-4 py-3 text-right">
            <button
              onClick={() => handleRemoveAdmin(item.id)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/15"
            >
              Remove
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">
                    Staff/Faculty Management
                  </h2>
                </div>
                <p className="text-sm text-white/55">
                  Add or remove staff and faculty members
                </p>
              </div>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="Enter NEU email (@neu.edu.ph)"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/15 px-4 text-white outline-none placeholder:text-white/30"
                />
                <button
                  onClick={handleAddStaff}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 text-sm font-medium text-amber-200 transition hover:bg-amber-400/15"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Staff/Faculty
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/[0.06] text-white/55">
                    <tr>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Added By</th>
                      <th className="px-4 py-3 font-medium">Date Added</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffFaculty.map((item) => (
                      <tr key={item.id} className="border-t border-white/8">
                        <td className="px-4 py-3">{item.email}</td>
                        <td className="px-4 py-3">{item.addedBy}</td>
                        <td className="px-4 py-3">{item.dateAdded}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveStaff(item.id)}
                            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/15"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => void fetchLogs()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Statistics
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  accent: "blue" | "emerald" | "amber" | "violet";
}) => {
  const accents = {
    blue: "from-blue-400/15 to-blue-500/5",
    emerald: "from-emerald-400/15 to-emerald-500/5",
    amber: "from-amber-400/15 to-amber-500/5",
    violet: "from-violet-400/15 to-violet-500/5",
  };

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accents[accent]} p-5 shadow-2xl backdrop-blur-xl`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          {icon}
        </div>
      </div>
      <p className="text-sm text-white/60">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{subtitle}</p>
    </div>
  );
};

const MiniStatCard = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <p className="text-sm uppercase tracking-wide text-white/45">{label}</p>
    <p className="mt-3 text-5xl font-bold text-white">{value}</p>
    <p className="mt-1 text-sm text-white/40">Visitors</p>
  </div>
);

const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-white/70">
      {label}
    </label>
    {children}
  </div>
);

export default AdminDashboard;
