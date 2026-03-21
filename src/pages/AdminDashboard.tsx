import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Search, Download, Trash2, LayoutDashboard, ClipboardList, Users, Shield, TrendingUp, UserRound, Clock3, Filter } from "lucide-react";

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <p>Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Admin";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">
              Welcome, {displayName}!
            </h1>
            <p className="mt-2 text-muted-foreground">NEU Library — Admin Panel</p>
            <span className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              Admin
            </span>
          </div>

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600">
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border bg-card p-3 shadow-card">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, student no., purpose, date..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border bg-card p-2 shadow-card md:grid-cols-4">
          <button className="flex items-center justify-center gap-2 rounded-xl bg-background px-4 py-3 text-sm font-medium">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Visit Logs
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Visitors
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Admin
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="mt-2 text-4xl font-bold">0</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Active</p>
                <p className="mt-2 text-4xl font-bold">0</p>
              </div>
              <div className="rounded-2xl bg-yellow-50 p-3">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="mt-2 text-4xl font-bold">0</p>
              </div>
              <div className="rounded-2xl bg-yellow-50 p-3">
                <UserRound className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <div className="mt-2 flex items-end gap-1">
                  <p className="text-4xl font-bold">0</p>
                  <span className="pb-1 text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <Clock3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Filters</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Date Range</label>
              <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Purpose</label>
              <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none">
                <option>All Purposes</option>
                <option>Study</option>
                <option>Research</option>
                <option>Borrow Books</option>
                <option>Internet Use</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">College</label>
              <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none">
                <option>All Colleges</option>
                <option>CAS</option>
                <option>CBA</option>
                <option>CCJE</option>
                <option>COE</option>
                <option>CTHM</option>
                <option>Senior High School</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Employee Status</label>
              <select className="w-full rounded-xl border bg-background px-4 py-3 outline-none">
                <option>All</option>
                <option>Student</option>
                <option>Teacher</option>
                <option>Staff</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
