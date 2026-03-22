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

  const [admins, setAdmins] = useState<ManagedEmail[]>([]);
  const [staffFaculty, setStaffFaculty] = useState<ManagedEmail[]>([]);

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
      toast.error("Failed to load visitor logs");
    } else {
      setLogs((data as LogRow[]) ?? []);
    }

    setLoadingLogs(false);
  };

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admin_emails")
      .select("id, email, added_by, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load admins");
      return;
    }

    const formatted =
      data?.map((item) => ({
        id: item.id,
        email: item.email,
        addedBy: item.added_by || "system",
        dateAdded: new Date(item.created_at).toLocaleDateString(),
      })) || [];

    setAdmins(formatted);
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchLogs();
      fetchAdmins();
    }
  }, [user, isAdmin]);

  const handleAddAdmin = async () => {
    const email = adminEmail.trim().toLowerCase();

    if (!email || !email.endsWith("@neu.edu.ph")) {
      toast.error("Use valid NEU email");
      return;
    }

    const { error } = await supabase.from("admin_emails").insert({
      email,
      added_by: user?.email || "system",
    });

    if (error) {
      toast.error("Admin exists or error");
      return;
    }

    toast.success("Admin added");
    setAdminEmail("");
    fetchAdmins();
  };

  const handleRemoveAdmin = async (id: string) => {
    await supabase.from("admin_emails").delete().eq("id", id);
    toast.success("Admin removed");
    fetchAdmins();
  };

  const handleToggleBlock = (rowId: string) => {
    setBlockedIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  const filteredLogs = useMemo(() => {
    return logs;
  }, [logs]);

  if (loading) return null;
  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-white">

        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* ADMIN */}
        <div className="mb-6">
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="Enter email"
            className="p-2 text-black"
          />
          <button onClick={handleAddAdmin}>Add</button>

          {admins.map((a) => (
            <div key={a.id}>
              {a.email}
              <button onClick={() => handleRemoveAdmin(a.id)}>Remove</button>
            </div>
          ))}
        </div>

        {/* VISITOR TABLE */}
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((row) => (
              <tr key={row.id}>
                <td>{row.gmail}</td>
                <td>{row.visitor_name}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </Layout>
  );
};

export default AdminDashboard;
