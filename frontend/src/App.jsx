import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UserManagement from './pages/UserManagement';

/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 * Shows loading spinner while auth state is being determined
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

/**
 * Public Route Component
 * Redirects authenticated users away from public pages (e.g., login)
 * Prevents users from accessing login page when already logged in
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

/**
 * Main Application Routes
 * 
 * Structure:
 * - /login: Public route (login page)
 * - /: Protected routes (main app)
 *   - / (index): Dashboard
 *   - /orders: All orders list
 *   - /orders/new: Create new order
 *   - /orders/:orderId: Order detail page
 *   - /users: User management (admin only)
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          
          {/* Protected Routes - All require authentication */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Dashboard - Order summary and stats */}
            <Route index element={<DashboardPage />} />
            
            {/* Orders Management */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<CreateOrderPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            
            {/* User Management - Admin only (enforced in component) */}
            <Route path="users" element={<UserManagement />} />
          </Route>
          
          {/* Catch-all: Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
