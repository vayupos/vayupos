import React, { useState } from 'react';
import {
    Search,
    UserPlus,
    Upload,
    Edit2,
    Trash2,
    RotateCw,
    Filter,
    Calendar,
    Play,
    Save,
    PlusCircle,
    X,
    Download,
} from 'lucide-react';

const StaffManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Active');
    const [joinedAfter, setJoinedAfter] = useState('2023-01-01');
    const [salaryRange, setSalaryRange] = useState('₹10k - ₹30k');
    const [showSearch, setShowSearch] = useState(false);
    const [showNewStaffModal, setShowNewStaffModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [simulationResults, setSimulationResults] = useState([]);

    const [newStaff, setNewStaff] = useState({
        name: '',
        phone: '',
        role: 'Cashier',
        salary: '',
        joined: new Date().toISOString().split('T')[0],
        aadhar: '',
    });

    const [staff, setStaff] = useState([
        {
            id: 1,
            name: 'Aarti Verma',
            phone: '+91 98301 11223',
            role: 'Cashier',
            salary: '₹18,000 / month',
            salaryAmount: 18000,
            joined: '12 Feb 2024',
            joinedDate: '2024-02-12',
            avatar: 'A',
            color: '#E74C3C',
            status: 'Active',
            aadhar: '1234 5678 9012',
        },
        {
            id: 2,
            name: 'Rahul Sinha',
            phone: '+91 99300 44556',
            role: 'Chef',
            salary: '₹25,000 / month',
            salaryAmount: 25000,
            joined: '01 Jun 2023',
            joinedDate: '2023-06-01',
            avatar: 'R',
            color: '#95A5A6',
            status: 'Active',
            aadhar: '2345 6789 0123',
        },
        {
            id: 3,
            name: 'Sana Khan',
            phone: '+91 88009 77881',
            role: 'Waiter',
            salary: '₹12,500 / month',
            salaryAmount: 12500,
            joined: '20 Sep 2024',
            joinedDate: '2024-09-20',
            avatar: 'S',
            color: '#D4A574',
            status: 'Active',
            aadhar: '3456 7890 1234',
        },
    ]);

    const [upcomingSalaries, setUpcomingSalaries] = useState([
        {
            id: 1,
            name: 'Aarti Verma',
            role: 'Cashier',
            avatar: 'A',
            color: '#E74C3C',
            amount: '₹18,000',
            dueDate: '12 Nov 2025',
            category: 'Salaries & Wages',
        },
        {
            id: 2,
            name: 'Rahul Sinha',
            role: 'Chef',
            avatar: 'R',
            color: '#95A5A6',
            amount: '₹25,000',
            dueDate: '01 Dec 2025',
            category: 'Salaries & Wages',
        },
    ]);

    const [automation, setAutomation] = useState({
        enabled: true,
        cycle: 'Monthly',
        expenseCategory: 'Salaries & Wages',
        expenseAccount: 'Cashbook',
        autoAddTime: '09:00 AM',
        notes: 'Monthly staff payroll auto-entry',
    });

    const colors = [
        '#E74C3C',
        '#3498DB',
        '#2ECC71',
        '#F39C12',
        '#9B59B6',
        '#1ABC9C',
        '#E67E22',
        '#95A5A6',
        '#D4A574',
        '#34495E',
    ];

    const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

    const formatAadhar = (value) => {
        const numbers = value.replace(/\D/g, '');
        const limited = numbers.slice(0, 12);
        const formatted = limited.replace(/(\d{4})(\d{4})?(\d{4})?/, (match, p1, p2, p3) => {
            let result = p1;
            if (p2) result += ' ' + p2;
            if (p3) result += ' ' + p3;
            return result;
        });
        return formatted;
    };

    const handleExport = () => {
        const headers = ['Name', 'Phone', 'Role', 'Salary', 'Joined', 'Status', 'Aadhar'];
        const rows = staff.map((s) => [
            s.name,
            s.phone,
            s.role,
            s.salaryAmount,
            s.joinedDate,
            s.status,
            s.aadhar,
        ]);

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += headers.join(',') + '\n';
        rows.forEach((row) => {
            csvContent += row.join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'staff_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddStaff = () => {
        if (!newStaff.name || !newStaff.phone || !newStaff.salary) {
            alert('Please fill all required fields');
            return;
        }

        if (newStaff.aadhar && newStaff.aadhar.replace(/\s/g, '').length !== 12) {
            alert('Please enter a valid 12-digit Aadhar number');
            return;
        }

        const salaryNum = parseFloat(newStaff.salary.replace(/[^0-9]/g, '')) || 0;
        const newId = staff.length ? Math.max(...staff.map((s) => s.id)) + 1 : 1;
        const avatar = newStaff.name.charAt(0).toUpperCase();
        const color = getRandomColor();

        const staffMember = {
            id: newId,
            name: newStaff.name,
            phone: newStaff.phone,
            role: newStaff.role,
            salary: `₹${salaryNum.toLocaleString('en-IN')} / month`,
            salaryAmount: salaryNum,
            joined: new Date(newStaff.joined).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            joinedDate: newStaff.joined,
            avatar: avatar,
            color: color,
            status: 'Active',
            aadhar: newStaff.aadhar,
        };

        setStaff([...staff, staffMember]);
        setNewStaff({
            name: '',
            phone: '',
            role: 'Cashier',
            salary: '',
            joined: new Date().toISOString().split('T')[0],
            aadhar: '',
        });
        setShowNewStaffModal(false);
        alert('Staff member added successfully!');
    };

    const handleEdit = (id) => {
        const member = staff.find((s) => s.id === id);
        if (member) {
            setEditingStaff({
                ...member,
                salary: member.salaryAmount.toString(),
            });
            setShowEditModal(true);
        }
    };

    const handleUpdateStaff = () => {
        if (!editingStaff.name || !editingStaff.phone || !editingStaff.salary) {
            alert('Please fill all required fields');
            return;
        }

        if (editingStaff.aadhar && editingStaff.aadhar.replace(/\s/g, '').length !== 12) {
            alert('Please enter a valid 12-digit Aadhar number');
            return;
        }

        const salaryNum = parseFloat(editingStaff.salary.replace(/[^0-9]/g, ''));

        setStaff(
            staff.map((s) =>
                s.id === editingStaff.id
                    ? {
                          ...s,
                          name: editingStaff.name,
                          phone: editingStaff.phone,
                          role: editingStaff.role,
                          salary: `₹${salaryNum.toLocaleString('en-IN')} / month`,
                          salaryAmount: salaryNum,
                          avatar: editingStaff.name.charAt(0).toUpperCase(),
                          aadhar: editingStaff.aadhar,
                      }
                    : s
            )
        );

        setShowEditModal(false);
        setEditingStaff(null);
        alert('Staff member updated successfully!');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            setStaff(staff.filter((s) => s.id !== id));
            alert('Staff member deleted successfully!');
        }
    };

    const handleAddSalary = (id) => {
        const salary = upcomingSalaries.find((s) => s.id === id);
        if (salary) {
            alert(`Added ${salary.amount} salary for ${salary.name} to expenses!`);
            setUpcomingSalaries(upcomingSalaries.filter((s) => s.id !== id));
        }
    };

    const handleSaveRules = () => {
        alert('Automation rules saved successfully!');
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setRoleFilter('All');
        setStatusFilter('Active');
        setJoinedAfter('2023-01-01');
        setSalaryRange('₹10k - ₹30k');
    };

    const getFilteredStaff = () => {
        return staff.filter((member) => {
            const matchesSearch =
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.phone.includes(searchQuery);
            const matchesRole = roleFilter === 'All' || member.role === roleFilter;
            const matchesStatus = member.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    };

    const filteredStaff = showSearch ? getFilteredStaff() : staff;

    return (
        <div className="min-h-screen bg-background">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">Staff</h1>
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-xs sm:text-sm"
                        >
                            <Download size={14} className="sm:w-4 sm:h-4" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={() => alert('Import functionality triggered!')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-xs sm:text-sm"
                        >
                            <Upload size={14} className="sm:w-4 sm:h-4" />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={() => setShowNewStaffModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-xs sm:text-sm"
                        >
                            <UserPlus size={14} className="sm:w-4 sm:h-4" />
                            <span>New Staff</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl border border-border p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
                    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1 w-full">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search staff by name or phone"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-muted border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Filter className="w-3 h-3" />
                                <span>{showSearch ? 'Hide advanced filters' : 'Show advanced filters'}</span>
                            </button>
                        </div>

                        {showSearch && (
                            <div className="w-full lg:w-auto flex flex-wrap gap-2 lg:gap-3">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="bg-muted border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="All">All Roles</option>
                                    <option value="Cashier">Cashier</option>
                                    <option value="Waiter">Waiter</option>
                                    <option value="Chef">Chef</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-muted border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>

                                <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={joinedAfter}
                                        onChange={(e) => setJoinedAfter(e.target.value)}
                                        className="bg-transparent text-xs sm:text-sm text-foreground focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={salaryRange}
                                    onChange={(e) => setSalaryRange(e.target.value)}
                                    className="bg-muted border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="₹10k - ₹30k">₹10k - ₹30k</option>
                                    <option value="₹30k - ₹50k">₹30k - ₹50k</option>
                                    <option value="₹50k+">₹50k+</option>
                                </select>

                                <button
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <RotateCw className="w-3 h-3" />
                                    <span>Reset</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff List */}
                <div className="bg-card rounded-xl border border-border p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-card-foreground">
                            Staff List
                        </h2>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            {filteredStaff.length} staff members
                        </span>
                    </div>

                    <div className="hidden md:grid grid-cols-[2fr,1.5fr,1.5fr,1.5fr,1fr,1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                        <span>Name</span>
                        <span>Role</span>
                        <span>Salary</span>
                        <span>Joined</span>
                        <span>Status</span>
                        <span className="text-right">Actions</span>
                    </div>

                    <div className="divide-y divide-border">
                        {filteredStaff.map((member) => (
                            <div
                                key={member.id}
                                className="grid md:grid-cols-[2fr,1.5fr,1.5fr,1.5fr,1fr,1fr] gap-3 px-3 py-3 items-center hover:bg-muted/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                        style={{ backgroundColor: member.color }}
                                    >
                                        {member.avatar}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-card-foreground">
                                            {member.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {member.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm text-card-foreground md:text-left text-right">
                                    {member.role}
                                </div>

                                <div className="text-sm text-card-foreground md:text-left text-right">
                                    {member.salary}
                                </div>

                                <div className="text-sm text-card-foreground md:text-left text-right">
                                    {member.joined}
                                </div>

                                <div className="flex items-center md:justify-start justify-end">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                                            member.status === 'Active'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {member.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(member.id)}
                                        className="p-1.5 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredStaff.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No staff found. Try adjusting your filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Salary Entries - full width, automation card removed */}
                <div className="mt-6">
                    <div className="bg-card rounded-xl border border-border p-4 lg:p-6 w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-card-foreground">
                                Upcoming Salary Entries
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {upcomingSalaries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between bg-muted rounded-lg px-3 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                            style={{ backgroundColor: entry.color }}
                                        >
                                            {entry.avatar}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-card-foreground">
                                                {entry.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {entry.role} • {entry.category}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block text-sm text-card-foreground">
                                        {entry.amount}
                                    </div>

                                    <div className="hidden sm:block text-xs text-muted-foreground">
                                        Due on {entry.dueDate}
                                    </div>

                                    <button
                                        onClick={() => handleAddSalary(entry.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs sm:text-sm font-medium hover:bg-teal-700 transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>Add Now</span>
                                    </button>
                                </div>
                            ))}

                            {upcomingSalaries.length === 0 && (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    No upcoming salary entries.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Staff Modal */}
                {showNewStaffModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2">
                        <div className="bg-card rounded-xl border border-border w-full max-w-md p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
                                    Add New Staff
                                </h2>
                                <button
                                    onClick={() => setShowNewStaffModal(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStaff.name}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, name: e.target.value })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Phone *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStaff.phone}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, phone: e.target.value })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">
                                            Role
                                        </label>
                                        <select
                                            value={newStaff.role}
                                            onChange={(e) =>
                                                setNewStaff({ ...newStaff, role: e.target.value })
                                            }
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        >
                                            <option value="Cashier">Cashier</option>
                                            <option value="Waiter">Waiter</option>
                                            <option value="Chef">Chef</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">
                                            Joined On
                                        </label>
                                        <input
                                            type="date"
                                            value={newStaff.joined}
                                            onChange={(e) =>
                                                setNewStaff({ ...newStaff, joined: e.target.value })
                                            }
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Salary (₹ / month) *
                                    </label>
                                    <input
                                        type="number"
                                        value={newStaff.salary}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, salary: e.target.value })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Aadhar Number
                                    </label>
                                    <input
                                        type="text"
                                        value={newStaff.aadhar}
                                        onChange={(e) =>
                                            setNewStaff({
                                                ...newStaff,
                                                aadhar: formatAadhar(e.target.value),
                                            })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        placeholder="1234 5678 9012"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    onClick={() => setShowNewStaffModal(false)}
                                    className="px-3 py-2 rounded-lg text-xs sm:text-sm bg-muted text-foreground hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddStaff}
                                    className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Staff Modal */}
                {showEditModal && editingStaff && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2">
                        <div className="bg-card rounded-xl border border-border w-full max-w-md p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
                                    Edit Staff
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingStaff.name}
                                        onChange={(e) =>
                                            setEditingStaff({ ...editingStaff, name: e.target.value })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Phone *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingStaff.phone}
                                        onChange={(e) =>
                                            setEditingStaff({
                                                ...editingStaff,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">
                                            Role
                                        </label>
                                        <select
                                            value={editingStaff.role}
                                            onChange={(e) =>
                                                setEditingStaff({
                                                    ...editingStaff,
                                                    role: e.target.value,
                                                })
                                            }
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        >
                                            <option value="Cashier">Cashier</option>
                                            <option value="Waiter">Waiter</option>
                                            <option value="Chef">Chef</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5">
                                            Joined On
                                        </label>
                                        <input
                                            type="date"
                                            value={editingStaff.joinedDate}
                                            onChange={(e) =>
                                                setEditingStaff({
                                                    ...editingStaff,
                                                    joinedDate: e.target.value,
                                                })
                                            }
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Salary (₹ / month) *
                                    </label>
                                    <input
                                        type="number"
                                        value={editingStaff.salary}
                                        onChange={(e) =>
                                            setEditingStaff({
                                                ...editingStaff,
                                                salary: e.target.value,
                                            })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1.5">
                                        Aadhar Number
                                    </label>
                                    <input
                                        type="text"
                                        value={editingStaff.aadhar}
                                        onChange={(e) =>
                                            setEditingStaff({
                                                ...editingStaff,
                                                aadhar: formatAadhar(e.target.value),
                                            })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        placeholder="1234 5678 9012"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingStaff(null);
                                    }}
                                    className="px-3 py-2 rounded-lg text-xs sm:text-sm bg-muted text-foreground hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateStaff}
                                    className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffManagement;
