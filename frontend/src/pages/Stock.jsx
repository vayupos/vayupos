import React, { useState, useEffect } from 'react';
import { Plus, Package, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const Stock = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'grams', initial_stock: 0, threshold: 10 });
  
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ingredients');
      setIngredients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ingredients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleCreateIngredient = async (e) => {
    e.preventDefault();
    if (!newIngredient.name.trim() || !newIngredient.unit.trim()) {
      alert("Name and unit are required");
      return;
    }
    try {
      await api.post('/ingredients', newIngredient);
      setShowAddModal(false);
      setNewIngredient({ name: '', unit: 'grams', initial_stock: 0, threshold: 10 });
      fetchIngredients();
    } catch (err) {
      console.error("Failed to create ingredient", err);
      alert(err?.response?.data?.detail || "Error creating ingredient");
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockToAdd || Number(stockToAdd) <= 0) {
      alert("Please enter a valid amount to add.");
      return;
    }
    try {
      await api.post(`/ingredients/${selectedIngredient.id}/add-stock`, {
        quantity: Number(stockToAdd)
      });
      setShowStockModal(false);
      setSelectedIngredient(null);
      setStockToAdd('');
      fetchIngredients();
    } catch (err) {
      console.error("Failed to add stock", err);
      alert(err?.response?.data?.detail || "Error adding stock");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-teal-600" />
            Stock & Ingredients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage raw materials and track real-time inventory
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchIngredients}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            New Ingredient
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Threshold</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Added</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Used</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Stock</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-400">Loading stock data...</td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-400">No ingredients found. Add one to get started.</td>
                </tr>
              ) : (
                ingredients.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{item.threshold || 0}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{item.stock?.total_added || 0}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{item.stock?.total_used || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                        Number(item.stock?.available_quantity) <= Number(item.threshold)
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {item.stock?.available_quantity || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{item.unit}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIngredient(item);
                          setShowStockModal(true);
                        }}
                        className="text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400 text-sm font-medium transition-colors"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">New Ingredient</h3>
            <form onSubmit={handleCreateIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newIngredient.name}
                  onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  placeholder="e.g. Tomato"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
                <select
                  value={newIngredient.unit}
                  onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  <option value="grams">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="liter">Liters (L)</option>
                  <option value="pieces">Pieces</option>
                  <option value="slices">Slices</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Initial Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={newIngredient.initial_stock}
                  onChange={e => setNewIngredient({...newIngredient, initial_stock: Number(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  value={newIngredient.threshold}
                  onChange={e => setNewIngredient({...newIngredient, threshold: Number(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-4 py-2 rounded-lg text-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Add Stock for {selectedIngredient.name}
            </h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Quantity ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={stockToAdd}
                  onChange={e => setStockToAdd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedIngredient(null);
                    setStockToAdd('');
                  }}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-4 py-2 rounded-lg text-sm"
                >
                  Add
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
