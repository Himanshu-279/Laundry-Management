/**
 * User Management Page (Admin Only)
 * 
 * Provides admin interface to:
 * - Create new users with username, password, and role (admin/staff)
 * - View all users with their roles and creation dates
 * - Delete users (with confirmation dialog)
 * - See system statistics (total users, admin count, staff count)
 * 
 * Layout: Two columns
 * - Left: Add new user form
 * - Right: Scrollable list of all users with delete buttons
 * - Top: System stats (3 stat cards)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function UserManagement() {
  const { user } = useAuth();
  
  // Form state: Add new user
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  
  // UI state: Status messages and loading
  const [message, setMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Data state: Users list and statistics
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, admins: 0, staff: 0 });

  // ============ ACCESS CONTROL ============
  // Only allow admin users
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '32px', color: 'var(--text-primary)' }}>
        <p>❌ Access Denied - Admin Only</p>
      </div>
    );
  }

  // ============ LIFECYCLE ============
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // ============ FETCH USERS ============
  /**
   * Load users from backend
   * Fetches all users and calculates statistics
   */
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/auth/users');
      const { users, stats } = response.data.data;
      setUsers(users || []);
      setStats(stats || { total: 0, admins: 0, staff: 0 });
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ============ DELETE USER ============
  /**
   * Delete a user after confirmation
   * Soft deletes user (marks as inactive)
   * Auto-refreshes user list
   */
  const handleDelete = async (userId, username) => {
    // Confirmation dialog before deletion
    if (!window.confirm(`Delete user "${username}"?`)) return;
    
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      if (response.data.success) {
        setMessage(`✅ User "${username}" deleted!`);
        setTimeout(() => setMessage(''), 3000);
        loadUsers(); // Refresh users list
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error deleting user';
      setMessage(`❌ ${errMsg}`);
    }
  };

  // ============ CREATE USER ============
  /**
   * Create a new user
   * Validates inputs, sends to backend, resets form on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/register', {
        username,
        password,
        role
      });

      if (response.data.success) {
        setMessage(`✅ User "${username}" created!`);
        setUsername('');
        setPassword('');
        setRole('staff');
        setTimeout(() => setMessage(''), 3000);
        loadUsers(); // Reload users list
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error';
      setMessage(`❌ ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* HEADER */}
      <h1 style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        👥 User Management
      </h1>

      {/* STATS CARDS - System Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total Users
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
            {stats.admins}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Admin Users
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats.staff}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Staff Users
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT - Form and Users List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN - Add New User Form */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            ➕ Add New User
          </h2>

          {message && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              color: message.includes('✅') ? '#86efac' : '#fca5a5',
              borderRadius: '4px',
              fontSize: '13px',
              border: '1px solid ' + (message.includes('✅') ? 'rgba(34,197,94,0.5)' : 'rgba(220,38,38,0.5)')
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="john_staff"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="secure@123"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px',
                background: loading ? '#666' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px'
              }}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN - Users List Display */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            📋 All Users
          </h2>

          {loadingUsers ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No users found</div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {users.map((u) => (
                <div key={u._id} style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {u.username}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: u.role === 'admin' ? '#fca5a5' : '#93c5fd'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDelete(u._id, u.username)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
