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
  TrendingUp,
  UserRound,
  Clock3,
  Filter,
  Users,
  ClipboardList,
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
        .select("*")
        .order("clock_in", { ascending: false });

      if (error) {
        toast.error("Failed to load logs");
      } else {
        setLogs(data || []);
      }

      setLoadingLogs(false);
    };

    if (user && isAdmin) fetchLogs();
  }, [user, isAdmin]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    const q = search.toLowerCase();
    if (q) {
      result = result.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        )
      );
    }

    if (selectedCollege !== "All Colleges") {
      result = result.filter((r) => r.college === selectedCollege);
    }

    if (selectedStatus !== "All") {
      result = result.filter(
        (r) =>
          (r.employee_status ?? "").toLowerCase() ===
          selectedStatus.toLowerCase()
      );
    }

    if (selectedPurpose !== "All Purposes") {
      result = result.filter((r) => r.purpose === selectedPurpose);
    }

    const now = new Date();

    if (dateRange === "Today") {
      result = result.filter((r) =>
        r.clock_in
          ? new Date(r.clock_in).toDateString() === now.toDateString()
          : false
      );
    }

    return result;
  }, [logs, search, selectedCollege, selectedStatus, selectedPurpose, dateRange]);

  const totalVisits = filteredLogs.length;
  const currentlyActive = filteredLogs.filter((l) => !l.clock_out).length;
  const uniqueVisitors = new Set(filteredLogs.map((l) => l.id_number)).size;

  const avgDuration = useMemo(() => {
    const done = filteredLogs.filter((l) => l.clock_in && l.clock_out);
    if (!done.length) return 0;

    const total = done.reduce((sum, r) => {
      const start = new Date(r.clock_in!).getTime();
      const end = new Date(r.clock_out!).getTime();
      return sum + (end - start) / 60000;
    }, 0);

    return Math.round(total / done.length);
  }, [filteredLogs]);

  const uniqueVisitorRows = useMemo(() => {
    const map = new Map();
    filteredLogs.forEach((row) => {
      const key = row.id_number || row.gmail || row.id;
      if (!map.has(key)) map.set(key, row);
    });
    return Array.from(map.values());
  }, [filteredLogs]);

  // 🔥 Visitors by College
  const collegeStats = useMemo(() => {
    const map = new Map();

    filteredLogs.forEach((row) => {
      const college = row.college || "Other";
      const key = row.id_number || row.gmail || row.id;

      if (!map.has(college)) {
        map.set(college, {
          total: 0,
          unique: new Set(),
        });
      }

      const entry = map.get(college);
      entry.total++;
      entry.unique.add(key);
    });

    return Array.from(map.entries()).map(([college, data]) => ({
      college,
      totalVisits: data.total,
      uniqueVisitors: data.unique.size,
    }));
  }, [filteredLogs]);

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            filter: "blur(8px) brightness(0.2)",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-8 space-y-6">
          {/* HEADER */}
          <h1 className="text-4xl font-bold text-white">
            Dashboard
          </h1>

          {/* SEARCH */}
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Search className="text-white/60" />
              <input
                className="w-full bg-transparent text-white outline-none"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* CARDS */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card title="Total Visits" value={totalVisits} />
            <Card title="Active" value={currentlyActive} />
            <Card title="Unique" value={uniqueVisitors} />
            <Card title="Avg Time" value={`${avgDuration} min`} />
          </div>

          {/* FILTERS */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur grid md:grid-cols-4 gap-3">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>

            <select value={selectedPurpose} onChange={(e) => setSelectedPurpose(e.target.value)}>
              <option>All Purposes</option>
              <option>Borrow Books</option>
              <option>Use Computers</option>
            </select>

            <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)}>
              <option>All Colleges</option>
              <option>College of Computer Studies</option>
            </select>

            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option>All</option>
              <option>Student</option>
              <option>Teacher</option>
            </select>
          </div>

          {/* 🔥 VISITORS BY COLLEGE */}
          <div className="bg-white/10 p-5 rounded-xl backdrop-blur">
            <h2 className="text-white text-xl mb-4">Visitors by College</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {collegeStats.map((c) => (
                <div key={c.college} className="bg-white/5 p-4 rounded-xl">
                  <h3 className="text-white font-bold uppercase">{c.college}</h3>
                  <p className="text-white/70">Total Visits: {c.totalVisits}</p>
                  <p className="text-white/70">Unique Visitors: {c.uniqueVisitors}</p>
                </div>
              ))}
            </div>
          </div>

          {/* VISIT LOGS */}
          <Table title="Visit Logs" data={filteredLogs} />

          {/* VISITORS */}
          <Table title="Visitors" data={uniqueVisitorRows} />
        </div>
      </div>
    </Layout>
  );
};

const Card = ({ title, value }: any) => (
  <div className="bg-white/10 p-4 rounded-xl text-white">
    <p className="text-sm text-white/70">{title}</p>
    <h2 className="text-3xl font-bold">{value}</h2>
  </div>
);

const Table = ({ title, data }: any) => (
  <div className="bg-white/10 p-5 rounded-xl backdrop-blur">
    <h2 className="text-white text-xl mb-4">{title}</h2>
    <table className="w-full text-white text-sm">
      <tbody>
        {data.map((row: any) => (
          <tr key={row.id} className="border-b border-white/10">
            <td>{row.visitor_name || row.id_number}</td>
            <td>{row.college}</td>
            <td>{row.purpose}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;
