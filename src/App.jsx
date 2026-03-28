import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { seedDemoData } from "@/lib/store";
import Dashboard from "./pages/Dashboard";
import MasterSetup from "./pages/MasterSetup";
import SeatMatrix from "./pages/SeatMatrix";
import QuotaConfig from "./pages/QuotaConfig";
import Applicants from "./pages/Applicants";
import Admissions from "./pages/Admissions";
import InstitutionCaps from "./pages/InstitutionCaps";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
function AppRoutes() {
    const { isLoggedIn, loading } = useAuth();
    useEffect(() => {
        seedDemoData().catch((error) => {
            console.error("Seed data failed:", error);
        });
    }, []);
    if (loading) {
        return null;
    }
    if (!isLoggedIn) {
        return <LoginPage />;
    }
    return (<AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />}/>
        <Route path="/master-setup" element={<MasterSetup />}/>
        <Route path="/seat-matrix" element={<SeatMatrix />}/>
        <Route path="/quota-config" element={<QuotaConfig />}/>
        <Route path="/applicants" element={<Applicants />}/>
        <Route path="/admissions" element={<Admissions />}/>
        <Route path="/institution-caps" element={<InstitutionCaps />}/>
        <Route path="*" element={<NotFound />}/>
      </Routes>
    </AppLayout>);
}
const App = () => (<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
        }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>);
export default App;
