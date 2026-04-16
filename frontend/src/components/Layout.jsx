import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, PlusCircle, LogOut, Shirt, ChevronRight, Users,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Build navigation menu dynamically based on user role
   * All users see: Dashboard, All Orders, New Order
   * Admin only: Manage Users
   */
  const getNavItems = () => {
    const items = [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/orders', icon: ShoppingBag, label: 'All Orders' },
      { to: '/orders/new', icon: PlusCircle, label: 'New Order' },
    ];
    
    // Conditionally add admin-only menu item
    if (user?.role === 'admin') {
      items.push({ to: '/users', icon: Users, label: 'Manage Users' });
    }
    
    return items;
  };

  return (
    <div className="flex min-h-screen bg-grid" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col shrink-0 border-r"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
            >
              <Shirt size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                LaundryPro
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Order Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {getNavItems().map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'text-white'
                  : 'hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 16px var(--accent-glow)' : 'none',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                {user?.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded transition-colors hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
