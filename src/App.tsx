import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import VisitorForm from "@/pages/VisitorForm";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-center" />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/visitor" element={<VisitorForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
