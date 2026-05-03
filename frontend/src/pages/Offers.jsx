import React, { useState, useEffect } from 'react';
import { Download, Plus, RefreshCw, X, Save, Edit, Trash2, Link2, FolderOpen, ChevronDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

// Reusable Modal Component
function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-card rounded-xl shadow-2xl w-full ${maxWidth} my-8 animate-slideUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-border shrink-0">
          <h2 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
          >
            <X size={20} className="sm:w-5.5 sm:h-5.5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    product_id: '',
    description: ''
  });

  // Load coupons and categories from backend on component mount
  useEffect(() => {
    loadCoupons();
    loadCategories();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCoupons = async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true);
      const response = await api.get('/coupons/', {
        params: { skip: 0, limit: 100 }
      });
      const couponData = response.data || [];
      setCoupons(Array.isArray(couponData) ? couponData : []);
      setLoadError(null); // clear any previous error
    } catch (error) {
      console.error('LOAD COUPONS ERROR:', error?.response?.data || error);
      if (error?.response?.status === 401) {
        // Auth error — don't retry
        setCoupons([]);
        return;
      }
      if (!isRetry) {
        // Silent auto-retry after 1.2s (gives server time to finish hot-reload)
        setTimeout(() => loadCoupons(true), 1200);
      } else {
        // Retry also failed — show inline error, no alert popup
        setCoupons([]);
        setLoadError('Could not load coupons. Check your connection or try syncing.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);

      // Try the main categories endpoint
      const response = await api.get('/categories/');

      let categoryData = response.data;

      // Handle different response formats
      if (categoryData && typeof categoryData === 'object') {
        if (categoryData.categories && Array.isArray(categoryData.categories)) {
          categoryData = categoryData.categories;
        } else if (categoryData.items && Array.isArray(categoryData.items)) {
          categoryData = categoryData.items;
        } else if (categoryData.data && Array.isArray(categoryData.data)) {
          categoryData = categoryData.data;
        } else if (!Array.isArray(categoryData)) {
          console.warn('Unexpected categories format:', categoryData);
          categoryData = [];
        }
      } else {
        categoryData = [];
      }

      setCategories(Array.isArray(categoryData) ? categoryData : []);

    } catch (error) {
      console.error('LOAD CATEGORIES ERROR:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });

      if (error?.response?.status === 404) {
        console.warn('Categories endpoint not found. Trying alternative endpoint...');
        try {
          const altResponse = await api.get('/products/categories');
          const altData = Array.isArray(altResponse.data) ? altResponse.data : [];
          setCategories(altData);
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get('/products/', { params: { limit: 1000 } });
      const productData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      console.error('LOAD PRODUCTS ERROR:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      product_id: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleNewCoupon = () => {
    resetForm();
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code || !formData.discount_value) {
      alert('Please fill in all required fields (Code, Discount Value)');
      return;
    }

    // Validate min order amount must be a multiple of 50
    const minOrderVal = formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0;
    if (minOrderVal !== 0 && minOrderVal % 50 !== 0) {
      const lower = Math.floor(minOrderVal / 50) * 50;
      const upper = lower + 50;
      alert(`Minimum order must be a rounded value (₹100, ₹200, ₹300 etc.)\nYou entered ₹${minOrderVal}. Did you mean ₹${lower} or ₹${upper}?`);
      return;
    }

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: minOrderVal,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : 1,
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
      };

      if (formData.valid_from) {
        payload.valid_from = new Date(formData.valid_from).toISOString();
      }

      if (formData.valid_until) {
        payload.valid_until = new Date(formData.valid_until).toISOString();
      }

      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (editingId !== null) {
        const response = await api.put(`/coupons/${editingId}`, {
          ...payload,
          is_active: true
        });
        setCoupons(coupons.map(c => c.id === editingId ? response.data : c));
        alert('Coupon updated successfully!');
      } else {
        const response = await api.post('/coupons/', payload);
        setCoupons([...coupons, response.data]);
        alert('Coupon created successfully!');
      }

      resetForm();
      setShowCouponModal(false);
    } catch (error) {
      console.error('SAVE COUPON ERROR:', error?.response?.data || error);

      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;

      if (status === 409) {
        alert(`❌ Duplicate Code: ${detail || 'A coupon with this code already exists. Please use a different code.'}`);
      } else if (detail) {
        if (Array.isArray(detail)) {
          const errors = detail.map(err => `• ${err.loc?.slice(-1)[0] || ''}: ${err.msg}`).join('\n');
          alert(`Validation Error:\n${errors}`);
        } else {
          alert(`Error: ${detail}`);
        }
      } else {
        alert('Failed to save coupon. Check console for details.');
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowCouponModal(false);
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      product_id: coupon.product_id ? coupon.product_id.toString() : '',
      description: coupon.description || ''
    });
    setEditingId(coupon.id);
    setShowCouponModal(true);
  };

  // soft delete in UI
  const handleDelete = async (id) => {
    if (!window.confirm('Disable this coupon? Used coupons will be marked inactive.')) {
      return;
    }

    try {
      await api.delete(`/coupons/${id}`);

      setCoupons(prev =>
        prev.some(c => c.id === id)
          ? prev.map(c =>
            c.id === id ? { ...c, is_active: false } : c
          )
          : prev
      );

      alert('Coupon disabled (or removed if never used).');
    } catch (error) {
      console.error('DELETE COUPON ERROR:', error?.response?.data || error);
      alert('Failed to disable coupon');
    }
  };

  const handleSync = async () => {
    setLoadError(null);
    await loadCoupons();
  };

  const isCouponExpired = (coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  // helper: only active and not expired coupons can be assigned
  const canAssignCoupon = (coupon) => {
    if (!coupon) return false;
    const expired = isCouponExpired(coupon);
    return coupon.is_active && !expired;
  };

  const handleExportExcel = () => {
    const csvRows = [];
    csvRows.push(["Code", "Type", "Value", "Min Order", "Used", "Max Uses", "Valid From", "Valid Until", "Applied To"].join(","));

    coupons.forEach((coupon) => {
      csvRows.push(
        [
          `"${coupon.code}"`,
          `"${coupon.discount_type}"`,
          coupon.discount_value,
          coupon.min_order_amount,
          coupon.used_count,
          coupon.max_uses,
          coupon.valid_from,
          coupon.valid_until,
          `"${coupon.product_id ? 'Product ID: ' + coupon.product_id : 'Entire Order'}"`
        ].join(",")
      );
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `coupons_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text('VayuPOS - Coupons & Offers', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Code", "Type", "Value", "Min Order", "Status", "Applied To"];
    const tableRows = coupons.map((c) => [
      c.code,
      c.discount_type,
      c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs. ${c.discount_value}`,
      `Rs. ${c.min_order_amount}`,
      c.is_active ? 'Active' : 'Inactive',
      c.product_id ? 'Specific Product' : 'Entire Order'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      margin: { top: 40 },
    });

    doc.save(`coupons_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportOpen(false);
  };



  const formatValidity = (coupon) => {
    if (!coupon.valid_from && !coupon.valid_until) return 'No expiration';

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (coupon.valid_from && coupon.valid_until) {
      return `${formatDate(coupon.valid_from)} – ${formatDate(coupon.valid_until)}`;
    } else if (coupon.valid_from) {
      return `From ${formatDate(coupon.valid_from)}`;
    } else {
      return `Until ${formatDate(coupon.valid_until)}`;
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'All' ||
      (typeFilter === 'Percentage' && coupon.discount_type === 'percentage') ||
      (typeFilter === 'Flat' && coupon.discount_type === 'flat');

    const isExpired = isCouponExpired(coupon);
    const displayStatus = !coupon.is_active ? 'Inactive' : (isExpired ? 'Expired' : 'Active');
    const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      {/* Create/Edit Coupon Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={handleCancel}
        title={editingId !== null ? 'Edit Coupon' : 'Create New Coupon'}
        maxWidth="max-w-md sm:max-w-xl lg:max-w-2xl xl:max-w-3xl"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Coupon Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
              placeholder="e.g., DIW50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) => handleInputChange('discount_type', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
                {formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.discount_value}
                onChange={(e) => handleInputChange('discount_value', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
                placeholder={formData.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 50'}
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
              Apply To Product {productsLoading ? "(Loading products...)" : "(Optional)"}
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => handleInputChange('product_id', e.target.value)}
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600 appearance-none cursor-pointer"
            >
              <option value="">All Products (Entire Order)</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Valid From</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => handleInputChange('valid_from', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Valid Until</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => handleInputChange('valid_until', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Min Order Amount</label>
              <input
                type="number"
                step="50"
                min="0"
                value={formData.min_order_amount}
                onChange={(e) => handleInputChange('min_order_amount', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
                placeholder="e.g., 300"
              />
              <p className="text-muted-foreground text-xs mt-1">Must be a rounded value: ₹100, ₹150, ₹200, ₹300…</p>
            </div>
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Max Uses</label>
              <input
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => handleInputChange('max_uses', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
                placeholder="e.g., 100"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none resize-y px-3 py-2 text-sm sm:text-base focus:border-teal-600"
              placeholder="Optional description about this coupon..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-muted-foreground bg-transparent rounded-lg text-sm sm:text-base hover:bg-muted transition-colors order-2 sm:order-1"
            >
              <X size={16} className="sm:w-4.5 sm:h-4.5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveCoupon}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-teal-700 transition-colors order-1 sm:order-2"
            >
              <Save size={16} className="sm:w-4.5 sm:h-4.5" />
              <span>{editingId !== null ? 'Update Coupon' : 'Save Coupon'}</span>
            </button>
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Required fields. Create percentage or flat discount coupons with validity periods.
          </p>
        </div>
      </Modal>



      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-foreground text-lg sm:text-xl lg:text-2xl font-semibold">
            Offers & Coupons
          </h1>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none" ref={exportRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm lg:text-base hover:bg-teal-700 transition-colors"
              >
                <Download size={16} className="sm:w-4.5 sm:h-4.5" />
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
              onClick={handleNewCoupon}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm lg:text-base font-medium hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
              <span>New Coupon</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-400 mx-auto">
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">

        {/* Inline error banner (replaces the blocking alert popup) */}
        {loadError && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            <span>⚠️ {loadError}</span>
            <button
              onClick={() => { setLoadError(null); loadCoupons(); }}
              className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Coupons List */}
            <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold">
                  Coupons List
                </h2>
                <button
                  onClick={handleSync}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-teal-600 text-teal-600 bg-transparent rounded-lg text-xs sm:text-sm lg:text-base hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
                >
                  <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5" />
                  <span>Sync</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
                    Search coupons
                  </label>
                  <input
                    type="text"
                    placeholder="Code or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-xs sm:text-sm lg:text-base focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-xs sm:text-sm lg:text-base focus:border-teal-600 appearance-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-xs sm:text-sm lg:text-base focus:border-teal-600 appearance-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Coupons Table - Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary/10 dark:bg-transparent border-b border-border">
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Code</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Type</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Value</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Applied To</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Min Order</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Used/Max</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Validity</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Status</th>
                      <th className="text-muted-foreground text-left py-3 px-2 text-xs font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.map((coupon) => {
                      const isExpired = isCouponExpired(coupon);
                      const displayStatus = !coupon.is_active ? 'Inactive' : (isExpired ? 'Expired' : 'Active');
                      const assignable = canAssignCoupon(coupon);

                      return (
                        <tr key={coupon.id} className="border-b border-border hover:bg-muted/50">
                          <td className="text-foreground py-3 px-2 text-sm font-semibold">
                            {coupon.code}
                          </td>
                          <td className="text-foreground py-3 px-2 text-sm capitalize">
                            {coupon.discount_type}
                          </td>
                          <td className="text-foreground py-3 px-2 text-sm">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}%`
                              : `₹${coupon.discount_value}`}
                          </td>
                          <td className="text-foreground py-3 px-2 text-sm">
                            {coupon.product_id
                              ? products.find(p => p.id === coupon.product_id)?.name || 'Product'
                              : 'Entire Order'}
                          </td>
                          <td className="text-foreground py-3 px-2 text-sm">
                            {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '-'}
                          </td>
                          <td className="text-foreground py-3 px-2 text-sm">
                            {coupon.used_count || 0} / {coupon.max_uses ? coupon.max_uses : '∞'}
                          </td>
                          <td className="text-foreground py-3 px-2 text-xs whitespace-nowrap">
                            {formatValidity(coupon)}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2.5 py-1 text-white text-xs rounded-full ${displayStatus === 'Active'
                                ? 'bg-emerald-600'
                                : displayStatus === 'Expired'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                                }`}
                            >
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleEdit(coupon)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 transition-colors"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDelete(coupon.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={12} />
                                <span>{coupon.is_active ? 'Disable' : 'Disabled'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Coupons Cards - Mobile/Tablet */}
              <div className="lg:hidden space-y-3">
                {filteredCoupons.map((coupon) => {
                  const isExpired = isCouponExpired(coupon);
                  const displayStatus = !coupon.is_active ? 'Inactive' : (isExpired ? 'Expired' : 'Active');
                  const assignable = canAssignCoupon(coupon);

                  return (
                    <div key={coupon.id} className="bg-muted rounded-lg p-3">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold text-sm mb-1 truncate">
                            {coupon.code}
                          </h3>
                          <p className="text-muted-foreground text-xs">
                            {coupon.description || 'No description'}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 text-white text-xs rounded-full whitespace-nowrap shrink-0 ${displayStatus === 'Active'
                              ? 'bg-emerald-600'
                              : displayStatus === 'Expired'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                              }`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span className="text-foreground capitalize">{coupon.discount_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value</span>
                          <span className="text-foreground font-semibold">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}%`
                              : `₹${coupon.discount_value}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Applied To</span>
                          <span className="text-foreground">
                            {coupon.product_id
                              ? products.find(p => p.id === coupon.product_id)?.name || 'Product'
                              : 'Entire Order'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Order</span>
                          <span className="text-foreground">
                            {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Used / Max</span>
                          <span className="text-foreground">
                            {coupon.used_count || 0} / {coupon.max_uses ? coupon.max_uses : '∞'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Validity</span>
                          <span className="text-foreground text-xs text-right">
                            {formatValidity(coupon)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-teal-600 text-white rounded-lg text-xs hover:bg-teal-700 transition-colors"
                        >
                          <Edit size={12} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">
                            {coupon.is_active ? 'Disable' : 'Disabled'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCoupons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                  No coupons found matching your filters.
                </div>
              )}
            </div>



          </div>
        </div>
      </div>
    </div>);
}
export default Offers;