import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import HomeRedirect from "./pages/HomeRedirect";
import NoAccessPage from "./pages/NoAccessPage";
import { RequireRole } from "@/components/auth/RequireRole";

import LoginPage from "./pages/LoginPage";
import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import RegisterPatient from "./pages/reception/RegisterPatient";
import QueueManagement from "./pages/reception/QueueManagement";
import EyeMeasurementPage from "./pages/eye-measurement/EyeMeasurementPage";
import DoctorPage from "./pages/doctor/DoctorPage";
import PharmacyPage from "./pages/pharmacy/PharmacyPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import MedicineManagement from "./pages/admin/MedicineManagement";
import ReportsPage from "./pages/admin/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/no-access" element={<NoAccessPage />} />

            {/* Reception Routes */}
            <Route
              path="/reception"
              element={
                <RequireRole allowed={["reception"]}>
                  <ReceptionDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/reception/register"
              element={
                <RequireRole allowed={["reception"]}>
                  <RegisterPatient />
                </RequireRole>
              }
            />
            <Route
              path="/reception/queue"
              element={
                <RequireRole allowed={["reception"]}>
                  <QueueManagement />
                </RequireRole>
              }
            />

            {/* Eye Measurement Routes */}
            <Route
              path="/eye-measurement"
              element={
                <RequireRole allowed={["eye_measurement"]}>
                  <EyeMeasurementPage />
                </RequireRole>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor"
              element={
                <RequireRole allowed={["doctor"]}>
                  <DoctorPage />
                </RequireRole>
              }
            />

            {/* Pharmacy Routes */}
            <Route
              path="/pharmacy"
              element={
                <RequireRole allowed={["pharmacy"]}>
                  <PharmacyPage />
                </RequireRole>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RequireRole allowed={["admin"]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <RequireRole allowed={["admin"]}>
                  <StaffManagement />
                </RequireRole>
              }
            />
            <Route
              path="/admin/medicines"
              element={
                <RequireRole allowed={["admin"]}>
                  <MedicineManagement />
                </RequireRole>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequireRole allowed={["admin"]}>
                  <ReportsPage />
                </RequireRole>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
