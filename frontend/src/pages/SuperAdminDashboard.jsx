import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Plus, Search, RefreshCw, Loader2, CheckCircle,
  XCircle, Building2, CalendarClock, Phone, MapPin, User,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  listRestaurants,
  createRestaurant,
  toggleRestaurantActive,
} from '../api/superAdminApi';

// ── Helpers ─────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const trialStatus = (expiresAt) => {
  if (!expiresAt) return { label: 'No expiry', color: 'text-slate-400' };
  const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: 'Expired',         color: 'text-red-400' };
  if (days <= 7) return { label: `${days}d left`,   color: 'text-amber-400' };
  return               { label: `${days}d left`,   color: 'text-emerald-400' };
};

// ── Create Restaurant Modal ──────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    restaurant_name: '', owner_name: '', phone: '', email: '',
    city: '', username: '', password: '', trial_days: 30,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.restaurant_name || !form.owner_name || !form.phone || !form.username || !form.password) {
      setError('Fill all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createRestaurant(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create restaurant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e293b]">
          <h2 className="text-lg font-semibold text-white">Add Restaurant</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Restaurant name *">
              <input value={form.restaurant_name} onChange={e => set('restaurant_name', e.target.value)} placeholder="Spice Garden" className={iCls} />
            </ModalField>
            <ModalField label="Owner name *">
              <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Rajesh Kumar" className={iCls} />
            </ModalField>
            <ModalField label="Phone *">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={iCls} />
            </ModalField>
            <ModalField label="City">
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Hyderabad" className={iCls} />
            </ModalField>
            <ModalField label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="owner@spicegarden.com" className={iCls} />
            </ModalField>
            <ModalField label="Trial days">
              <input type="number" min={1} max={365} value={form.trial_days} onChange={e => set('trial_days', parseInt(e.target.value) || 30)} className={iCls} />
            </ModalField>
          </div>

          <div className="border-t border-[#1e293b] pt-4">
            <p className="text-xs text-[#64748b] mb-3 font-medium uppercase tracking-wider">Login credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <ModalField label="Username *">
                <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="spicegarden" className={iCls} />
              </ModalField>
              <ModalField label="Password *">
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars" className={iCls} />
              </ModalField>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#1e293b] text-[#94a3b8] rounded-xl text-sm font-medium hover:bg-[#1e293b] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [toggling,    setToggling]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRestaurants();
      setRestaurants(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('isSuperAdminAuthenticated');
    navigate('/superadmin/login', { replace: true });
  };

  const handleToggle = async (clientId) => {
    setToggling(clientId);
    try {
      const res = await toggleRestaurantActive(clientId);
      setRestaurants(rs =>
        rs.map(r => r.client_id === clientId ? { ...r, is_active: res.data.is_active } : r)
      );
    } finally {
      setToggling(null);
    }
  };

  const filtered = restaurants.filter(r =>
    !search ||
    r.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.owner_name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.city        || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone       || '').includes(search)
  );

  // Stats
  const total   = restaurants.length;
  const active  = restaurants.filter(r => r.is_active).length;
  const expiring = restaurants.filter(r => {
    if (!r.trial_expires_at) return false;
    const days = Math.ceil((new Date(r.trial_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Top nav */}
      <nav className="border-b border-[#1e293b] bg-[#111827] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <div>
            <span className="font-semibold text-white">VayuPOS</span>
            <span className="ml-2 px-2 py-0.5 bg-[#2563eb]/20 text-[#60a5fa] rounded text-xs font-medium">Superadmin</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-xl text-sm transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page heading */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Restaurants</h1>
            <p className="text-[#64748b] text-sm mt-0.5">Manage all restaurants on the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 border border-[#1e293b] rounded-xl text-[#64748b] hover:text-white hover:bg-[#1e293b] transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              Add Restaurant
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total restaurants', value: total,    icon: Building2,   color: 'text-blue-400',   bg: 'bg-blue-500/10' },
            { label: 'Active',            value: active,   icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Trial expiring ≤7d', value: expiring, icon: CalendarClock, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 flex items-center gap-4">
              <div className={`${bg} p-3 rounded-xl`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-[#64748b] text-sm">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by restaurant name, owner, city or phone…"
            className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[#1e293b] rounded-xl text-white text-sm placeholder-[#475569] focus:outline-none focus:border-[#2563eb] transition-colors"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[#2563eb]" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Building2 size={40} className="mx-auto text-[#1e293b] mb-3" />
            <p className="text-[#475569]">
              {search ? 'No restaurants match your search.' : 'No restaurants yet. Add the first one!'}
            </p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e293b]">
                  {['Restaurant', 'Owner / Username', 'Contact', 'Trial', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filtered.map(r => {
                  const trial = trialStatus(r.trial_expires_at);
                  return (
                    <tr key={r.client_id} className="hover:bg-[#0a0f1a]/40 transition-colors">
                      {/* Restaurant */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#1e293b] flex items-center justify-center shrink-0">
                            <span className="text-[#60a5fa] font-bold text-sm">
                              {r.restaurant_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{r.restaurant_name}</p>
                            <p className="text-[#475569] text-xs flex items-center gap-1 mt-0.5">
                              <MapPin size={11} />
                              {r.city || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{r.owner_name || '—'}</p>
                        <p className="text-[#475569] text-xs flex items-center gap-1 mt-0.5">
                          <User size={11} />
                          @{r.username}
                        </p>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-[#94a3b8] text-sm flex items-center gap-1.5">
                          <Phone size={12} />
                          {r.phone || '—'}
                        </p>
                        {r.email && (
                          <p className="text-[#475569] text-xs mt-0.5 truncate max-w-[160px]">{r.email}</p>
                        )}
                      </td>

                      {/* Trial */}
                      <td className="px-5 py-4">
                        <p className={`text-sm font-medium ${trial.color}`}>{trial.label}</p>
                        <p className="text-[#475569] text-xs mt-0.5">Added {formatDate(r.created_at)}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(r.client_id)}
                          disabled={toggling === r.client_id}
                          title={r.is_active ? 'Deactivate' : 'Activate'}
                          className="p-2 rounded-lg text-[#475569] hover:text-white hover:bg-[#1e293b] transition-colors disabled:opacity-40"
                        >
                          {toggling === r.client_id
                            ? <Loader2 size={16} className="animate-spin" />
                            : r.is_active
                              ? <ToggleRight size={18} className="text-emerald-400" />
                              : <ToggleLeft  size={18} />
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-[#1e293b]">
              <p className="text-xs text-[#475569]">
                Showing {filtered.length} of {total} restaurant{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

// ── Input style ─────────────────────────────────────────────────────────
const iCls =
  'w-full px-3 py-2.5 bg-[#0a0f1a] border border-[#1e293b] rounded-xl text-white text-sm placeholder-[#475569] focus:outline-none focus:border-[#2563eb] transition-colors';

function ModalField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748b] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
