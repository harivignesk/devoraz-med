import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Hospitals } from './pages/Hospitals';
import { Doctors } from './pages/Doctors';
import { Nurses } from './pages/Nurses';
import { Patients } from './pages/Patients';
import { ICU_OR } from './pages/ICU_OR';
import { Equipment } from './pages/Equipment';
import { Ambulances } from './pages/Ambulances';
import { EmergencyCommand } from './pages/EmergencyCommand';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes (wrapped by DashboardLayout which handles redirect if unauthenticated) */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/command" replace />} />
              <Route path="command" element={<EmergencyCommand />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="hospitals" element={<Hospitals />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="nurses" element={<Nurses />} />
              <Route path="patients" element={<Patients />} />
              <Route path="icu-or" element={<ICU_OR />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="ambulances" element={<Ambulances />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/command" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
