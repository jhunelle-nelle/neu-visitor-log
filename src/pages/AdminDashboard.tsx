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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Download,
  Trash2,
  Calendar,
  TrendingUp,
  Clock,
  Filter,
  BookOpen,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type VisitorLog = Tables<"visitor_logs">;

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<"today" | "week" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_logs")
      .select("*")
      .order("clock_in", { ascending: false });
    if (!error && data) setLogs(data);
    setLoading(false);
  };

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

      return true;
    });
  }, [logs, dateRange, customStart, customEnd, purposeFilter, collegeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const activeNow = filteredLogs.filter((l) => !l.clock_out).length;
    const uniqueVisitors = new Set(filteredLogs.map((l) => l.id_number)).size;
    const avgDuration = filteredLogs
      .filter((l) => l.clock_out)
      .reduce((sum, l) => {
        const diff = new Date(l.clock_out!).getTime() - new Date(l.clock_in).getTime();
        return sum + diff;
      }, 0);
    const avgMins = filteredLogs.filter((l) => l.clock_out).length > 0
      ? Math.round(avgDuration / filteredLogs.filter((l) => l.clock_out).length / 60000)
      : 0;
    return { total, activeNow, uniqueVisitors, avgMins };
  }, [filteredLogs]);

  const uniquePurposes = useMemo(() => [...new Set(logs.map((l) => l.purpose))], [logs]);
  const uniqueColleges = useMemo(() => [...new Set(logs.map((l) => l.college))], [logs]);

  const exportCSV = () => {
    const headers = ["Name", "ID Number", "College", "Purpose", "Status", "Clock In", "Clock Out"];
    const rows = filteredLogs.map((l) => [
      l.visitor_name,
      l.id_number,
      l.college,
      l.purpose,
      l.employee_status,
      format(parseISO(l.clock_in), "yyyy-MM-dd HH:mm"),
      l.clock_out ? format(parseISO(l.clock_out), "yyyy-MM-dd HH:mm") : "Active",
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
    if (!isAdmin) {
      toast.error("Only admins can clear logs");
      return;
    }
    const { error } = await supabase.from("visitor_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Failed to clear logs. Make sure you have admin privileges.");
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

  const welcomeMessage = user?.user_metadata?.full_name
    ? `Welcome, ${user.user_metadata.full_name}!`
    : "Welcome to NEU Library!";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {welcomeMessage}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? "Admin Dashboard — Manage visitor logs" : "Welcome to NEU Library!"}
            </p>
            {isAdmin && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                Admin
              </span>
            )}
          </div>
          {isAdmin && (
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
                    <AlertDialogAction onClick={clearAllLogs}>
                      Yes, clear all logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-3xl font-bold text-success">{stats.activeNow}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
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
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent-foreground" />
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
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {isAdmin && (
          <Card className="shadow-card mb-6">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Purposes</SelectItem>
                      {uniquePurposes.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>College</Label>
                  <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colleges</SelectItem>
                      {uniqueColleges.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employee Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
        )}

        {/* Logs Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Visitor Logs ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No visitor logs found for the selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="animate-fade-in">
                        <TableCell className="font-medium">{log.visitor_name}</TableCell>
                        <TableCell>{log.id_number}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{log.college}</TableCell>
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
                          {format(parseISO(log.clock_in), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {log.clock_out ? (
                            format(parseISO(log.clock_out), "MMM d, h:mm a")
                          ) : (
                            <span className="text-success font-medium">Active</span>
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
      </div>
    </Layout>
  );
};

export default AdminDashboard;
