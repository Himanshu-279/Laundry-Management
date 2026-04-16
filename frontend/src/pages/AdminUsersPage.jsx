import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff'
  });

  // Check if admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-semibold">❌ Access Denied</h2>
        <p className="text-red-700">Only admins can manage users</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', formData);
      
      if (response.success) {
        setSuccess(`✅ User "${formData.username}" created successfully!`);
        setFormData({ username: '', password: '', role: 'staff' });
        
        // Refresh users list
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">👥 User Management</h1>
      </div>

      {/* Add User Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">➕ Add New User</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 text-green-300 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. john_staff"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="e.g. secure@123"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-300 mb-2">📝 Info</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• <strong>Admin</strong> - Can manage users and all orders</li>
          <li>• <strong>Staff</strong> - Can handle orders but cannot add users</li>
          <li>• Share the username and password with the new user to login</li>
        </ul>
      </div>
    </div>
  );
}
