import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import BrowseUnits from './pages/BrowseUnits';
import Applications from './pages/Applications';
import MyLease from './pages/MyLease';
import Leases from './pages/Leases';
import RentHistory from './pages/RentHistory';
import RentDashboard from './pages/RentDashboard';
import MyMaintenance from './pages/MyMaintenance';
import MaintenanceBoard from './pages/MaintenanceBoard';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function Page({ element, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Page allowedRoles={['landlord', 'tenant']} element={<Dashboard />} />} />
          <Route path="/properties" element={<Page allowedRoles={['landlord']} element={<Properties />} />} />
          <Route path="/browse" element={<Page allowedRoles={['tenant']} element={<BrowseUnits />} />} />
          <Route path="/applications" element={<Page allowedRoles={['landlord']} element={<Applications />} />} />
          <Route path="/my-lease" element={<Page allowedRoles={['tenant']} element={<MyLease />} />} />
          <Route path="/leases" element={<Page allowedRoles={['landlord']} element={<Leases />} />} />
          <Route path="/rent-history" element={<Page allowedRoles={['tenant']} element={<RentHistory />} />} />
          <Route path="/rent-dashboard" element={<Page allowedRoles={['landlord']} element={<RentDashboard />} />} />
          <Route path="/my-maintenance" element={<Page allowedRoles={['tenant']} element={<MyMaintenance />} />} />
          <Route path="/maintenance-board" element={<Page allowedRoles={['landlord']} element={<MaintenanceBoard />} />} />
          <Route path="/properties/:propertyId/expenses" element={<Page allowedRoles={['landlord']} element={<Expenses />} />} />
          <Route path="/reports" element={<Page allowedRoles={['landlord']} element={<Reports />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
