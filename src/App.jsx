import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import {
  canManageApplicants,
  canManageMasters,
  canViewOnly,
  seedDemoData,
} from "@/lib/store";
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

function GuardedRoute({ allow, children }) {
  return allow ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isLoggedIn, loading, session } = useAuth();
  const role = session?.role || "Management";

  useEffect(() => {
    seedDemoData().catch((error) => {
      if (error?.message?.startsWith("Request timeout")) {
        console.warn("Seed data skipped: backend not reachable yet");
        return;
      }

      console.error("Seed data failed:", error);
    });
  }, []);

  if (loading) {
    return <LoginPage />;
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/master-setup"
          element={
            <GuardedRoute allow={canManageMasters(role)}>
              <MasterSetup />
            </GuardedRoute>
          }
        />
        <Route
          path="/seat-matrix"
          element={
            <GuardedRoute allow={!canViewOnly(role)}>
              <SeatMatrix />
            </GuardedRoute>
          }
        />
        <Route
          path="/quota-config"
          element={
            <GuardedRoute allow={canManageMasters(role)}>
              <QuotaConfig />
            </GuardedRoute>
          }
        />
        <Route
          path="/applicants"
          element={
            <GuardedRoute allow={canManageApplicants(role)}>
              <Applicants />
            </GuardedRoute>
          }
        />
        <Route
          path="/admissions"
          element={
            <GuardedRoute allow={canManageApplicants(role)}>
              <Admissions />
            </GuardedRoute>
          }
        />
        <Route
          path="/institution-caps"
          element={
            <GuardedRoute allow={canManageMasters(role)}>
              <InstitutionCaps />
            </GuardedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
