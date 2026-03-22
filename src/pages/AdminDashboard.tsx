// PASTE MO BUO — REPLACE MO LUMA MONG FILE

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
        ];

        return values.some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs, search]);

  const handleToggleBlock = (rowId: string) => {
    setBlockedIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  if (loading) {
    return <Layout>Loading...</Layout>;
  }

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="relative min-h-screen">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            filter: "blur(10px) brightness(0.2)",
          }}
        />

        <div className="relative z-10 p-6 text-white">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search visitors..."
            className="mb-4 p-2 rounded bg-black/30 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* TABLE */}
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
                const isBlocked = blockedIds.includes(row.id);

                return (
                  <tr key={row.id}>
                    <td>{row.gmail}</td>
                    <td>{row.id_number}</td>
                    <td>{row.visitor_name}</td>
                    <td>{row.college}</td>
                    <td>
                      <button onClick={() => handleToggleBlock(row.id)}>
                        {isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ADMIN LIST */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">Admin Accounts</h2>
            {admins.map((a) => (
              <div key={a.id}>{a.email}</div>
            ))}
          </div>

          {/* STAFF LIST ONLY (NO ADD BUTTON) */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">
              Staff / Faculty Accounts
            </h2>

            {staffFaculty.map((s) => (
              <div key={s.id} className="flex justify-between">
                <span>{s.email}</span>
                <button
                  onClick={() =>
                    setStaffFaculty((prev) =>
                      prev.filter((x) => x.id !== s.id)
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => fetchLogs()}
            className="mt-6 bg-white/20 px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
