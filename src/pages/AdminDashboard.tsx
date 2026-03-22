import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import {
  Shield,
  Users,
  UserCheck,
  Clock3,
  Download,
  Ban,
  CheckCircle2,
  Search,
  CalendarDays,
  Filter,
  RefreshCw,
  UserCog,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type VisitLog = {
  id: string;
  student_no: string;
  full_name: string;
  college: string | null;
  purpose: string | null;
  status: string | null;
  time_in: string | null;
  time_out: string | null;
  created_at: string;
};

type BlockedVisitor = {
  id: string;
  student_no: string;
  full_name: string | null;
  reason: string | null;
  blocked: boolean;
  created_at: string;
};

type UserRoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "user";
};

const allowedAdmins = [
  "jcesperanza@neu.edu.ph",
  "jhunnelleremo71@gmail.com",
];

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VisitLog[]>([]);
  const [blockedVisitors, setBlockedVisitors] = useState<BlockedVisitor[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [dateMode, setDateMode] = useState<"today" | "week" | "range">("today");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [blockStudentNo, setBlockStudentNo] = useState("");
  const [blockName, setBlockName] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const [roleUserId, setRoleUserId] = useState("");
  const [roleValue, setRoleValue] = useState<"admin" | "user">("user");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
        return;
      }

      const isAllowed = allowedAdmins.includes(user.email ?? "");
      if (!isAllowed) {
        toast.error("You are not allowed to access the admin dashboard.");
        navigate("/");
        return;
      }

      fetchAllData();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    applyFilters();
  }, [logs, search, purposeFilter, collegeFilter, statusFilter, dateMode, startDate, endDate]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        fetchVisitLogs(),
        fetchBlockedVisitors(),
        fetchUserRoles(),
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin dashboard data.");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchVisitLogs = async () => {
    const { data, error } = await supabase
      .from("visit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to fetch visit logs.");
      return;
    }

    setLogs((data as VisitLog[]) || []);
  };

  const fetchBlockedVisitors = async () => {
    const { data, error } = await supabase
      .from("blocked_visitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setBlockedVisitors((data as BlockedVisitor[]) || []);
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("role", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setUserRoles((data as UserRoleRow[]) || []);
  };

  const applyFilters = () => {
    let result = [...logs];

    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    result = result.filter((log) => {
      const logDate = log.created_at ? new Date(log.created_at) : null;
      if (!logDate) return false;

      if (dateMode === "today") {
        return format(logDate, "yyyy-MM-dd") === todayStr;
      }

      if (dateMode === "week") {
        return logDate >= weekStart && logDate <= weekEnd;
      }

      if (dateMode === "range") {
        const logDay = format(logDate, "yyyy-MM-dd");
        return logDay >= startDate && logDay <= endDate;
      }

      return true;
    });

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.full_name?.toLowerCase().includes(s) ||
          log.student_no?.toLowerCase().includes(s) ||
          log.college?.toLowerCase().includes(s) ||
          log.purpose?.toLowerCase().includes(s)
      );
    }

    if (purposeFilter.trim()) {
      result = result.filter(
        (log) => (log.purpose || "").toLowerCase() === purposeFilter.toLowerCase()
      );
    }

    if (collegeFilter.trim()) {
      result = result.filter(
        (log) => (log.college || "").toLowerCase() === collegeFilter.toLowerCase()
      );
    }

    if (statusFilter.trim()) {
      result = result.filter(
        (log) => (log.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredLogs(result);
  };

  const stats = useMemo(() => {
    const totalVisitors = filteredLogs.length;
    const completedVisits = filteredLogs.filter((log) => !!log.time_out).length;
    const activeVisits = filteredLogs.filter((log) => !log.time_out).length;
    const uniqueVisitors = new Set(filteredLogs.map((log) => log.student_no)).size;

    return {
      totalVisitors,
      completedVisits,
      activeVisits,
      uniqueVisitors,
    };
  }, [filteredLogs]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();

    const source =
      dateMode === "today"
        ? [...Array(1)].map(() => new Date())
        : dateMode === "week"
        ? [...Array(7)].map((_, i) => subDays(new Date(), 6 - i))
        : [];

    if (dateMode === "today") {
      const label = format(new Date(), "MMM dd");
      map.set(label, 0);
    }

    if (dateMode === "week") {
      source.forEach((date) => {
        const label = format(date, "MMM dd");
        map.set(label, 0);
      });
    }

    if (dateMode === "range") {
      filteredLogs.forEach((log) => {
        const label = format(new Date(log.created_at), "MMM dd");
        map.set(label, (map.get(label) || 0) + 1);
      });

      return Array.from(map.entries()).map(([date, visitors]) => ({
        date,
        visitors,
      }));
    }

    filteredLogs.forEach((log) => {
      const label = format(new Date(log.created_at), "MMM dd");
      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries()).map(([date, visitors]) => ({
      date,
      visitors,
    }));
  }, [filteredLogs, dateMode]);

  const uniquePurposes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.purpose).filter(Boolean))) as string[];
  }, [logs]);

  const uniqueColleges = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.college).filter(Boolean))) as string[];
  }, [logs]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.status).filter(Boolean))) as string[];
  }, [logs]);

  const exportCSV = () => {
    if (!filteredLogs.length) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "Student/Employee No",
      "Full Name",
      "College",
      "Purpose",
      "Status",
      "Time In",
      "Time Out",
      "Created At",
    ];

    const rows = filteredLogs.map((log) => [
      log.student_no ?? "",
      log.full_name ?? "",
      log.college ?? "",
      log.purpose ?? "",
      log.status ?? "",
      log.time_in ?? "",
      log.time_out ?? "",
      log.created_at ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neu-visitor-report-${format(new Date(), "yyyy-MM-dd-HH-mm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully.");
  };

  const handleBlockVisitor = async () => {
    if (!blockStudentNo.trim()) {
      toast.error("Student/Employee No. is required.");
      return;
    }

    const payload = {
      student_no: blockStudentNo.trim(),
      full_name: blockName.trim() || null,
      reason: blockReason.trim() || "Blocked by admin",
      blocked: true,
    };

    const { error } = await supabase
      .from("blocked_visitors")
      .upsert(payload, { onConflict: "student_no" });

    if (error) {
      console.error(error);
      toast.error("Failed to block visitor.");
      return;
    }

    toast.success("Visitor blocked successfully.");
    setBlockStudentNo("");
    setBlockName("");
    setBlockReason("");
    fetchBlockedVisitors();
  };

  const handleUnblockVisitor = async (studentNo: string) => {
    const { error } = await supabase
      .from("blocked_visitors")
      .delete()
      .eq("student_no", studentNo);

    if (error) {
      console.error(error);
      toast.error("Failed to unblock visitor.");
      return;
    }

    toast.success("Visitor unblocked successfully.");
    fetchBlockedVisitors();
  };

  const handleRoleAssign = async () => {
    if (!roleUserId.trim()) {
      toast.error("User ID is required.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", roleUserId.trim());

    if (deleteError) {
      console.error(deleteError);
      toast.error("Failed to reset old role.");
      return;
    }

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: roleUserId.trim(),
        role: roleValue,
      });

    if (insertError) {
      console.error(insertError);
      toast.error("Failed to assign role.");
      return;
    }

    toast.success(`Role updated to ${roleValue}.`);
    setRoleUserId("");
    fetchUserRoles();
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center text-white text-lg">
          Loading admin dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1600&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />

        <div className="relative z-10 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      NEU Library Admin Dashboard
                    </h1>
                    <p className="text-white/80">
                      Visitor analytics, blocking system, CSV export, and role control.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={fetchAllData} className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportCSV} variant="secondary" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Visitors</p>
                    <h2 className="text-3xl font-bold">{stats.totalVisitors}</h2>
                  </div>
                  <Users className="h-8 w-8" />
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Unique Visitors</p>
                    <h2 className="text-3xl font-bold">{stats.uniqueVisitors}</h2>
                  </div>
                  <UserCheck className="h-8 w-8" />
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Active Visits</p>
                    <h2 className="text-3xl font-bold">{stats.activeVisits}</h2>
                  </div>
                  <Clock3 className="h-8 w-8" />
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Completed Visits</p>
                    <h2 className="text-3xl font-bold">{stats.completedVisits}</h2>
                  </div>
                  <CheckCircle2 className="h-8 w-8" />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription className="text-white/70">
                  Filter by date, search, purpose, college, and visitor status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={dateMode === "today" ? "default" : "secondary"}
                    onClick={() => setDateMode("today")}
                    className="rounded-xl"
                  >
                    Today
                  </Button>
                  <Button
                    variant={dateMode === "week" ? "default" : "secondary"}
                    onClick={() => setDateMode("week")}
                    className="rounded-xl"
                  >
                    This Week
                  </Button>
                  <Button
                    variant={dateMode === "range" ? "default" : "secondary"}
                    onClick={() => setDateMode("range")}
                    className="rounded-xl"
                  >
                    Date Range
                  </Button>
                </div>

                {dateMode === "range" && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-white/80 mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white text-black"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/80 mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white text-black"
                      />
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Search name / ID / purpose / college"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white text-black"
                  />

                  <select
                    value={purposeFilter}
                    onChange={(e) => setPurposeFilter(e.target.value)}
                    className="h-10 rounded-md px-3 bg-white text-black"
                  >
                    <option value="">All Purposes</option>
                    {uniquePurposes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="h-10 rounded-md px-3 bg-white text-black"
                  >
                    <option value="">All Colleges</option>
                    {uniqueColleges.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-md px-3 bg-white text-black"
                  >
                    <option value="">All Status</option>
                    {uniqueStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
              <CardHeader>
                <CardTitle>Visitor Bar Graph</CardTitle>
                <CardDescription className="text-white/70">
                  Quick chart view of visitor count based on your current filters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="visitors" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Block Visitor
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Real blocking saved in database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Student / Employee No."
                    value={blockStudentNo}
                    onChange={(e) => setBlockStudentNo(e.target.value)}
                    className="bg-white text-black"
                  />
                  <Input
                    placeholder="Full name (optional)"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    className="bg-white text-black"
                  />
                  <Input
                    placeholder="Reason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="bg-white text-black"
                  />
                  <Button onClick={handleBlockVisitor} className="w-full rounded-xl">
                    <Ban className="h-4 w-4 mr-2" />
                    Block Visitor
                  </Button>

                  <div className="pt-4 space-y-2 max-h-[280px] overflow-auto">
                    {blockedVisitors.length === 0 ? (
                      <p className="text-white/70 text-sm">No blocked visitors yet.</p>
                    ) : (
                      blockedVisitors.map((visitor) => (
                        <div
                          key={visitor.id}
                          className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold">{visitor.full_name || "Unknown Visitor"}</p>
                            <p className="text-sm text-white/80">{visitor.student_no}</p>
                            <p className="text-xs text-white/60">{visitor.reason || "No reason"}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUnblockVisitor(visitor.student_no)}
                          >
                            Unblock
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Role Switching
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Change a user to admin or user using their auth user ID.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="User ID (UUID from auth.users)"
                    value={roleUserId}
                    onChange={(e) => setRoleUserId(e.target.value)}
                    className="bg-white text-black"
                  />

                  <select
                    value={roleValue}
                    onChange={(e) => setRoleValue(e.target.value as "admin" | "user")}
                    className="h-10 rounded-md px-3 bg-white text-black w-full"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>

                  <Button onClick={handleRoleAssign} className="w-full rounded-xl">
                    Save Role
                  </Button>

                  <div className="pt-4 space-y-2 max-h-[280px] overflow-auto">
                    {userRoles.length === 0 ? (
                      <p className="text-white/70 text-sm">No roles found.</p>
                    ) : (
                      userRoles.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.user_id}</p>
                          </div>
                          <Badge variant={item.role === "admin" ? "default" : "secondary"}>
                            {item.role}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 border-white/15 text-white backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Visitor Logs
                </CardTitle>
                <CardDescription className="text-white/70">
                  Full visitor records based on selected filters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-10 text-white/70">
                    No visitor records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="py-3 pr-3">ID No.</th>
                          <th className="py-3 pr-3">Name</th>
                          <th className="py-3 pr-3">College</th>
                          <th className="py-3 pr-3">Purpose</th>
                          <th className="py-3 pr-3">Status</th>
                          <th className="py-3 pr-3">Time In</th>
                          <th className="py-3 pr-3">Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="border-b border-white/5">
                            <td className="py-3 pr-3">{log.student_no}</td>
                            <td className="py-3 pr-3">{log.full_name}</td>
                            <td className="py-3 pr-3">{log.college || "-"}</td>
                            <td className="py-3 pr-3">{log.purpose || "-"}</td>
                            <td className="py-3 pr-3">{log.status || "-"}</td>
                            <td className="py-3 pr-3">
                              {log.time_in ? format(new Date(log.time_in), "PPP p") : "-"}
                            </td>
                            <td className="py-3 pr-3">
                              {log.time_out ? format(new Date(log.time_out), "PPP p") : "Active"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
