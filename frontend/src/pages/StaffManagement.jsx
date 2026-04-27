import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    UserPlus,
    Edit2,
    Trash2,
    RotateCw,
    Filter,
    Save,
    PlusCircle,
    X,
    Download,
    AlertCircle,
    FileText,
    ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import axios_api from "../api/axios";

// Removed local API_BASE_URL and getAuthHeaders - using shared axios instance

const StaffManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Active');
    const [showSearch, setShowSearch] = useState(false);
    const [showNewStaffModal, setShowNewStaffModal] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = React.useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setIsExportOpen(false);
            }
        };
        if (isExportOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExportOpen]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [newStaff, setNewStaff] = useState({
        name: '',
        phone: '',
        role: 'Cashier',
        salary: '',
        joined: new Date().toISOString().split('T')[0],
        aadhar: '',
    });

    const [staff, setStaff] = useState([]);
    const [upcomingSalaries, setUpcomingSalaries] = useState([]);
    const [removingIds, setRemovingIds] = useState(new Set()); // ✅ Track which items are being removed

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

    useEffect(() => {
        fetchStaff();
        fetchUpcomingSalaries();
    }, []);

    const fetchStaff = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};

            const trimmedSearch = searchQuery?.trim() || '';
            if (trimmedSearch) {
                params.search = trimmedSearch;
            }

            if (roleFilter && roleFilter !== 'All') {
                params.role = roleFilter;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            console.log('📡 Fetching staff with params:', params);

            const response = await axios_api.get('/staff', { params });
            const data = response.data;
            console.log('✅ Received staff data:', data);

            const staffArray = Array.isArray(data) ? data : (data.data || []);

            if (!Array.isArray(staffArray)) {
                console.error('⚠️ Unexpected data format:', data);
                setStaff([]);
                return;
            }

            const transformedStaff = staffArray.map(member => ({
                id: member.id,
                name: member.name,
                phone: member.phone,
                role: member.role,
                salary: `₹${member.salary.toLocaleString('en-IN')} / month`,
                salaryAmount: member.salary,
                joined: new Date(member.joined).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }),
                joinedDate: member.joined.split('T')[0],
                avatar: member.name.charAt(0).toUpperCase(),
                color: getRandomColor(),
                status: member.status,
                aadhar: member.aadhar || '',
            }));

            console.log('✅ Transformed staff:', transformedStaff.length, 'members');
            setStaff(transformedStaff);
        } catch (err) {
            console.error('❌ Error fetching staff:', err);
            setError(err.message);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, roleFilter, statusFilter]);

    const fetchUpcomingSalaries = async () => {
        try {
            console.log('📡 Fetching upcoming salaries...');
            const response = await axios_api.get('/staff/upcoming-salaries');
            const data = response.data;
            console.log('✅ Upcoming salaries data:', data);

            const transformedSalaries = data.map(entry => ({
                id: entry.id,
                staffId: entry.staff_id || entry.id,
                name: entry.name,
                role: entry.role,
                avatar: entry.name.charAt(0).toUpperCase(),
                color: getRandomColor(),
                amount: `₹${entry.salary.toLocaleString('en-IN')}`,
                amountRaw: entry.salary,
                dueDate: entry.due_date || entry.dueDate,
                category: 'Salaries & Wages',
            }));

            setUpcomingSalaries(transformedSalaries);

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
        } catch (err) {
            console.error('❌ Error fetching upcoming salaries:', err);
        }
    };

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

    const handleExportExcel = () => {
        // Prepare data for Excel
        const data = staff.map((s, index) => ({
            '#': index + 1,
            'Name': s.name,
            'Phone': s.phone,
            'Role': s.role,
            'Salary': s.salaryAmount,
            'Joined Date': s.joinedDate,
            'Status': s.status,
            'Aadhar': s.aadhar || '-'
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'StaffMembers');

        // Save file
        XLSX.writeFile(wb, `staff_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportOpen(false);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add header
        doc.setFontSize(22);
        doc.setTextColor(13, 148, 136); // Teal-600
        doc.text('VayuPOS - Staff Directory', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Staff Members: ${staff.length}`, 14, 35);

        // Define table columns
        const tableColumn = ["#", "Name", "Phone", "Role", "Salary", "Joined", "Status"];
        const tableRows = staff.map((s, index) => [
            index + 1,
            s.name,
            s.phone,
            s.role,
            `Rs. ${s.salaryAmount.toLocaleString('en-IN')}`,
            s.joinedDate,
            s.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: {
                fillColor: [13, 148, 136],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold'
            },
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 253, 250] },
            margin: { top: 45 },
        });

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        doc.save(`staff_report_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExportOpen(false);
    };

    const handleAddStaff = async () => {
        if (!newStaff.name || !newStaff.phone || !newStaff.salary) {
            alert('Please fill all required fields');
            return;
        }

        if (newStaff.aadhar && newStaff.aadhar.replace(/\s/g, '').length !== 12) {
            alert('Please enter a valid 12-digit Aadhar number');
            return;
        }

        try {
            setLoading(true);
            const salaryNum = parseFloat(newStaff.salary.toString().replace(/[^0-9.]/g, '')) || 0;

            if (salaryNum <= 100) {
                alert('Salary amount must be greater than ₹100.');
                setLoading(false);
                return;
            }

            const requestBody = {
                name: newStaff.name,
                phone: newStaff.phone,
                role: newStaff.role,
                salary: salaryNum,
                joined: new Date(newStaff.joined).toISOString(),
                aadhar: newStaff.aadhar.replace(/\s/g, '') || null,
            };

            console.log('➕ Adding staff:', requestBody);

            const response = await axios_api.post('/staff', requestBody);
            const data = response.data;
            console.log('✅ Staff added:', data);

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

            fetchStaff();
            fetchUpcomingSalaries();
        } catch (err) {
            alert(`Error adding staff: ${err.message}`);
            console.error('Error adding staff:', err);
        } finally {
            setLoading(false);
        }
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

    const handleUpdateStaff = async () => {
        if (!editingStaff.name || !editingStaff.phone || !editingStaff.salary) {
            alert('Please fill all required fields');
            return;
        }

        if (editingStaff.aadhar && editingStaff.aadhar.replace(/\s/g, '').length !== 12) {
            alert('Please enter a valid 12-digit Aadhar number');
            return;
        }

        try {
            setLoading(true);
            const salaryNum = parseFloat(editingStaff.salary.toString().replace(/[^0-9.]/g, '')) || 0;

            if (salaryNum <= 100) {
                alert('Salary amount must be greater than ₹100.');
                setLoading(false);
                return;
            }

            const requestBody = {
                name: editingStaff.name,
                phone: editingStaff.phone,
                role: editingStaff.role,
                salary: salaryNum,
                aadhar: editingStaff.aadhar.replace(/\s/g, '') || null,
                status: editingStaff.status,
            };

            console.log('✏️ Updating staff:', requestBody);

            const response = await axios_api.put(`/staff/${editingStaff.id}`, requestBody);

            setShowEditModal(false);
            setEditingStaff(null);
            alert('Staff member updated successfully!');

            fetchStaff();
        } catch (err) {
            alert(`Error updating staff: ${err.message}`);
            console.error('Error updating staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                setLoading(true);

                await axios_api.delete(`/staff/${id}`);

                alert('Staff member deleted successfully!');

                fetchStaff();
                fetchUpcomingSalaries();
            } catch (err) {
                alert(`Error deleting staff: ${err.message}`);
                console.error('Error deleting staff:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    // ✅ FIXED: Handle adding salary with proper optimistic update
    const handleAddSalary = async (staffId) => {
        const salary = upcomingSalaries.find(s => s.staffId === staffId);
        if (!salary) return;

        console.log('🔄 Adding salary for staffId:', staffId);

        // ✅ Mark as removing to hide from UI immediately
        setRemovingIds(prev => new Set([...prev, staffId]));

        try {
            const response = await axios_api.post(`/staff/salaries/${staffId}/add`);
            const message = response.data;
            console.log('✅ Salary added successfully');
            alert(typeof message === 'string' ? message : 'Salary entry added successfully!');

            // Refresh from server to get updated list
            await fetchUpcomingSalaries();

        } catch (err) {
            console.error('❌ Error adding salary:', err);
            // ✅ If error, remove from removing set to show it again
            setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(staffId);
                return newSet;
            });
            alert(`Error adding salary: ${err.message}`);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setRoleFilter('All');
        setStatusFilter('Active');
        setTimeout(() => fetchStaff(), 0);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchStaff();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchStaff]);

    const filteredStaff = staff;
    const hasActiveFilters = searchQuery.trim() || roleFilter !== 'All' || statusFilter !== 'Active';
    const showNoResults = !loading && filteredStaff.length === 0 && !error;

    // ✅ Filter out salaries that are being removed
    const visibleUpcomingSalaries = upcomingSalaries.filter(s => !removingIds.has(s.staffId));

    if (loading && staff.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <RotateCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-lg text-foreground">Loading staff...</p>
                </div>
            </div>
        );
    }

    if (error && staff.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Staff</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => fetchStaff()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">Staff</h1>
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none" ref={exportRef}>
                            <button
                                onClick={() => setIsExportOpen(!isExportOpen)}
                                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-xs sm:text-sm"
                            >
                                <Download size={14} className="sm:w-4 sm:h-4" />
                                <span>Export</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isExportOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        <button
                                            onClick={handleExportPDF}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                                        >
                                            <FileText size={16} className="text-red-500" />
                                            <span>Export as PDF</span>
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                                        >
                                            <Download size={16} className="text-green-500" />
                                            <span>Export as Excel</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
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

                    <div className="hidden md:grid grid-cols-[2fr,1.5fr,1.5fr,1.5fr,1fr,1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-primary/10 dark:bg-transparent">
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
                                    {member.salaryAmount <= 100 ? (
                                        <div className="flex items-center gap-1 xl:justify-start justify-end text-red-500 font-medium">
                                            {member.salary}
                                            <AlertCircle className="w-4 h-4" title="Invalid Salary: Must be > ₹100" />
                                        </div>
                                    ) : (
                                        member.salary
                                    )}
                                </div>

                                <div className="text-sm text-card-foreground md:text-left text-right">
                                    {member.joined}
                                </div>

                                <div className="flex items-center md:justify-start justify-end">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${member.status === 'Active'
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

                        {showNoResults && (
                            <div className="py-8 text-center">
                                <div className="text-muted-foreground mb-2">
                                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                </div>
                                <p className="text-sm font-medium text-card-foreground mb-1">
                                    No staff matching filters
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {hasActiveFilters
                                        ? 'Try adjusting your search criteria or filters'
                                        : 'Click "New Staff" to add your first team member'
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
                </div>

                {/* Upcoming Salary Entries */}
                <div className="mt-6">
                    <div className="bg-card rounded-xl border border-border p-4 lg:p-6 w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-card-foreground">
                                Upcoming Salary Entries
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {visibleUpcomingSalaries.map((entry) => (
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
                                        onClick={() => handleAddSalary(entry.staffId)}
                                        disabled={removingIds.has(entry.staffId)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs sm:text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>{removingIds.has(entry.staffId) ? 'Adding...' : 'Add Now'}</span>
                                    </button>
                                </div>
                            ))}

                            {visibleUpcomingSalaries.length === 0 && !loading && (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    No upcoming salary entries.
                                </div>
                            )}
                        </div>
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
                                    min="101"
                                    value={newStaff.salary}
                                    onChange={(e) =>
                                        setNewStaff({ ...newStaff, salary: e.target.value.replace(/[^0-9]/g, '') })
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
                                disabled={loading}
                                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Saving...' : 'Save'}</span>
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
                                        Status
                                    </label>
                                    <select
                                        value={editingStaff.status}
                                        onChange={(e) =>
                                            setEditingStaff({
                                                ...editingStaff,
                                                status: e.target.value,
                                            })
                                        }
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5">
                                    Salary (₹ / month) *
                                </label>
                                <input
                                    type="number"
                                    min="101"
                                    value={editingStaff.salary}
                                    onChange={(e) =>
                                        setEditingStaff({
                                            ...editingStaff,
                                            salary: e.target.value.replace(/[^0-9]/g, ''),
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
                                disabled={loading}
                                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;