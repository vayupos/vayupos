import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { superAdminLogin } from '../api/superAdminApi';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await superAdminLogin(identifier.trim().toLowerCase(), password);
      if (!res.data.is_superadmin) {
        setError('This account does not have superadmin access.');
        return;
      }
      localStorage.setItem('superAdminToken',          res.data.access_token);
      localStorage.setItem('isSuperAdminAuthenticated', 'true');
      navigate('/superadmin/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2563eb] mb-4">
            <span className="text-white font-black text-xl">V</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">VayuPOS</h1>
          <p className="text-[#64748b] text-sm mt-1">Superadmin Portal</p>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="sa_identifier" className="block text-sm font-medium text-[#94a3b8] mb-1.5">Email</label>
              <input
                id="sa_identifier"
                type="text"
                name="identifier"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin@yourdomain.com"
                autoComplete="username"
                className="w-full px-4 py-3 bg-[#0a0f1a] border border-[#1e293b] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-[#2563eb] text-sm transition-colors"
              />
            </div>

            <div>
              <label htmlFor="sa_password" className="block text-sm font-medium text-[#94a3b8] mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="sa_password"
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-[#0a0f1a] border border-[#1e293b] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-[#2563eb] text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
