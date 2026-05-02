import {
  Search, Menu, LayoutDashboard, X, LogOut, UserCircle,
  ChevronDown, Key, Package, Users, ShoppingBag, Loader2,
  ArrowRight, IndianRupee
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import ChangePasswordModal from './ChangePasswordModal';
import api from '../api/axios';

const FOOD_TYPE_DOT = { non_veg: 'bg-red-500', egg: 'bg-yellow-400', veg: 'bg-emerald-500' };

const Navbar = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults]     = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const profileRef   = useRef(null);
  const searchRef    = useRef(null);
  const inputRef     = useRef(null);
  const debounceRef  = useRef(null);
  const navigate     = useNavigate();

  const userName   = localStorage.getItem('userName')   || 'User';

  // ── Ctrl/Cmd + K to focus search ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Close dropdowns on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Search API call (debounced) ──────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); setShowResults(false); return; }
    setSearchLoading(true);
    setShowResults(true);
    try {
      const res = await api.get('/search/global', { params: { q } });
      setSearchResults(res.data);
    } catch {
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults(null); setShowResults(false); return; }
    setShowResults(true);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
    clearTimeout(debounceRef.current);
  };

  const goTo = (type) => {
    clearSearch();
    if (type === 'product')  navigate('/menu');
    if (type === 'customer') navigate('/customers');
    if (type === 'order')    navigate('/pastorders');
  };

  const totalResults = searchResults
    ? (searchResults.products?.length || 0) + (searchResults.customers?.length || 0) + (searchResults.orders?.length || 0)
    : 0;
  const hasResults = totalResults > 0;

  // ── Logout ───────────────────────────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (theme) localStorage.setItem('theme', theme);
    navigate('/login', { replace: true });
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <nav className="sticky top-0 z-50 w-full bg-navbar border-b border-border">
      <div className="flex items-center justify-between px-4 h-16">

        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#17232C] rounded-xl flex items-center justify-center shadow-sm">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:inline">Vayu POS</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg mx-6 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery && setShowResults(true)}
              onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
              placeholder="Search products, customers, orders…"
              className="w-full pl-9 pr-16 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition-all"
            />
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 font-medium pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>

          {/* ── Results Dropdown ── */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[200] max-h-[420px] overflow-y-auto">
              {searchLoading && (
                <div className="flex items-center justify-center gap-2.5 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}

              {!searchLoading && searchQuery && !hasResults && (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground">No results for "{searchQuery}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different keyword</p>
                </div>
              )}

              {!searchLoading && hasResults && (
                <div className="py-2">
                  {/* Products */}
                  {searchResults.products?.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Products</span>
                        </div>
                        <button onClick={() => goTo('product')} className="text-[11px] text-teal-500 hover:text-teal-400 font-medium flex items-center gap-1 transition-colors">
                          View all <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {searchResults.products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => goTo('product')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        >
                          {p.image_url ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted">
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">₹{p.price}</p>
                          </div>
                        </button>
                      ))}
                    </section>
                  )}

                  {/* Customers */}
                  {searchResults.customers?.length > 0 && (
                    <section className="mt-1">
                      <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customers</span>
                        </div>
                        <button onClick={() => goTo('customer')} className="text-[11px] text-teal-500 hover:text-teal-400 font-medium flex items-center gap-1 transition-colors">
                          View all <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {searchResults.customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => goTo('customer')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                              {c.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.phone || c.email || '—'}</p>
                          </div>
                        </button>
                      ))}
                    </section>
                  )}

                  {/* Orders */}
                  {searchResults.orders?.length > 0 && (
                    <section className="mt-1">
                      <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Orders</span>
                        </div>
                        <button onClick={() => goTo('order')} className="text-[11px] text-teal-500 hover:text-teal-400 font-medium flex items-center gap-1 transition-colors">
                          View all <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {searchResults.orders.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => goTo('order')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{o.order_number}</p>
                            <p className="text-xs text-muted-foreground">₹{o.total?.toFixed(2)} · {o.status}</p>
                          </div>
                        </button>
                      ))}
                    </section>
                  )}

                  <div className="mx-3 mt-2 mb-2 border-t border-border pt-2">
                    <button
                      onClick={() => { clearSearch(); navigate(`/search?q=${encodeURIComponent(searchQuery)}`); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <span>See all results for <strong className="text-foreground">"{searchQuery}"</strong></span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationsDropdown />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-secondary rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className="hidden lg:inline text-sm font-medium text-foreground">{userName}</span>
              <ChevronDown className={`hidden lg:inline h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/40">
                  <p className="text-sm font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Restaurant Manager</p>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileOpen(false); setIsChangePasswordOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Key className="h-4 w-4 text-muted-foreground" />
                    Change Password
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search bar */}
      <div className="md:hidden px-4 pb-3">
        <div ref={searchRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchQuery && setShowResults(true)}
            onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
            placeholder="Search…"
            className="w-full pl-9 pr-9 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Mobile results */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[200] max-h-80 overflow-y-auto">
              {searchLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}
              {!searchLoading && !hasResults && searchQuery && (
                <div className="text-center py-8 text-sm text-muted-foreground">No results for "{searchQuery}"</div>
              )}
              {!searchLoading && hasResults && (
                <div className="py-2">
                  {searchResults.products?.map(p => (
                    <button key={p.id} onClick={() => goTo('product')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{p.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">₹{p.price}</span>
                    </button>
                  ))}
                  {searchResults.customers?.map(c => (
                    <button key={c.id} onClick={() => goTo('customer')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{c.name}</span>
                    </button>
                  ))}
                  {searchResults.orders?.map(o => (
                    <button key={o.id} onClick={() => goTo('order')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{o.order_number}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">₹{o.total?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </nav>
  );
};

export default Navbar;
