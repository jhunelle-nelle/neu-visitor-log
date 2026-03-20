import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users, Download, Trash2, TrendingUp, Clock, Filter, Search, LayoutDashboard, ClipboardList, UserRound, Shield,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { formatLocalDateTime } from "@/lib/time";
import type { Tables as DBTables } from "@/integrations/supabase/types";

type VisitorLog = DBTables<"visitor_logs">;

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState<"today" | "week" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin) {
        toast.error("You do not have admin access.");
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchLogs();
  }, [user, isAdmin]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_logs")
      .select("*")
      .order("clock_in", { ascending: false });
    if (!error && data) setLogs(data);
    setLoading(false);
  };

  // Search + filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const clockIn = parseISO(log.clock_in);
      const now = new Date();

      // Date filter
      if (dateRange === "today") {
        if (!isWithinInterval(clockIn, { start: startOfDay(now), end: endOfDay(now) })) return false;
      } else if (dateRange === "week") {
        if (!isWithinInterval(clockIn, { start: startOfWeek(now), end: endOfWeek(now) })) return false;
      } else if (dateRange === "custom" && customStart && customEnd) {
        const s = startOfDay(parseISO(customStart));
        const e = endOfDay(parseISO(customEnd));
        if (!isWithinInterval(clockIn, { start: s, end: e })) return false;
      }

      if (purposeFilter !== "all" && log.purpose !== purposeFilter) return false;
      if (collegeFilter !== "all" && log.college !== collegeFilter) return false;
      if (statusFilter !== "all" && log.employee_status !== statusFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          log.visitor_name.toLowerCase().includes(q) ||
          log.id_number.toLowerCase().includes(q) ||
          log.purpose.toLowerCase().includes(q) ||
          log.college.toLowerCase().includes(q) ||
          log.employee_status.toLowerCase().includes(q) ||
          formatLocalDateTime(log.clock_in).toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [logs, dateRange, customStart, customEnd, purposeFilter, collegeFilter, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const activeNow = filteredLogs.filter((l) => !l.clock_out).length;
    const uniqueVisitors = new Set(filteredLogs.map((l) => l.id_number)).size;
    const withDuration = filteredLogs.filter((l) => l.clock_out);
    const totalMs = withDuration.reduce((sum, l) => {
      return sum + (new Date(l.clock_out!).getTime() - new Date(l.clock_in).getTime());
    }, 0);
    const avgMins = withDuration.length > 0 ? Math.round(totalMs / withDuration.length / 60000) : 0;
    return { total, activeNow, uniqueVisitors, avgMins };
  }, [filteredLogs]);

  // Unique visitors list
  const uniqueVisitorsList = useMemo(() => {
    const map = new Map<string, { name: string; idNumber: string; college: string; status: string; visitCount: number; lastVisit: string }>();
    logs.forEach((log) => {
      const existing = map.get(log.id_number);
      if (!existing) {
        map.set(log.id_number, {
          name: log.visitor_name,
          idNumber: log.id_number,
          college: log.college,
          status: log.employee_status,
          visitCount: 1,
          lastVisit: log.clock_in,
        });
      } else {
        existing.visitCount++;
        if (log.clock_in > existing.lastVisit) {
          existing.lastVisit = log.clock_in;
          existing.name = log.visitor_name;
          existing.college = log.college;
          existing.status = log.employee_status;
        }
      }
    });

    let visitors = Array.from(map.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      visitors = visitors.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.idNumber.toLowerCase().includes(q) ||
        v.college.toLowerCase().includes(q)
      );
    }
    return visitors.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [logs, searchQuery]);

  const uniquePurposes = useMemo(() => [...new Set(logs.map((l) => l.purpose))], [logs]);
  const uniqueColleges = useMemo(() => [...new Set(logs.map((l) => l.college))], [logs]);

  const exportCSV = () => {
    const headers = ["Name", "Student/Employee No.", "College", "Purpose", "Status", "Clock In", "Clock Out"];
    const rows = filteredLogs.map((l) => [
      l.visitor_name,
      l.id_number,
      l.college,
      l.purpose,
      l.employee_status,
      formatLocalDateTime(l.clock_in),
      l.clock_out ? formatLocalDateTime(l.clock_out) : "Active",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const clearAllLogs = async () => {
    const { error } = await supabase.from("visitor_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Failed to clear logs.");
    } else {
      setLogs([]);
      toast.success("All logs cleared");
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) return null;

  const welcomeName = user?.user_metadata?.full_name || user?.email || "Admin";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              Welcome, {welcomeName}!
            </h2>
            <p className="text-muted-foreground mt-1">NEU Library — Admin Panel</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
              Admin
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all visitor logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All visitor log data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllLogs}>Yes, clear all logs</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, student no., purpose, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Visit Logs</span>
            </TabsTrigger>
            <TabsTrigger value="visitors" className="gap-1.5">
              <UserRound className="w-4 h-4" />
              <span className="hidden sm:inline">Visitors</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-1.5">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Visits</p>
                      <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Currently Active</p>
                      <p className="text-3xl font-bold text-primary">{stats.activeNow}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Visitors</p>
                      <p className="text-3xl font-bold text-foreground">{stats.uniqueVisitors}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <UserRound className="w-6 h-6 text-secondary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Duration</p>
                      <p className="text-3xl font-bold text-foreground">{stats.avgMins}<span className="text-sm text-muted-foreground ml-1">min</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={dateRange} onValueChange={(v) => setDateRange(v as "today" | "week" | "custom")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {dateRange === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Purposes</SelectItem>
                        {uniquePurposes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>College</Label>
                    <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colleges</SelectItem>
                        {uniqueColleges.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit Logs Tab */}
          <TabsContent value="logs">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Visit Logs ({filteredLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>St. No.</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time In</TableHead>
                        <TableHead>Time Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No visitor logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.visitor_name}</TableCell>
                            <TableCell>{log.id_number}</TableCell>
                            <TableCell className="max-w-[140px] truncate">{log.college}</TableCell>
                            <TableCell>{log.purpose}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.employee_status === "student" ? "bg-primary/10 text-primary" :
                                log.employee_status === "teacher" ? "bg-accent/30 text-accent-foreground" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {log.employee_status}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(parseISO(log.clock_in), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(parseISO(log.clock_in), "h:mm a")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {log.clock_out ? (
                                format(parseISO(log.clock_out), "h:mm a")
                              ) : (
                                <span className="text-primary font-medium">Active</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visitors Tab */}
          <TabsContent value="visitors">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="w-5 h-5" />
                  Registered Visitors ({uniqueVisitorsList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>St. No.</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Visits</TableHead>
                        <TableHead>Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueVisitorsList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No visitors found
                          </TableCell>
                        </TableRow>
                      ) : (
                        uniqueVisitorsList.map((v) => (
                          <TableRow key={v.idNumber}>
                            <TableCell className="font-medium">{v.name}</TableCell>
                            <TableCell>{v.idNumber}</TableCell>
                            <TableCell className="max-w-[140px] truncate">{v.college}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                v.status === "student" ? "bg-primary/10 text-primary" :
                                v.status === "teacher" ? "bg-accent/30 text-accent-foreground" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {v.status}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">{v.visitCount}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatLocalDateTime(v.lastVisit)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
            <div className="grid gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Logged in as</p>
                      <p className="font-medium text-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{welcomeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                        Admin
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="font-medium text-foreground">{logs.length} logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={exportCSV} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export All Logs as CSV
                  </Button>
                  <Button variant="outline" onClick={fetchLogs} className="gap-2">
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
