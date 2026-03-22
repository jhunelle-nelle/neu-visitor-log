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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const adminEmail = (user?.email ?? "").toLowerCase();
  const hasAdminAccess = ALLOWED_ADMIN_EMAILS.includes(adminEmail);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState("");
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const [admins] = useState<ManagedEmail[]>([
    { id: "1", email: "jhunelle.remo@neu.edu.ph", addedBy: "system", dateAdded: new Date().toLocaleDateString() },
    { id: "2", email: "jcesperanza@neu.edu.ph", addedBy: "system", dateAdded: new Date().toLocaleDateString() },
    { id: "3", email: "joshuaandre.tindoy@neu.edu.ph", addedBy: "system", dateAdded: new Date().toLocaleDateString() },
  ]);

  const [staffFaculty] = useState<ManagedEmail[]>([
    { id: "1", email: "jcesperanza@neu.edu.ph", addedBy: "system", dateAdded: new Date().toLocaleDateString() },
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
    const { data } = await supabase
      .from("visitor_logs")
      .select("*")
      .order("clock_in", { ascending: false });

    setLogs((data as LogRow[]) ?? []);
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (user && hasAdminAccess) fetchLogs();
  }, [user]);

  const filteredLogs = useMemo(() => {
    return logs.filter((row) =>
      `${row.visitor_name} ${row.gmail} ${row.id_number}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [logs, search]);

  const handleToggleBlock = (id: string) => {
    setBlockedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading || !user || !hasAdminAccess) return null;

  return (
    <Layout>
      <div className="relative min-h-screen">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            filter: "blur(10px) brightness(0.18)",
          }}
        />

        <div className="relative z-10 p-6 text-white">
          <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>

          <input
            type="text"
            placeholder="Search..."
            className="w-full mb-6 p-3 rounded bg-black/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Email</th>
                <th>ID</th>
                <th>Name</th>
                <th>College</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((row) => {
                const blocked = blockedIds.includes(row.id);
                return (
                  <tr key={row.id}>
                    <td>{row.gmail}</td>
                    <td>{row.id_number}</td>
                    <td>{row.visitor_name}</td>
                    <td>{row.college}</td>
                    <td>
                      <button onClick={() => handleToggleBlock(row.id)}>
                        {blocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ADMINS */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">Admins</h2>
            {admins.map((a) => (
              <div key={a.id}>{a.email}</div>
            ))}
          </div>

          {/* STAFF */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">Staff</h2>
            {staffFaculty.map((s) => (
              <div key={s.id}>{s.email}</div>
            ))}
          </div>

          <button
            onClick={fetchLogs}
            className="mt-6 px-4 py-2 bg-white/20 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
