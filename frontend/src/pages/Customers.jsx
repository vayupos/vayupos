import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Save, Download, Pencil, Copy, IndianRupee,
  Clock, ShoppingBag, Trash2, PlusCircle, Plus, X, Search,
  Star, Users, TrendingUp, ChevronDown, ChevronUp, Loader2,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toastError, toastSuccess } from "../lib/toast";

// ── Loyalty tier ────────────────────────────────────────────────────────────
function getLoyaltyTier(pts) {
  if (pts >= 2000) return { name: "Gold",   bg: "bg-amber-500/10",  text: "text-amber-500",  border: "border-amber-500/30",  next: null,     nextAt: 2000 };
  if (pts >= 500)  return { name: "Silver", bg: "bg-slate-400/10",  text: "text-slate-400",  border: "border-slate-400/30",  next: "Gold",   nextAt: 2000 };
  return              { name: "Bronze", bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30", next: "Silver", nextAt: 500  };
}

function TierBadge({ points, size = "sm" }) {
  const t = getLoyaltyTier(points);
  const cls = size === "lg"
    ? "px-3 py-1 text-sm font-semibold rounded-full border"
    : "px-2 py-0.5 text-[11px] font-semibold rounded-full border";
  return <span className={`${cls} ${t.bg} ${t.text} ${t.border}`}>{t.name}</span>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getDisplayName = (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer";
const getInitials   = (c) =>
  getDisplayName(c).split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "CU";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const EMPTY_CUSTOMER = {
  first_name: "", last_name: "", phone: "", email: "",
  address: "", city: "", state: "", zip_code: "", country: "India",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Customers() {
  const navigate = useNavigate();

  // Loyalty config from restaurant settings
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    loyalty_point_value: 0.10,
    loyalty_earn_pct: 2.0,
    loyalty_min_redeem_pts: 100,
  });

  useEffect(() => {
    api.get("/settings").then(res => {
      const s = res.data;
      setLoyaltyConfig({
        loyalty_point_value:    s.loyalty_point_value    ?? 0.10,
        loyalty_earn_pct:       s.loyalty_earn_pct       ?? 2.0,
        loyalty_min_redeem_pts: s.loyalty_min_redeem_pts ?? 100,
      });
    }).catch(() => {});
  }, []);

  const [view, setView] = useState("list");
  const [customers, setCustomers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  // Detail view
  const [selected, setSelected] = useState(null);       // raw backend object
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Add customer modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Add loyalty points modal
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [loyaltySaving, setLoyaltySaving] = useState(false);

  // Offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);

  // Delete confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadCustomers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/customers/", { params: { skip: 0, limit: 200 } });
      setCustomers(res.data.data || res.data || []);
    } catch (err) {
      setLoadError(err?.response?.data?.detail || "Failed to load customers. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (customerId) => {
    setOrdersLoading(true);
    try {
      const res = await api.get(`/orders/customer/${customerId}`, { params: { limit: 100 } });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      getDisplayName(c).toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const lastVisit = useMemo(() => {
    if (!orders.length) return "—";
    const sorted = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return fmtDate(sorted[0].created_at);
  }, [orders]);

  const totalSpent  = useMemo(() => orders.reduce((s, o) => s + Number(o.total || 0), 0), [orders]);
  const avgOrder    = orders.length ? Math.round(totalSpent / orders.length) : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openDetail = async (c) => {
    setSelected(c);
    setEditForm({
      first_name: c.first_name || "", last_name: c.last_name || "",
      email: c.email || "", phone: c.phone || "",
      address: c.address || "", city: c.city || "",
      state: c.state || "", zip_code: c.zip_code || "",
      country: c.country || "India", is_active: c.is_active ?? true,
    });
    setIsEditing(false);
    setExpandedOrderId(null);
    setView("detail");
    await loadOrders(c.id);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const res = await api.put(`/customers/${selected.id}`, editForm);
      const updated = res.data;
      setSelected(updated);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      setIsEditing(false);
      toastSuccess("Customer updated");
    } catch (err) {
      toastError(err, "Failed to update customer");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSaving(true);
    try {
      await api.post("/customers/", newCustomer);
      setShowAddModal(false);
      setNewCustomer(EMPTY_CUSTOMER);
      loadCustomers();
    } catch (err) {
      const d = err?.response?.data?.detail;
      const msg = Array.isArray(d) ? d[0]?.msg : (typeof d === "string" ? d : "Failed to add customer");
      setAddError(msg);
    } finally {
      setAddSaving(false);
    }
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    const pts = Number(loyaltyPoints);
    if (!pts || pts <= 0) return;
    setLoyaltySaving(true);
    try {
      const res = await api.post(`/customers/${selected.id}/loyalty-points`, null, { params: { points: pts } });
      const updated = { ...selected, loyalty_points: res.data.loyalty_points };
      setSelected(updated);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      setShowLoyaltyModal(false);
      setLoyaltyPoints("");
      toastSuccess(`${pts} loyalty points added`);
    } catch (err) {
      toastError(err, "Failed to add points");
    } finally {
      setLoyaltySaving(false);
    }
  };

  const handleApplyOffer = async () => {
    setOfferLoading(true);
    try {
      const res = await api.get("/coupons/available");
      setCoupons(res.data?.eligible || []);
      if (res.data?.eligible?.length) setSelectedCoupon(res.data.eligible[0].code);
    } catch { setCoupons([]); }
    finally { setOfferLoading(false); }
    setShowOfferModal(true);
  };

  const confirmOffer = async () => {
    if (!selectedCoupon) return;
    try {
      const res = await api.post("/coupons/validate", {
        coupon_code: selectedCoupon,
        subtotal: Number(selected.total_spent || 0),
        customer_id: String(selected.id),
      });
      if (res.data.valid && res.data.eligible) {
        setShowOfferModal(false);
        toastSuccess(`Offer "${selectedCoupon}" applied`);
      } else {
        toastError(res.data.message || "Coupon not eligible for this customer");
      }
    } catch (err) { toastError(err, "Failed to apply offer"); }
  };

  const handleDelete = async () => {
    setDeleteSaving(true);
    try {
      await api.delete(`/customers/${selected.id}`);
      setCustomers(prev => prev.filter(c => c.id !== selected.id));
      setShowDeleteModal(false);
      setView("list");
      setSelected(null);
      toastSuccess("Customer removed");
    } catch (err) { toastError(err, "Failed to delete customer"); }
    finally { setDeleteSaving(false); }
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (view === "detail" && selected) {
    const tier       = getLoyaltyTier(selected.loyalty_points ?? 0);
    const pts        = selected.loyalty_points ?? 0;
    const ptsValue   = (pts * loyaltyConfig.loyalty_point_value).toFixed(2);
    const tierPct    = tier.next
      ? Math.min(100, Math.round((pts / tier.nextAt) * 100))
      : 100;

    return (
      <div className="min-h-screen bg-background text-foreground">

        {/* ── Delete modal ── */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-base font-semibold text-foreground mb-2">Delete Customer</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Deactivate <strong>{getDisplayName(selected)}</strong>? Their profile and order history will be preserved but hidden.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-border text-foreground hover:bg-secondary rounded-xl py-2.5 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteSaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                  {deleteSaving && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Offer modal ── */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Apply Offer</h3>
                <button onClick={() => setShowOfferModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X size={16} /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Select a coupon for {getDisplayName(selected)}'s next order:</p>
              {coupons.length ? (
                <select value={selectedCoupon} onChange={e => setSelectedCoupon(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 mb-5 cursor-pointer">
                  {coupons.map(c => (
                    <option key={c.id} value={c.code}>{c.code} — {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted rounded-xl p-3 mb-5">No coupons available right now.</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowOfferModal(false)} className="flex-1 border border-border text-foreground hover:bg-secondary rounded-xl py-2.5 text-sm font-medium transition-colors">Cancel</button>
                <button onClick={confirmOffer} disabled={!selectedCoupon || !coupons.length}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add loyalty points modal ── */}
        {showLoyaltyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl p-6 max-w-xs w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Add Loyalty Points</h3>
                <button onClick={() => { setShowLoyaltyModal(false); setLoyaltyPoints(""); }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X size={16} /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Current balance: <strong className="text-foreground">{pts} pts</strong></p>
              <form onSubmit={handleAddPoints} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Points to Add</label>
                  <input type="number" min="1" required autoFocus value={loyaltyPoints}
                    onChange={e => setLoyaltyPoints(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                    placeholder="e.g. 50" />
                </div>
                {loyaltyPoints && Number(loyaltyPoints) > 0 && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-2 rounded-xl">
                    New balance: <strong>{pts + Number(loyaltyPoints)} pts</strong> = ₹{((pts + Number(loyaltyPoints)) * loyaltyConfig.loyalty_point_value).toFixed(2)}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowLoyaltyModal(false); setLoyaltyPoints(""); }}
                    className="flex-1 border border-border text-foreground hover:bg-secondary rounded-xl py-2.5 text-sm font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={loyaltySaving}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    {loyaltySaving && <Loader2 size={14} className="animate-spin" />}
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setView("list"); setIsEditing(false); }}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{getDisplayName(selected)}</h2>
              <p className="text-xs text-muted-foreground">Customer since {fmtDate(selected.created_at)}</p>
            </div>
            <button onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)} disabled={editSaving}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
              {editSaving ? <Loader2 size={14} className="animate-spin" /> : isEditing ? <Save size={14} /> : <Pencil size={14} />}
              <span className="hidden sm:inline">{isEditing ? "Save" : "Edit"}</span>
            </button>
          </div>

          {/* Profile hero */}
          <div className="bg-background border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {getInitials(selected)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground leading-tight">{getDisplayName(selected)}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.phone || "No phone"}</p>
                <p className="text-sm text-muted-foreground truncate">{selected.email || "No email"}</p>
                <div className="mt-2">
                  <TierBadge points={pts} size="sm" />
                </div>
              </div>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-5 border-t border-border">
                {[
                  { key: "first_name", label: "First Name" },
                  { key: "last_name",  label: "Last Name" },
                  { key: "phone",      label: "Phone (10-digit)" },
                  { key: "email",      label: "Email", type: "email" },
                  { key: "address",    label: "Address", span: true },
                  { key: "city",       label: "City" },
                  { key: "state",      label: "State" },
                  { key: "zip_code",   label: "Zip Code" },
                ].map(f => (
                  <div key={f.key} className={f.span ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input type={f.type || "text"} value={editForm[f.key] || ""} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-teal-500 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Orders",       value: orders.length,                   icon: ShoppingBag },
                { label: "Total Spent",  value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: IndianRupee },
                { label: "Avg Order",    value: `₹${avgOrder}`,                  icon: TrendingUp },
                { label: "Last Visit",   value: lastVisit,                        icon: Clock },
              ].map(s => (
                <div key={s.label} className="bg-muted/60 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <s.icon size={13} className="text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-foreground leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty card */}
          <div className="bg-background border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Loyalty Points</h3>
              </div>
              <button onClick={() => setShowLoyaltyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors">
                <Plus size={12} /> Add Points
              </button>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-3xl font-black text-foreground">{pts.toLocaleString("en-IN")}</p>
              <p className="text-sm text-muted-foreground mb-1">pts = <span className="font-semibold text-foreground">₹{ptsValue}</span> redeemable</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <TierBadge points={pts} size="sm" />
              {tier.next && <span className="text-xs text-muted-foreground">{tier.nextAt - pts} pts to {tier.next}</span>}
              {!tier.next && <span className="text-xs text-amber-500 font-medium">Highest tier</span>}
            </div>
            {tier.next && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${tierPct}%` }} />
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="bg-background border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Order History</h3>
              <span className="text-xs text-muted-foreground">{orders.length} orders</span>
            </div>
            {ordersLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => {
                  const paid = ["completed", "paid"].includes((order.status || "").toLowerCase());
                  const expanded = expandedOrderId === order.id;
                  return (
                    <div key={order.id} className="border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                        className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{order.order_number || `#${order.id}`}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${paid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-500"}`}>
                              {paid ? "Paid" : "Pending"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(order.created_at)} · {fmtTime(order.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                        </div>
                        {expanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/30 space-y-1.5">
                          {order.items?.length ? order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-foreground">{item.product_name || item.name} × {item.quantity}</span>
                              <span className="text-muted-foreground">₹{Number(item.subtotal || item.price * item.quantity || 0).toLocaleString("en-IN")}</span>
                            </div>
                          )) : <p className="text-xs text-muted-foreground">{order.notes || "No item details"}</p>}
                          <div className="flex justify-between pt-2 border-t border-border text-sm font-semibold">
                            <span className="text-foreground">Total</span>
                            <span className="text-foreground">₹{Number(order.total || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-background border border-border rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl hover:bg-muted transition-colors gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">New Order</p>
                  <p className="text-xs text-muted-foreground">Start POS with {selected.first_name}'s details</p>
                </div>
                <button onClick={() => navigate("/pos", { state: { customer: { id: selected.id, name: getDisplayName(selected), phone: selected.phone, email: selected.email } } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors">
                  <PlusCircle size={13} /> Start
                </button>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl hover:bg-muted transition-colors gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Send Offer</p>
                  <p className="text-xs text-muted-foreground">Apply a coupon to their next order</p>
                </div>
                <button onClick={handleApplyOffer} disabled={offerLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors">
                  {offerLoading ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />} Offer
                </button>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl hover:bg-muted transition-colors gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-500">Delete Customer</p>
                  <p className="text-xs text-muted-foreground">Deactivate profile and hide from list</p>
                </div>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Add customer modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Add Customer</h3>
              <button onClick={() => { setShowAddModal(false); setAddError(""); setNewCustomer(EMPTY_CUSTOMER); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name *</label>
                  <input required value={newCustomer.first_name} onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                    placeholder="Rahul" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name *</label>
                  <input required value={newCustomer.last_name} onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                    placeholder="Sharma" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone (10-digit Indian mobile)</label>
                <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                  placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email (optional)</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                  placeholder="rahul@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
                <input value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                  placeholder="Street / Area" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">City</label>
                  <input value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors" placeholder="Hyderabad" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">State</label>
                  <input value={newCustomer.state} onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors" placeholder="TS" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">PIN</label>
                  <input value={newCustomer.zip_code} onChange={e => setNewCustomer({ ...newCustomer, zip_code: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors" placeholder="500032" />
                </div>
              </div>
              {addError && (
                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <AlertCircle size={13} /> {addError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAddModal(false); setAddError(""); setNewCustomer(EMPTY_CUSTOMER); }}
                  className="flex-1 border border-border text-foreground hover:bg-secondary rounded-xl py-2.5 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={addSaving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {addSaving && <Loader2 size={14} className="animate-spin" />}
                  {addSaving ? "Adding…" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage restaurant guests and loyalty programme</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-background border border-border rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">registered guests</p>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Loyalty Points</p>
          <p className="text-2xl font-bold text-amber-500">{totalPoints.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">points issued total</p>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Gold Members</p>
          <p className="text-2xl font-bold text-foreground">{customers.filter(c => (c.loyalty_points ?? 0) >= 2000).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">2000+ pts</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-teal-500 transition-colors" />
      </div>

      {/* List */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground">Loading customers…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-sm font-medium text-foreground">Failed to load</p>
            <p className="text-xs text-muted-foreground max-w-xs">{loadError}</p>
            <button onClick={loadCustomers} className="mt-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">Retry</button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={28} className="text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">{customerSearch ? "No matching customers" : "No customers yet"}</p>
            <p className="text-xs text-muted-foreground">{customerSearch ? "Try a different search" : "Add your first customer to get started"}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Customer", "Phone", "Email", "Orders", "Loyalty", "Tier"].map((h, i) => (
                      <th key={i} className="py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} onClick={() => openDetail(c)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(c)}
                          </div>
                          <p className="text-sm font-semibold text-foreground">{getDisplayName(c)}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">{c.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground max-w-45 truncate">{c.email || "—"}</td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-foreground">{c.orders_count ?? 0}</td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{(c.loyalty_points ?? 0).toLocaleString("en-IN")} pts</p>
                          <p className="text-[11px] text-muted-foreground">= ₹{((c.loyalty_points ?? 0) * loyaltyConfig.loyalty_point_value).toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <TierBadge points={c.loyalty_points ?? 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => openDetail(c)}
                  className="flex items-center gap-3 p-4 hover:bg-muted/40 cursor-pointer transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(c)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{getDisplayName(c)}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || c.email || "No contact"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <TierBadge points={c.loyalty_points ?? 0} />
                    <p className="text-[11px] text-muted-foreground mt-1">{(c.loyalty_points ?? 0)} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
