import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Package, RefreshCw, Search, Pencil, Trash2,
  AlertTriangle, CheckCircle, X, Loader2, TrendingUp,
} from 'lucide-react';
import api from '../api/axios';
import { toastError, toastSuccess } from '../lib/toast';

// Unit groups — organised by measurement type
const UNIT_GROUPS = [
  {
    label: 'Weight',
    units: [
      { value: 'grams', label: 'Grams (g)', abbr: 'g' },
      { value: 'kg',    label: 'Kilograms (kg)', abbr: 'kg' },
    ],
  },
  {
    label: 'Volume',
    units: [
      { value: 'ml',    label: 'Milliliters (ml)', abbr: 'ml' },
      { value: 'liter', label: 'Liters (L)', abbr: 'L' },
    ],
  },
  {
    label: 'Count',
    units: [
      { value: 'pieces', label: 'Pieces (pcs)', abbr: 'pcs' },
      { value: 'dozen',  label: 'Dozen', abbr: 'doz' },
      { value: 'slices', label: 'Slices', abbr: 'slices' },
    ],
  },
  {
    label: 'Other',
    units: [
      { value: 'serving', label: 'Serving', abbr: 'srv' },
      { value: 'portion', label: 'Portion', abbr: 'ptn' },
      { value: 'cups',    label: 'Cups', abbr: 'cup' },
    ],
  },
];

const ALL_UNITS = UNIT_GROUPS.flatMap(g => g.units);
const getUnitAbbr = (unit) => ALL_UNITS.find(u => u.value === unit)?.abbr || unit;

const EMPTY_INGREDIENT = { name: '', unit: 'grams', threshold: 100, initial_stock: 0 };

function StatusBadge({ available, threshold }) {
  const qty = Number(available ?? 0);
  const min = Number(threshold ?? 0);
  if (qty <= min) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
        <AlertTriangle size={10} /> Low
      </span>
    );
  }
  if (qty <= min * 1.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <AlertTriangle size={10} /> Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <CheckCircle size={10} /> OK
    </span>
  );
}

