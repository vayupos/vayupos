import React, { useState, useEffect } from 'react';
import { Download, Plus, Filter, Eye, Edit2, Trash2, RotateCw, FileText, Flame, Droplet, Zap, Wifi, Paperclip, X, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// API Helper Functions
const api = {
    async getExpenses(skip = 0, limit = 100) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses?skip=${skip}&limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch expenses');
            return await response.json();
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    },

    async createExpense(expenseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });
            if (!response.ok) throw new Error('Failed to create expense');
            return await response.json();
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    },

    async getExpense(expenseId) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`);
            if (!response.ok) throw new Error('Failed to fetch expense');
            return await response.json();
        } catch (error) {
            console.error('Error fetching expense:', error);
            throw error;
        }
    },

    async updateExpense(expenseId, updateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error('Failed to update expense');
            return await response.json();
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },

    async deleteExpense(expenseId) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete expense');
            return await response.json();
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },

    // ✅ Fetch upcoming staff salaries
    async getUpcomingStaffSalaries() {
        try {
            const tokenKeys = ['access_token', 'acces_Token', 'token', 'authToken'];
            let token = null;
            
            for (const key of tokenKeys) {
                const value = localStorage.getItem(key);
                if (value && value.length > 10) {
                    token = value;
                    break;
                }
            }

            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/staff/upcoming-salaries`, {
                method: 'GET',
                headers: headers,
            });
            
            if (!response.ok) {
                console.warn('Failed to fetch upcoming salaries');
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching upcoming staff salaries:', error);
            return [];
        }
    }
};

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, subtitle, children, size = 'default' }) => {
    const sizeClasses = {
        default: 'max-w-[95vw] sm:max-w-xl md:max-w-3xl',
        large: 'max-w-[95vw] sm:max-w-2xl md:max-w-4xl'
    };

    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onClose}
        >
            <div
                className={`relative w-full ${sizeClasses[size]} bg-card border border-border rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[96vh] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-3 sm:p-4 md:p-6 border-b border-border flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-2">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">{title}</h2>
                        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ExpensesManagement = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // ✅ Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [paymentModeFilter, setPaymentModeFilter] = useState('All');
    const [dateRangeFilter, setDateRangeFilter] = useState('This Month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        account: 'Cashbook',
        amount: '0.00',
        tax: '0',
        payment_mode: 'Cash',
        notes: '',
        subtitle: 'Manual entry',
        type: 'manual'
    });

    const [expenses, setExpenses] = useState([]);
    const [autoAddedPayments, setAutoAddedPayments] = useState([]);
    const [removingIds, setRemovingIds] = useState(new Set()); // ✅ Track which items are being removed

    const presets = [
        { id: 1, icon: Flame, label: 'Gas Cylinder', amount: '₹3,200', category: 'Kitchen Supplies' },
        { id: 2, icon: Droplet, label: 'Water Can', amount: '₹150', category: 'Kitchen Supplies' },
        { id: 3, icon: Zap, label: 'Veg Supplier', amount: '₹2,800', category: 'Kitchen Supplies' },
        { id: 4, icon: Wifi, label: 'Internet Bill', amount: '₹999', category: 'Utilities' }
    ];

    // Load expenses and upcoming salaries on mount
    useEffect(() => {
        loadExpenses();
        loadUpcomingStaffSalaries();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await api.getExpenses();
            setExpenses(data);
        } catch (error) {
            alert('Failed to load expenses. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Load upcoming staff salaries
    const loadUpcomingStaffSalaries = async () => {
        try {
            const data = await api.getUpcomingStaffSalaries();
            
            const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6', '#D4A574', '#34495E'];
            const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
            
            const transformedSalaries = data.map(entry => ({
                id: entry.id,
                staffId: entry.staff_id || entry.id,
                name: entry.name,
                role: entry.role,
                avatar: entry.name.charAt(0).toUpperCase(),
                color: getRandomColor(),
                amount: `₹${entry.salary.toLocaleString('en-IN')}`,
                amountRaw: entry.salary,
                cycle: new Date(entry.due_date || entry.dueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
                dueDate: entry.due_date || entry.dueDate,
                status: 'Scheduled',
                category: 'Salaries & Wages'
            }));
            
            setAutoAddedPayments(transformedSalaries);
            
            // ✅ Smart cleanup: only keep removingIds that are still in the new data
            // If an ID is not in the new data, it was successfully removed, so clean it up
            setRemovingIds(prev => {
                const newSet = new Set();
                const currentStaffIds = new Set(transformedSalaries.map(s => s.staffId));
                prev.forEach(id => {
                    // Only keep the ID if it still exists in the data (meaning removal failed)
                    if (currentStaffIds.has(id)) {
                        newSet.add(id);
                    }
                });
                return newSet;
            });
        } catch (error) {
            console.error('Failed to load upcoming staff salaries:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatAmount = (amount) => {
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    // ✅ Filter expenses based on all filter criteria
    const getFilteredExpenses = () => {
        let filtered = [...expenses];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(expense => 
                expense.title.toLowerCase().includes(query) ||
                expense.category.toLowerCase().includes(query) ||
                expense.notes?.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter(expense => expense.category === categoryFilter);
        }

        // Payment mode filter
        if (paymentModeFilter !== 'All') {
            filtered = filtered.filter(expense => expense.payment_mode === paymentModeFilter);
        }

        // Date range filter
        if (dateRangeFilter === 'Custom' && startDate && endDate) {
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                return expenseDate >= start && expenseDate <= end;
            });
        } else if (dateRangeFilter === 'Today') {
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(expense => expense.date === today);
        } else if (dateRangeFilter === 'This Week') {
            const now = new Date();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            filtered = filtered.filter(expense => new Date(expense.date) >= weekStart);
        } else if (dateRangeFilter === 'This Month') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(expense => new Date(expense.date) >= monthStart);
        } else if (dateRangeFilter === 'Last Month') {
            const now = new Date();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd;
            });
        }

        return filtered;
    };

    // ✅ Get unique categories from expenses
    const getUniqueCategories = () => {
        const categories = new Set(expenses.map(e => e.category));
        return ['All', ...Array.from(categories)];
    };

    // ✅ Get unique payment modes from expenses
    const getUniquePaymentModes = () => {
        const modes = new Set(expenses.map(e => e.payment_mode));
        return ['All', ...Array.from(modes)];
    };

    // ✅ Reset all filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setCategoryFilter('All');
        setPaymentModeFilter('All');
        setDateRangeFilter('This Month');
        setStartDate('');
        setEndDate('');
    };

    const handleEdit = async (id) => {
        try {
            const expense = await api.getExpense(id);
            setFormData({
                title: expense.title,
                date: expense.date,
                category: expense.category,
                account: expense.account || 'Cashbook',
                amount: expense.amount.toString(),
                tax: expense.tax?.toString() || '0',
                payment_mode: expense.payment_mode || 'Cash',
                notes: expense.notes || '',
                subtitle: expense.subtitle || 'Manual entry',
                type: expense.type || 'manual'
            });
            setEditingId(id);
            setShowAddForm(true);
        } catch (error) {
            alert('Failed to load expense details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.deleteExpense(id);
                await loadExpenses();
                alert('Expense deleted successfully!');
            } catch (error) {
                alert('Failed to delete expense.');
            }
        }
    };

    const handleView = async (id) => {
        try {
            const expense = await api.getExpense(id);
            alert(`Expense Details:\n\nTitle: ${expense.title}\nCategory: ${expense.category}\nAmount: ${formatAmount(expense.amount)}\nDate: ${formatDate(expense.date)}\nNotes: ${expense.notes || 'N/A'}`);
        } catch (error) {
            alert('Failed to load expense details.');
        }
    };

    // ✅ FIXED: Handle adding salary from upcoming payments with proper optimistic update
    const handleAddNow = async (staffId) => {
        const payment = autoAddedPayments.find(p => p.staffId === staffId);
        if (!payment) return;

        console.log('🔄 Adding salary for staffId:', staffId);

        // ✅ Mark as removing to hide from UI immediately
        setRemovingIds(prev => new Set([...prev, staffId]));

        try {
            // Create expense from salary
            const expenseData = {
                title: `Salary: ${payment.name}`,
                category: 'Salaries & Wages',
                amount: payment.amountRaw,
                date: new Date().toISOString().split('T')[0],
                subtitle: `Auto-added by Staff Payroll - ${payment.role}`,
                type: 'auto',
                account: 'Cashbook',
                tax: 0,
                payment_mode: 'Cash',
                notes: `Monthly salary payment for ${payment.name} (${payment.role}) - Cycle: ${payment.cycle}`
            };

            await api.createExpense(expenseData);
            
            // Call backend to mark salary as paid
            const tokenKeys = ['access_token', 'acces_Token', 'token', 'authToken'];
            let token = null;
            
            for (const key of tokenKeys) {
                const value = localStorage.getItem(key);
                if (value && value.length > 10) {
                    token = value;
                    break;
                }
            }

            if (token) {
                await fetch(`${API_BASE_URL}/staff/salaries/${staffId}/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            console.log('✅ Salary added successfully');
            alert('Salary entry added successfully!');
            
            // Refresh both lists from server
            await loadExpenses();
            await loadUpcomingStaffSalaries();
            
        } catch (error) {
            console.error('❌ Error adding salary:', error);
            // ✅ If error, remove from removing set to show it again
            setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(staffId);
                return newSet;
            });
            alert('Failed to add salary entry.');
        }
    };

    const handleReset = () => {
        setFormData({
            title: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            account: 'Cashbook',
            amount: '0.00',
            tax: '0',
            payment_mode: 'Cash',
            notes: '',
            subtitle: 'Manual entry',
            type: 'manual'
        });
        setEditingId(null);
    };

    const handleSaveDraft = () => {
        if (!formData.title || !formData.category || parseFloat(formData.amount) === 0) {
            alert('Please fill in at least Title, Category, and Amount to save as draft.');
            return;
        }
        alert('Draft saved successfully! You can continue editing later.');
    };

    const handleAddExpense = async () => {
        if (!formData.title || !formData.category || parseFloat(formData.amount) === 0) {
            alert('Please fill in Title, Category, and Amount fields.');
            return;
        }

        setLoading(true);
        try {
            const expenseData = {
                title: formData.title,
                category: formData.category,
                amount: parseFloat(formData.amount),
                date: formData.date,
                subtitle: formData.subtitle,
                type: formData.type,
                account: formData.account,
                tax: parseFloat(formData.tax) || 0,
                payment_mode: formData.payment_mode,
                notes: formData.notes
            };

            if (editingId) {
                await api.updateExpense(editingId, expenseData);
                alert('Expense updated successfully!');
            } else {
                await api.createExpense(expenseData);
                alert('Expense added successfully!');
            }

            await loadExpenses();
            handleReset();
            setShowAddForm(false);
        } catch (error) {
            alert(editingId ? 'Failed to update expense.' : 'Failed to add expense.');
        } finally {
            setLoading(false);
        }
    };

    const handlePresetClick = (preset) => {
        setFormData({
            ...formData,
            title: preset.label,
            category: preset.category,
            amount: preset.amount.replace('₹', '').replace(',', '')
        });
    };

    const handleExport = () => {
        const filtered = getFilteredExpenses();
        const csvContent = filtered.map(e =>
            `${e.title},${e.category},${formatAmount(e.amount)},${formatDate(e.date)}`
        ).join('\n');
        const blob = new Blob([`Title,Category,Amount,Date\n${csvContent}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filteredExpenses = getFilteredExpenses();
    const hasActiveFilters = searchQuery.trim() || categoryFilter !== 'All' || paymentModeFilter !== 'All' || dateRangeFilter !== 'This Month';
    
    // ✅ Filter out payments that are being removed
    const visibleAutoAddedPayments = autoAddedPayments.filter(p => !removingIds.has(p.staffId));

    return (
        <div className="min-h-screen bg-background">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Expenses</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors bg-transparent text-foreground border border-border hover:bg-muted text-sm"
                        >
                            <Download size={16} />
                            <span className="text-xs sm:text-sm">Export</span>
                        </button>
                        <button
                            onClick={() => {
                                handleReset();
                                setShowAddForm(true);
                            }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                        >
                            <Plus size={16} />
                            <span className="text-xs sm:text-sm">New Expense</span>
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && expenses.length === 0 && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                    </div>
                )}

                {/* All Expenses Table */}
                {!loading || expenses.length > 0 ? (
                    <div className="rounded-lg px-3 sm:px-4 md:px-5 py-4 mb-4 sm:mb-6 bg-card border border-border">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                            <h2 className="text-base sm:text-lg font-bold text-foreground">All Expenses</h2>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <span className="px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground border border-border whitespace-nowrap">
                                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter size={14} />
                                    <span>Filters</span>
                                </button>
                            </div>
                        </div>

                        {/* ✅ Filter Panel */}
                        {showFilters && (
                            <div className="bg-muted rounded-lg p-3 sm:p-4 mb-4 border border-border">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Search */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs text-muted-foreground mb-1.5">Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search by title, category..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            {getUniqueCategories().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Payment Mode */}
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">Payment Mode</label>
                                        <select
                                            value={paymentModeFilter}
                                            onChange={(e) => setPaymentModeFilter(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            {getUniquePaymentModes().map(mode => (
                                                <option key={mode} value={mode}>{mode}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">Date Range</label>
                                        <select
                                            value={dateRangeFilter}
                                            onChange={(e) => setDateRangeFilter(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="Today">Today</option>
                                            <option value="This Week">This Week</option>
                                            <option value="This Month">This Month</option>
                                            <option value="Last Month">Last Month</option>
                                            <option value="Custom">Custom Range</option>
                                            <option value="All Time">All Time</option>
                                        </select>
                                    </div>

                                    {/* Custom Date Range */}
                                    {dateRangeFilter === 'Custom' && (
                                        <>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1.5">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1.5">End Date</label>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Reset Button */}
                                {hasActiveFilters && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={handleResetFilters}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
                                        >
                                            <RotateCw className="w-3 h-3" />
                                            <span>Reset Filters</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Card View */}
                        <div className="block sm:hidden space-y-3">
                            {filteredExpenses.map((expense, index) => (
                                <div key={expense.id} className="bg-muted rounded-lg p-3 border border-border">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-foreground truncate">{expense.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">{expense.subtitle}</div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground whitespace-nowrap ml-2">
                                            {formatAmount(expense.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                        <span>{expense.category}</span>
                                        <span>{formatDate(expense.date)}</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                        {expense.type === 'auto' ? (
                                            <>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">Auto</span>
                                                <button
                                                    onClick={() => handleView(expense.id)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs text-foreground border border-border hover:bg-muted"
                                                >
                                                    <Eye size={12} />
                                                    View
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(expense.id)}
                                                    className="p-1.5 rounded transition-colors text-primary hover:bg-primary/10"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-1.5 rounded transition-colors text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-primary/10 border-b border-border">
                                        <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">#</th>
                                        <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Title</th>
                                        <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Category</th>
                                        <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Amount</th>
                                        <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground hidden md:table-cell">Date</th>
                                        <th className="text-right font-bold py-3 px-3 text-sm text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((expense, index) => (
                                        <tr key={expense.id} className="border-b border-border">
                                            <td className="py-4 px-3">
                                                <span className="text-sm text-foreground">{index + 1}</span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm text-foreground">{expense.title}</div>
                                                        <div className="text-xs text-muted-foreground">{expense.subtitle}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="text-sm text-foreground">{expense.category}</span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                                                    {formatAmount(expense.amount)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3 hidden md:table-cell">
                                                <span className="text-sm text-foreground whitespace-nowrap">
                                                    {formatDate(expense.date)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {expense.type === 'auto' ? (
                                                        <>
                                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                                                Auto
                                                            </span>
                                                            <button
                                                                onClick={() => handleView(expense.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-xs text-foreground border border-border hover:bg-muted"
                                                            >
                                                                <Eye size={14} />
                                                                View
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(expense.id)}
                                                                className="p-2 rounded transition-colors text-primary hover:bg-primary/10"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="p-2 rounded transition-colors text-red-500 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredExpenses.length === 0 && (
                            <div className="text-center py-8">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground mb-1">No expenses found</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {hasActiveFilters 
                                        ? 'Try adjusting your filters or search criteria'
                                        : 'Add your first expense to get started'
                                    }
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                    >
                                        <RotateCw className="w-3 h-3" />
                                        <span>Clear filters</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Auto-Added Staff Payments */}
                <div className="rounded-lg px-3 sm:px-4 md:px-5 py-4 bg-card border border-border">
                    <div className="flex flex-col gap-2 mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-foreground">Auto-Added Staff Payments</h2>
                        <span className="text-xs text-muted-foreground">Entries generated from staff joining-date cycles</span>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-3">
                        {visibleAutoAddedPayments.map((payment) => (
                            <div key={payment.id} className="bg-muted rounded-lg p-3 border border-border">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 text-white"
                                            style={{ backgroundColor: payment.color }}
                                        >
                                            {payment.avatar}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm text-foreground truncate">{payment.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{payment.role}</div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground whitespace-nowrap ml-2">{payment.amount}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>{payment.cycle}</span>
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white"
                                    >
                                        {payment.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                    <button
                                        onClick={() => handleAddNow(payment.staffId)}
                                        disabled={removingIds.has(payment.staffId)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={12} />
                                        {removingIds.has(payment.staffId) ? 'Adding...' : 'Add Now'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-primary/10 border-b border-border">
                                    <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Staff</th>
                                    <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Amount</th>
                                    <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground hidden md:table-cell">Cycle</th>
                                    <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground">Status</th>
                                    <th className="text-left font-bold py-3 px-3 text-sm text-muted-foreground hidden lg:table-cell">Category</th>
                                    <th className="text-right font-bold py-3 px-3 text-sm text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleAutoAddedPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-border">
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 text-white"
                                                    style={{ backgroundColor: payment.color }}
                                                >
                                                    {payment.avatar}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-foreground truncate">{payment.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{payment.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3">
                                            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{payment.amount}</span>
                                        </td>
                                        <td className="py-4 px-3 hidden md:table-cell">
                                            <span className="text-sm text-foreground">{payment.cycle}</span>
                                        </td>
                                        <td className="py-4 px-3">
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-3 hidden lg:table-cell">
                                            <span className="text-xs text-muted-foreground">{payment.category}</span>
                                        </td>
                                        <td className="py-4 px-3">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleAddNow(payment.staffId)}
                                                    disabled={removingIds.has(payment.staffId)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={14} />
                                                    {removingIds.has(payment.staffId) ? 'Adding...' : 'Add Now'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {visibleAutoAddedPayments.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No upcoming staff payments.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Expense Modal - keeping same as before */}
            <Modal
                isOpen={showAddForm}
                onClose={() => {
                    setShowAddForm(false);
                    handleReset();
                }}
                title={editingId ? "Edit Expense" : "Add Expense"}
                subtitle={editingId ? "Update expense details" : "Create a manual expense with full details"}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Expense Details */}
                        <div className="rounded-lg px-3 sm:px-4 py-4 bg-muted border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground">Expense Details</h3>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs text-primary border border-primary hover:bg-primary/10"
                                >
                                    <RotateCw size={14} />
                                    Reset
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs mb-1.5 text-muted-foreground">Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter expense title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs mb-1.5 text-muted-foreground">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs mb-1.5 text-muted-foreground">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                    >
                                        <option value="">Select category</option>
                                        <option>Kitchen Supplies</option>
                                        <option>Salaries & Wages</option>
                                        <option>Utilities</option>
                                        <option>Rent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs mb-1.5 text-muted-foreground">Account</label>
                                    <input
                                        type="text"
                                        value={formData.account}
                                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs mb-1.5 text-muted-foreground">Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1.5 text-muted-foreground">Tax (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.tax}
                                            onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1.5 text-muted-foreground">Mode</label>
                                        <input
                                            type="text"
                                            value={formData.payment_mode}
                                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs mb-1.5 text-muted-foreground">Notes</label>
                                    <textarea
                                        placeholder="Optional notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="3"
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                                    <button
                                        onClick={handleSaveDraft}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-transparent text-foreground border border-border hover:bg-muted"
                                    >
                                        <FileText size={16} />
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={handleAddExpense}
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                {editingId ? 'Update Expense' : 'Add Expense'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Add Presets */}
                        <div className="rounded-lg px-3 sm:px-4 py-4 bg-muted border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground">Quick Add Presets</h3>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                    This Month
                                </span>
                            </div>

                            <p className="text-xs mb-3 text-muted-foreground">Use presets for frequent expenses</p>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <preset.icon size={16} className="flex-shrink-0" />
                                        <div className="text-left min-w-0">
                                            <div className="font-semibold truncate">{preset.label}</div>
                                            <div className="text-xs opacity-90">{preset.amount}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs mb-1.5 text-muted-foreground">Attach Receipt</label>
                                <label htmlFor="file-upload">
                                    <div
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors border-border bg-background hover:border-primary"
                                    >
                                        <Paperclip size={18} className="text-foreground" />
                                        <div className="text-center">
                                            <span className="text-sm text-foreground">Drop image/PDF</span>
                                            <span className="text-xs ml-2 text-primary">Optional</span>
                                        </div>
                                    </div>
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            alert(`File selected: ${e.target.files[0].name}`);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExpensesManagement;