import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Reception Routes */}
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/reception/register" element={<RegisterPatient />} />
            <Route path="/reception/queue" element={<QueueManagement />} />
            
            {/* Eye Measurement Routes */}
            <Route path="/eye-measurement" element={<EyeMeasurementPage />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={<DoctorPage />} />
            
            {/* Pharmacy Routes */}
            <Route path="/pharmacy" element={<PharmacyPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/medicines" element={<MedicineManagement />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
