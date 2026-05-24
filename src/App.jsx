import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Public pages
import LandingPage             from './pages/LandingPage';
import LoginPage               from './pages/LoginPage';
import RegisterPage            from './pages/RegisterPage';
import SetupAccountPage        from './pages/SetupAccountPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import ResetPasswordPage       from './pages/ResetPasswordPage';
import AnalyticsPage           from './pages/AnalyticsPage';
import GoogleAuthSuccess       from './pages/GoogleAuthSuccess';

// App pages
import ChangePasswordPage      from './pages/ChangePasswordPage';
import Dashboard               from './pages/Dashboard';
import TasksPage               from './pages/TasksPage';
import CreateTaskPage          from './pages/CreateTaskPage';
import EditTaskPage            from './pages/EditTaskPage';
import TaskDetailPage          from './pages/TaskDetailPage';
import AccountManagement       from './pages/AccountManagement';
import NotificationsPage       from './pages/NotificationsPage';
import AuditLogsPage           from './pages/AuditLogsPage';
import FeedbackPage            from './pages/FeedbackPage';
import WorkloadPage            from './pages/WorkloadPage';
import SubscriptionPage        from './pages/SubscriptionPage';

// Super Admin pages
import AdminManagersPage        from './pages/AdminManagersPage';
import AdminManagerProfilePage  from './pages/AdminManagerProfilePage';
import AdminEmployeesPage       from './pages/AdminEmployeesPage';
import AdminEmployeeProfilePage from './pages/AdminEmployeeProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />

        <Routes>
          {/* ── Public marketing ── */}
          <Route path="/"           element={<LandingPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/setup-account" element={<SetupAccountPage />} />
          <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token"   element={<ResetPasswordPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* ── Force password change ── */}
          <Route path="/change-password" element={
            <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
          } />

          {/* ── Protected app ── */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/tasks"           element={<TasksPage />} />
            <Route path="/tasks/create"    element={<ProtectedRoute allowedRoles={['manager','super_admin']}><CreateTaskPage /></ProtectedRoute>} />
            <Route path="/tasks/:id/edit"  element={<ProtectedRoute allowedRoles={['manager','super_admin']}><EditTaskPage /></ProtectedRoute>} />
            <Route path="/tasks/:id"       element={<TaskDetailPage />} />

            <Route path="/accounts"        element={<ProtectedRoute allowedRoles={['super_admin','manager']}><AccountManagement /></ProtectedRoute>} />
            <Route path="/notifications"   element={<NotificationsPage />} />
            <Route path="/audit-logs"      element={<ProtectedRoute allowedRoles={['super_admin']}><AuditLogsPage /></ProtectedRoute>} />
            <Route path="/feedback"        element={<ProtectedRoute allowedRoles={['manager','employee']}><FeedbackPage /></ProtectedRoute>} />
            <Route path="/workload"        element={<ProtectedRoute allowedRoles={['manager']}><WorkloadPage /></ProtectedRoute>} />
            <Route path="/analytics"        element={<ProtectedRoute allowedRoles={['super_admin','manager']}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/subscription"    element={<ProtectedRoute allowedRoles={['super_admin']}><SubscriptionPage /></ProtectedRoute>} />

            <Route path="/admin/managers"       element={<ProtectedRoute allowedRoles={['super_admin']}><AdminManagersPage /></ProtectedRoute>} />
            <Route path="/admin/managers/:id"   element={<ProtectedRoute allowedRoles={['super_admin']}><AdminManagerProfilePage /></ProtectedRoute>} />
            <Route path="/admin/employees"      element={<ProtectedRoute allowedRoles={['super_admin']}><AdminEmployeesPage /></ProtectedRoute>} />
            <Route path="/admin/employees/:id"  element={<ProtectedRoute allowedRoles={['super_admin']}><AdminEmployeeProfilePage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
