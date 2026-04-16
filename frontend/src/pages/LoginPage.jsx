import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shirt, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-grid px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Card */}
        <div className="card p-8" style={{ background: 'var(--bg-card)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--accent)', boxShadow: '0 0 32px rgba(59,130,246,0.4)' }}
            >
              <Shirt size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              LaundryPro
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div
            className="mt-6 p-3 rounded-lg text-xs space-y-1"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
          >
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Default credentials</p>
            <p>Username: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>admin</span></p>
            <p>Password: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
