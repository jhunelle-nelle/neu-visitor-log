import Layout from "@/components/Layout";
import libraryBg from "@/assets/library-bg.jpg";

const Index = () => {
  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-8rem)]">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${libraryBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px) brightness(0.35)",
          }}
        />

        <div className="absolute inset-0 z-0 bg-background/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-yellow-400">NEU Library</span>
          </h1>

          <p className="text-lg text-white/80 mb-6">
            Sign in below to log your visit
          </p>

          <div className="flex gap-4">
            <a
              href="/login"
              className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
            >
              Admin Login
            </a>

            <a
              href="/"
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
            >
              Visitor Log
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
