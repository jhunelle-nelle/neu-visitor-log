import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  UserRound,
  Clock3,
  Shield,
  GraduationCap,
  RefreshCw,
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

const ALLOWED_ADMIN_EMAILS = [
  "jcesperanza@neu.edu.ph",
  "jhunelle.remo@neu.edu.ph",
  "joshuaandre.tindoy@neu.edu.ph",
];

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

  const adminEmail = (user?.email ?? "").toLowerCase();
  const hasAdminAccess = isAdmin || ALLOWED_ADMIN_EMAILS.includes(adminEmail);

  const [admins] = useState<ManagedEmail[]>([
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
    {
      id: "3",
      email: "joshuaandre.tindoy@neu.edu.ph",
      addedBy: "system",
      dateAdded: new Date().toLocaleDateString(),
    },
  ]);

  const [staffFaculty] = useState<ManagedEmail[]>([
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
      } else if (!hasAdminAccess) {
        toast.error("You don't have access");
        navigate("/");
      }
    }
  }, [user, loading, hasAdminAccess, navigate]);

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
    if (user && hasAdminAccess) {
      void fetchLogs();
    }
  }, [user, hasAdminAccess]);

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 text-white">
          Loading admin dashboard...
        </div>
      </Layout>
    );
  }

  if (!user || !hasAdminAccess) return null;

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
                Monitor visitor activity, manage access, review logs, and view
                admin and staff permissions in one dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <p className="text-sm text-white/60">Logged in as</p>
              <
      <p className="font-medium text-white">{user.email}</p>
</div>
</div>

{/* STATS */}
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

{/* VISITOR STATS */}
<section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
  <h2 className="text-xl font-semibold text-white mb-4">
    Visitor Statistics
  </h2>

  <div className="grid gap-4 md:grid-cols-3">
    <MiniStatCard label="Today" value={todayCount} />
    <MiniStatCard label="This Week" value={thisWeekCount} />
    <MiniStatCard label="This Month" value={thisMonthCount} />
  </div>
</section>

{/* SEARCH */}
<section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
  <h2 className="text-xl font-semibold text-white mb-4">
    Search & Filter Visitors
  </h2>

  <input
    type="text"
    placeholder="Search by name, email, student number..."
    className="w-full px-4 py-3 rounded-xl bg-black/20 text-white"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</section>

{/* TABLE */}
<section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
  <h2 className="text-xl font-semibold text-white mb-4">
    Visitor Results ({filteredLogs.length})
  </h2>

  <div className="overflow-x-auto">
    <table className="w-full text-sm text-white">
      <thead className="text-white/60">
        <tr>
          <th>Email</th>
          <th>Student Number</th>
          <th>Full Name</th>
          <th>College</th>
          <th>Reason</th>
          <th>Date & Time</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {filteredLogs.map((row) => {
          const isBlocked = blockedIds.includes(row.id);

          return (
            <tr key={row.id} className="border-t border-white/10">
              <td>{row.gmail}</td>
              <td>{row.id_number}</td>
              <td>{row.visitor_name}</td>
              <td>{row.college}</td>
              <td>{row.purpose}</td>
              <td>
                {row.clock_in
                  ? new Date(row.clock_in).toLocaleString()
                  : "-"}
              </td>

              <td>
                <button
                  onClick={() => handleToggleBlock(row.id)}
                  className="text-red-400"
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</section>

{/* ADMIN DISPLAY ONLY */}
<section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
  <div className="flex items-center gap-2 mb-4">
    <Shield className="h-5 w-5 text-blue-300" />
    <h2 className="text-xl font-semibold text-white">
      Current Admins
    </h2>
  </div>

  <table className="w-full text-sm text-white">
    <thead className="text-white/60">
      <tr>
        <th>Email</th>
        <th>Added By</th>
        <th>Date Added</th>
      </tr>
    </thead>
    <tbody>
      {admins.map((item) => (
        <tr key={item.id} className="border-t border-white/10">
          <td>{item.email}</td>
          <td>{item.addedBy}</td>
          <td>{item.dateAdded}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

{/* STAFF DISPLAY ONLY */}
<section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
  <div className="flex items-center gap-2 mb-4">
    <GraduationCap className="h-5 w-5 text-amber-300" />
    <h2 className="text-xl font-semibold text-white">
      Staff / Faculty Accounts
    </h2>
  </div>

  <table className="w-full text-sm text-white">
    <thead className="text-white/60">
      <tr>
        <th>Email</th>
        <th>Added By</th>
        <th>Date Added</th>
      </tr>
    </thead>
    <tbody>
      {staffFaculty.map((item) => (
        <tr key={item.id} className="border-t border-white/10">
          <td>{item.email}</td>
          <td>{item.addedBy}</td>
          <td>{item.dateAdded}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

{/* REFRESH */}
<div className="mt-6 flex justify-center">
  <button
    onClick={() => fetchLogs()}
    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white"
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

export default AdminDashboard;
