import React from 'react';
import { useAuth } from '../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'super_admin') return <SuperAdminDashboard />;
  if (user?.role === 'manager')    return <ManagerDashboard />;
  return <EmployeeDashboard />;
};

export default Dashboard;