const Stock = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIng, setNewIng] = useState(EMPTY_INGREDIENT);
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', unit: 'grams', threshold: 100 });
  const [editSaving, setEditSaving] = useState(false);

  // Add stock modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockTarget, setStockTarget] = useState(null); // null = user picks from dropdown
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [stockSaving, setStockSaving] = useState(false);

  // Inline delete loading
  const [deletingId, setDeletingId] = useState(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ingredients');
      setIngredients(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ingredients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIngredients(); }, []);

  const lowCount = useMemo(() =>
    ingredients.filter(i =>
      Number(i.stock?.available_quantity ?? 0) <= Number(i.threshold ?? 0)
    ).length,
    [ingredients]
  );

  const filtered = useMemo(() => {
    let list = ingredients;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(s));
    }
    if (statusFilter === 'low') list = list.filter(i => Number(i.stock?.available_quantity ?? 0) <= Number(i.threshold ?? 0));
    else if (statusFilter === 'ok') list = list.filter(i => Number(i.stock?.available_quantity ?? 0) > Number(i.threshold ?? 0));
    return list;
  }, [ingredients, searchTerm, statusFilter]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newIng.name.trim()) return;
    setAddSaving(true);
    try {
      await api.post('/ingredients', {
        name: newIng.name.trim(),
        unit: newIng.unit,
        threshold: Number(newIng.threshold),
        initial_stock: Number(newIng.initial_stock),
      });
      setShowAddModal(false);
      setNewIng(EMPTY_INGREDIENT);
      fetchIngredients();
      toastSuccess('Ingredient added');
    } catch (err) {
      toastError(err, 'Error creating ingredient');
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setEditForm({ name: item.name, unit: item.unit, threshold: item.threshold });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setEditSaving(true);
    try {
      await api.put(`/ingredients/${editTarget.id}`, {
        name: editForm.name.trim(),
        unit: editForm.unit,
        threshold: Number(editForm.threshold),
      });
      setEditTarget(null);
      fetchIngredients();
      toastSuccess('Ingredient updated');
    } catch (err) {
      toastError(err, 'Error updating ingredient');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? All stock records for it will be removed.`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/ingredients/${item.id}`);
      fetchIngredients();
      toastSuccess(`"${item.name}" deleted`);
    } catch (err) {
      toastError(err, 'Error deleting ingredient');
    } finally {
      setDeletingId(null);
    }
  };

  const openAddStock = (item = null) => {
    setStockTarget(item);
    setStockQty('');
    setStockNote('');
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockTarget(null);
    setStockQty('');
    setStockNote('');
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockTarget) return;
    const qty = Number(stockQty);
    if (!qty || qty <= 0) return;
    setStockSaving(true);
    try {
      await api.post(`/ingredients/${stockTarget.id}/add-stock`, { quantity: qty });
      closeStockModal();
      fetchIngredients();
      toastSuccess('Stock updated');
    } catch (err) {
      toastError(err, 'Error adding stock');
    } finally {
      setStockSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Stock & Ingredients
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Define ingredients, set minimum thresholds, and replenish stock
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchIngredients}
            title="Refresh"
            className="p-2 border border-border rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => openAddStock()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 px-4 py-2 rounded-xl transition-colors text-sm font-semibold"
          >
            <TrendingUp size={16} />
            Add Stock
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-semibold"
          >
            <Plus size={16} />
            New Ingredient
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-background border border-border rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold text-foreground">{ingredients.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ingredients tracked</p>
        </div>
        <div className={`bg-background border rounded-2xl p-4 ${lowCount > 0 ? 'border-red-500/30 bg-red-500/3' : 'border-border'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Low Stock</p>
          <p className={`text-2xl font-bold ${lowCount > 0 ? 'text-red-500' : 'text-foreground'}`}>{lowCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">need restocking</p>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sufficient</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ingredients.length - lowCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">well-stocked items</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="stock-search" className="sr-only">Search ingredients</label>
          <input
            id="stock-search"
            name="search_term"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <label htmlFor="stock-status-filter" className="sr-only">Filter by status</label>
        <select
          id="stock-status-filter"
          name="status_filter"
          autoComplete="off"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Ingredient', 'Unit', 'Min Stock', 'Total Added', 'Used', 'Available', 'Status', ''].map((h, i) => (
                  <th key={i} className={`py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 7 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 size={28} className="animate-spin text-teal-500" />
                      <p className="text-sm">Loading stock data…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Package size={22} className="text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {searchTerm || statusFilter !== 'all' ? 'No matching ingredients' : 'No ingredients yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Add an ingredient to start tracking stock'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const available = Number(item.stock?.available_quantity ?? 0);
                  const totalAdded = Number(item.stock?.total_added ?? 0);
                  const totalUsed  = Number(item.stock?.total_used ?? 0);
                  const threshold  = Number(item.threshold ?? 0);
                  const isLow = available <= threshold;
                  const pct = totalAdded > 0 ? Math.min(100, Math.max(0, (available / totalAdded) * 100)) : 0;
                  const abbr = getUnitAbbr(item.unit);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/40 transition-colors ${isLow ? 'bg-red-500/3' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-muted border border-border text-muted-foreground">
                          {abbr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">
                        {threshold} <span className="text-[11px]">{abbr}</span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">
                        {totalAdded} <span className="text-[11px]">{abbr}</span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">
                        {totalUsed} <span className="text-[11px]">{abbr}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-red-500' : 'bg-teal-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-foreground'}`}>
                            {available}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{abbr}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge available={available} threshold={threshold} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAddStock(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-colors"
                          >
                            <Plus size={11} /> Stock
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === item.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Ingredient Modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">New Ingredient</h3>
              <button
                onClick={() => { setShowAddModal(false); setNewIng(EMPTY_INGREDIENT); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="add-ingredient-name" className="block text-xs font-medium text-muted-foreground mb-1.5">Ingredient Name</label>
                <input
                  id="add-ingredient-name"
                  name="name"
                  autoComplete="off"
                  type="text"
                  required
                  autoFocus
                  value={newIng.name}
                  onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                  placeholder="e.g. Tomato, Flour, Olive Oil"
                />
              </div>
              <div>
                <label htmlFor="add-ingredient-unit" className="block text-xs font-medium text-muted-foreground mb-1.5">Unit</label>
                <select
                  id="add-ingredient-unit"
                  name="unit"
                  autoComplete="off"
                  value={newIng.unit}
                  onChange={e => setNewIng({ ...newIng, unit: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors cursor-pointer"
                >
                  {UNIT_GROUPS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.units.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  All stock additions for this ingredient will use this unit.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-ingredient-threshold" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Min Stock ({getUnitAbbr(newIng.unit)})
                  </label>
                  <input
                    id="add-ingredient-threshold"
                    name="threshold"
                    autoComplete="off"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newIng.threshold}
                    onChange={e => setNewIng({ ...newIng, threshold: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                    placeholder="100"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Alert below this</p>
                </div>
                <div>
                  <label htmlFor="add-ingredient-initial-stock" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Opening Stock ({getUnitAbbr(newIng.unit)})
                  </label>
                  <input
                    id="add-ingredient-initial-stock"
                    name="initial_stock"
                    autoComplete="off"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newIng.initial_stock}
                    onChange={e => setNewIng({ ...newIng, initial_stock: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Optional</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewIng(EMPTY_INGREDIENT); }}
                  className="flex-1 border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {addSaving && <Loader2 size={14} className="animate-spin" />}
                  {addSaving ? 'Saving…' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Ingredient Modal ─────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Edit Ingredient</h3>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-ingredient-name" className="block text-xs font-medium text-muted-foreground mb-1.5">Name</label>
                <input
                  id="edit-ingredient-name"
                  name="name"
                  autoComplete="off"
                  type="text"
                  required
                  autoFocus
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="edit-ingredient-unit" className="block text-xs font-medium text-muted-foreground mb-1.5">Unit</label>
                <select
                  id="edit-ingredient-unit"
                  name="unit"
                  autoComplete="off"
                  value={editForm.unit}
                  onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors cursor-pointer"
                >
                  {UNIT_GROUPS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.units.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-[11px] text-amber-500 mt-1.5">
                  Changing the unit does not convert existing stock values.
                </p>
              </div>
              <div>
                <label htmlFor="edit-ingredient-threshold" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Min Stock ({getUnitAbbr(editForm.unit)})
                </label>
                <input
                  id="edit-ingredient-threshold"
                  name="threshold"
                  autoComplete="off"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={editForm.threshold}
                  onChange={e => setEditForm({ ...editForm, threshold: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {editSaving && <Loader2 size={14} className="animate-spin" />}
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Stock Modal ───────────────────────────────────────────────────── */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Add Stock</h3>
              <button
                onClick={closeStockModal}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              {/* Ingredient selector — shown when opened from top button */}
              <div>
                <label htmlFor="add-stock-ingredient" className="block text-xs font-medium text-muted-foreground mb-1.5">Ingredient</label>
                <select
                  id="add-stock-ingredient"
                  name="ingredient_id"
                  autoComplete="off"
                  required
                  value={stockTarget?.id ?? ''}
                  onChange={e => {
                    const found = ingredients.find(i => i.id === Number(e.target.value));
                    setStockTarget(found ?? null);
                    setStockQty('');
                  }}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors cursor-pointer"
                >
                  <option value="">Select an ingredient…</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {Number(i.stock?.available_quantity ?? 0)} {getUnitAbbr(i.unit)} available
                    </option>
                  ))}
                </select>
              </div>

              {/* Current snapshot — shown only after an ingredient is selected */}
              {stockTarget && (
                <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-border/60">
                  {[
                    {
                      label: 'Available',
                      value: Number(stockTarget.stock?.available_quantity ?? 0),
                      highlight: Number(stockTarget.stock?.available_quantity ?? 0) <= Number(stockTarget.threshold ?? 0),
                    },
                    { label: 'Min Stock', value: stockTarget.threshold, highlight: false },
                    { label: 'Total Used', value: Number(stockTarget.stock?.total_used ?? 0), highlight: false },
                  ].map((s, idx) => (
                    <div key={idx} className="text-center p-3 bg-muted/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{s.label}</p>
                      <p className={`text-sm font-bold ${s.highlight ? 'text-red-500' : 'text-foreground'}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{getUnitAbbr(stockTarget.unit)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="add-stock-quantity" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Quantity to Add{stockTarget ? ` (${getUnitAbbr(stockTarget.unit)})` : ''}
                </label>
                <input
                  id="add-stock-quantity"
                  name="quantity"
                  autoComplete="off"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={!stockTarget}
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
                  placeholder={stockTarget ? `Enter amount in ${getUnitAbbr(stockTarget.unit)}` : 'Select an ingredient first'}
                />
              </div>

              <div>
                <label htmlFor="add-stock-note" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Note <span className="font-normal opacity-60">(optional)</span>
                </label>
                <input
                  id="add-stock-note"
                  name="note"
                  autoComplete="off"
                  type="text"
                  value={stockNote}
                  onChange={e => setStockNote(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal-500 transition-colors"
                  placeholder="e.g. Supplier: Fresh Farms, Batch #12"
                />
              </div>

              {stockTarget && stockQty && Number(stockQty) > 0 && (
                <div className="px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
                  After this addition: <strong>
                    {(Number(stockTarget.stock?.available_quantity ?? 0) + Number(stockQty)).toFixed(2)}
                  </strong> {getUnitAbbr(stockTarget.unit)} available
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockSaving || !stockTarget}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {stockSaving && <Loader2 size={14} className="animate-spin" />}
                  {stockSaving ? 'Adding…' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Stock;
