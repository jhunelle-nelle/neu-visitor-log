import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import libraryBg from "@/assets/library-bg.jpg";

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <p>Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      {/* 🔥 BACKGROUND */}
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px) brightness(0.3)",
          }}
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-black/30 z-0" />

        {/* CONTENT */}
        <div className="relative z-10 container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user.email}
          </h1>

          <p className="text-gray-300 mb-8">
            University Library Lab — Admin Panel
          </p>

          {/* 🔥 CARDS */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { title: "Total Visits", value: "5" },
              { title: "Currently Active", value: "2" },
              { title: "Unique Visitors", value: "4" },
              { title: "Avg Duration", value: "0 min" },
            ].map((item, i) => (
              <div
                key={i}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg hover:scale-105 transition duration-300"
              >
                <h2 className="text-white text-sm">{item.title}</h2>
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* 🔥 FILTER SECTION */}
          <div className="mt-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Filters</h2>

            <div className="grid md:grid-cols-4 gap-4">
              <input
                placeholder="Search..."
                className="p-2 rounded bg-white/20 text-white placeholder-gray-300"
              />
              <select className="p-2 rounded bg-white/20 text-white">
                <option>Today</option>
              </select>
              <select className="p-2 rounded bg-white/20 text-white">
                <option>All Colleges</option>
              </select>
              <select className="p-2 rounded bg-white/20 text-white">
                <option>All</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
