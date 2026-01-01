import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import RegisterPatient from "./pages/reception/RegisterPatient";
import QueueManagement from "./pages/reception/QueueManagement";
import EyeMeasurementPage from "./pages/eye-measurement/EyeMeasurementPage";
import DoctorPage from "./pages/doctor/DoctorPage";
import PatientHistoryPage from "./pages/patient-history/PatientHistoryPage";
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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Reception Routes */}
            <Route path="/reception" element={
              <ProtectedRoute allowedRoles={['reception', 'admin']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reception/register" element={
              <ProtectedRoute allowedRoles={['reception', 'admin']}>
                <RegisterPatient />
              </ProtectedRoute>
            } />
            <Route path="/reception/queue" element={
              <ProtectedRoute allowedRoles={['reception', 'admin']}>
                <QueueManagement />
              </ProtectedRoute>
            } />
            
            {/* Eye Measurement Routes */}
            <Route path="/eye-measurement" element={
              <ProtectedRoute allowedRoles={['eye_measurement', 'admin']}>
                <EyeMeasurementPage />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorPage />
              </ProtectedRoute>
            } />
            <Route path="/patient-history" element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <PatientHistoryPage />
              </ProtectedRoute>
            } />
            
            {/* Pharmacy Routes */}
            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                <PharmacyPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/medicines" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MedicineManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
