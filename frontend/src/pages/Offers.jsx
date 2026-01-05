import React, { useState, useEffect } from 'react';
import { Download, Plus, RefreshCw, X, Save, Edit, Trash2, Link2, FolderOpen } from 'lucide-react';
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
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-border flex-shrink-0">
          <h2 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
          >
            <X size={20} className="sm:w-[22px] sm:h-[22px]" />
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
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All / Percentage / Flat');
  const [statusFilter, setStatusFilter] = useState('All / Active / Expired');
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
    description: ''
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCouponSelectModal, setShowCouponSelectModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [assignOrderId, setAssignOrderId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Load coupons and categories from backend on component mount
  useEffect(() => {
    loadCoupons();
    loadCategories();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      console.log('Loading coupons...');
      const response = await api.get('/coupons/', {
        params: { skip: 0, limit: 100 }
      });

      console.log('Coupons response:', response.data);
      const couponData = response.data || [];
      setCoupons(Array.isArray(couponData) ? couponData : []);
    } catch (error) {
      console.error('LOAD COUPONS ERROR:', error?.response?.data || error);
      if (error?.response?.status !== 401) {
        alert('Failed to load coupons. Please try again.');
      }
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Loading categories...');

      // Try the main categories endpoint
      const response = await api.get('/categories/');

      console.log('Categories API Response:', response);
      console.log('Categories data:', response.data);

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

      console.log('Processed categories:', categoryData);
      setCategories(Array.isArray(categoryData) ? categoryData : []);

      if (Array.isArray(categoryData) && categoryData.length > 0) {
        console.log(`✓ Successfully loaded ${categoryData.length} categories`);
      } else {
        console.warn('⚠ No categories found in response');
      }
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
          console.log('Alternative endpoint response:', altResponse.data);
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

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : 1,
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

      console.log('Sending payload:', payload);

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

      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          const errors = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
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
    await loadCoupons();
    alert('Coupons synced successfully!');
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

  const handleAssign = (coupon) => {
    if (!canAssignCoupon(coupon)) {
      alert('This coupon is inactive or expired and cannot be assigned.');
      return;
    }
    setSelectedCoupon(coupon);
    setShowAssignModal(true);
  };

  const handleAssignToOrder = async () => {
    if (!assignOrderId) {
      alert('Please enter an order ID');
      return;
    }

    if (!canAssignCoupon(selectedCoupon)) {
      alert('This coupon is inactive or expired and cannot be assigned.');
      return;
    }

    try {
      await api.post(`/coupons/${selectedCoupon.id}/assign-order`, {
        order_id: parseInt(assignOrderId)
      });
      alert(`Coupon ${selectedCoupon.code} assigned to Order #${assignOrderId}`);
      setShowAssignModal(false);
      setAssignOrderId('');
    } catch (error) {
      console.error('ASSIGN ORDER ERROR:', error?.response?.data || error);
      const msg = error?.response?.data?.detail || 'Failed to assign coupon to order';
      alert(msg);
    }
  };

  const handleQuickAssignOrder = () => {
    if (coupons.length === 0) {
      alert('Please create a coupon first');
      return;
    }

    const couponCode = window.prompt('Enter coupon code to assign:');
    if (!couponCode) return;

    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!coupon) {
      alert('Coupon not found');
      return;
    }

    if (!canAssignCoupon(coupon)) {
      alert('This coupon is inactive or expired and cannot be assigned.');
      return;
    }

    const orderId = window.prompt('Enter Order ID:');
    if (!orderId) return;

    api.post(`/coupons/${coupon.id}/assign-order`, {
      order_id: parseInt(orderId)
    })
    .then(() => {
      alert(`✓ Coupon "${coupon.code}" assigned to Order #${orderId}`);
    })
    .catch((error) => {
      console.error('QUICK ASSIGN ORDER ERROR:', error);
      const msg = error?.response?.data?.detail || 'Failed to assign coupon to order';
      alert(msg);
    });
  };

  const handleQuickAssignCategories = async () => {
    if (coupons.length === 0) {
      alert('Please create a coupon first');
      return;
    }

    console.log('Reloading categories before showing modal...');
    await loadCategories();

    console.log('Current categories state:', categories);

    if (categories.length === 0) {
      alert('No categories available. Please create categories in the Products section first.');
      return;
    }

    setShowCouponSelectModal(true);
  };

  const handleSelectCouponForCategories = (coupon) => {
    if (!canAssignCoupon(coupon)) {
      alert('This coupon is inactive or expired and cannot be assigned to categories.');
      return;
    }
    console.log('Selected coupon:', coupon);
    console.log('Available categories:', categories);
    setSelectedCoupon(coupon);
    setShowCouponSelectModal(false);
    setSelectedCategoryIds([]);
    setShowCategoryModal(true);
  };

  const handleSaveCategories = async () => {
    if (selectedCategoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }

    if (!selectedCoupon) {
      alert('No coupon selected');
      return;
    }

    if (!canAssignCoupon(selectedCoupon)) {
      alert('This coupon is inactive or expired and cannot be assigned to categories.');
      return;
    }

    try {
      console.log('Assigning categories:', selectedCategoryIds, 'to coupon:', selectedCoupon.id);

      await api.post(`/coupons/${selectedCoupon.id}/assign-categories`, {
        category_ids: selectedCategoryIds
      });

      const selectedCategoryNames = categories
        .filter(cat => selectedCategoryIds.includes(cat.id))
        .map(cat => cat.name)
        .join(', ');

      alert(`✓ Coupon "${selectedCoupon.code}" assigned to categories:\n${selectedCategoryNames}`);
      setShowCategoryModal(false);
      setSelectedCategoryIds([]);
      setSelectedCoupon(null);
    } catch (error) {
      console.error('ASSIGN CATEGORIES ERROR:', error?.response?.data || error);
      const errorMsg = error?.response?.data?.detail || 'Failed to assign categories';
      alert(`Error: ${errorMsg}`);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = () => {
    const headers = ['ID', 'Code', 'Type', 'Value', 'Min Order', 'Max Uses', 'Valid From', 'Valid Until', 'Status'];

    const csvRows = [
      headers.join(','),
      ...filteredCoupons.map(coupon => [
        coupon.id,
        `"${coupon.code}"`,
        coupon.discount_type,
        coupon.discount_value,
        coupon.min_order_amount || 0,
        coupon.max_uses || 0,
        coupon.valid_from || '',
        coupon.valid_until || '',
        coupon.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `coupons_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Export completed! CSV file downloaded.');
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

    const matchesType = typeFilter === 'All / Percentage / Flat' ||
                       (typeFilter === 'Percentage' && coupon.discount_type === 'percentage') ||
                       (typeFilter === 'Flat' && coupon.discount_type === 'flat');

    const isExpired = isCouponExpired(coupon);
    const displayStatus = !coupon.is_active ? 'Inactive' : (isExpired ? 'Expired' : 'Active');
    const matchesStatus = statusFilter === 'All / Active / Expired' || displayStatus === statusFilter;

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
                step="0.01"
                min="0"
                value={formData.min_order_amount}
                onChange={(e) => handleInputChange('min_order_amount', e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base focus:border-teal-600"
                placeholder="e.g., 299"
              />
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
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveCoupon}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-teal-700 transition-colors order-1 sm:order-2"
            >
              <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>{editingId !== null ? 'Update Coupon' : 'Save Coupon'}</span>
            </button>
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Required fields. Create percentage or flat discount coupons with validity periods.
          </p>
        </div>
      </Modal>

      {/* Assign to Order Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Coupon ${selectedCoupon?.code || ''}`}
        maxWidth="max-w-sm sm:max-w-md"
      >
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Enter Order ID"
            value={assignOrderId}
            onChange={(e) => setAssignOrderId(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm sm:text-base text-foreground focus:border-teal-600 outline-none"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowAssignModal(false)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignToOrder}
              disabled={!canAssignCoupon(selectedCoupon)}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm sm:text-base hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Coupon Selection Modal for Category Assignment */}
      <Modal
        isOpen={showCouponSelectModal}
        onClose={() => setShowCouponSelectModal(false)}
        title="Select Coupon"
        maxWidth="max-w-sm sm:max-w-md"
      >
        <div className="space-y-3">
          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No coupons available</p>
              <p className="text-muted-foreground text-xs mt-2">Create a coupon first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {coupons.map((coupon) => {
                const disabled = !canAssignCoupon(coupon);
                return (
                  <button
                    key={coupon.id}
                    onClick={() => !disabled && handleSelectCouponForCategories(coupon)}
                    disabled={disabled}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      disabled
                        ? 'bg-muted/60 cursor-not-allowed opacity-60'
                        : 'bg-muted hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0"><p className="text-foreground font-semibold text-sm mb-0.5">{coupon.code}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}% off`
                        : `₹${coupon.discount_value} off`}
                      {coupon.description ? ` • ${coupon.description}` : ''}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        coupon.is_active ? 'bg-teal-600 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowCouponSelectModal(false)}
        className="w-full py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base hover:bg-secondary transition-colors"
      >
        Cancel
      </button>
    </div>
  </Modal>

  {/* Category Selection Modal */}
  <Modal
    isOpen={showCategoryModal}
    onClose={() => {
      setShowCategoryModal(false);
      setSelectedCategoryIds([]);
      setSelectedCoupon(null);
    }}
    title={`Assign ${selectedCoupon?.code || ''} to Categories`}
    maxWidth="max-w-sm sm:max-w-md"
  >
    <div className="space-y-4">
      {categoriesLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No categories available</p>
          <p className="text-muted-foreground text-xs mt-2">
            Create categories first in the Products section
          </p>
          <button
            onClick={loadCategories}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 accent-teal-600"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-foreground text-sm sm:text-base font-medium block">
                    {cat.name}
                  </span>
                  <span className="text-muted-foreground text-xs block mt-0.5">
                    {cat.description}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {selectedCategoryIds.length === 0 && (
            <div className="bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
              <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                {selectedCategoryIds.length} category selected
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => {
                setShowCategoryModal(false);
                setSelectedCategoryIds([]);
                setSelectedCoupon(null);
              }}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCategories}
              disabled={selectedCategoryIds.length === 0 || categoriesLoading}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm sm:text-base hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign to {selectedCategoryIds.length === 0 ? 'Category' : 'Categories'}
            </button>
          </div>
        </>
      )}
    </div>
  </Modal>

  {/* Header */}
  <div className="p-3 sm:p-4 lg:p-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <h1 className="text-foreground text-lg sm:text-xl lg:text-2xl font-semibold">
        Offers & Coupons
      </h1>
      <div className="flex gap-2 flex-wrap w-full sm:w-auto">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm lg:text-base hover:bg-teal-700 transition-colors"
        >
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Export</span>
        </button>
        <button
          onClick={handleNewCoupon}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm lg:text-base font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>New Coupon</span>
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">

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
              <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-xs sm:text-sm lg:text-base focus:border-teal-600"
              >
                <option>All / Percentage / Flat</option>
                <option>Percentage</option>
                <option>Flat</option>
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs sm:text-sm mb-1.5 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-xs sm:text-sm lg:text-base focus:border-teal-600"
              >
                <option>All / Active / Expired</option>
                <option>Active</option>
                <option>Expired</option>
              </select>
            </div>
          </div>

          {/* Coupons Table - Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Code</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Type</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Value</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Min Order</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Used/Max</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Validity</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Status</th>
                  <th className="text-muted-foreground text-left py-3 px-2 text-xs font-medium">Actions</th>
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
                        {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '-'}
                      </td>
                      <td className="text-foreground py-3 px-2 text-sm">
                        {coupon.used_count || 0}/{coupon.max_uses || 0}
                      </td>
                      <td className="text-foreground py-3 px-2 text-xs whitespace-nowrap">
                        {formatValidity(coupon)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2.5 py-1 text-white text-xs rounded-full ${
                            displayStatus === 'Active'
                              ? 'bg-teal-600'
                              : 'bg-red-500'
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
                            onClick={() => handleAssign(coupon)}
                            disabled={!assignable}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors ${
                              assignable
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'bg-slate-600 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Link2 size={12} />
                            <span>Assign</span>
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
                        className={`px-2 py-1 text-white text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                          displayStatus === 'Active' ? 'bg-teal-600' : 'bg-red-500'
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
                      <span className="text-muted-foreground">Min Order</span>
                      <span className="text-foreground">
                        {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used</span>
                      <span className="text-foreground">
                        {coupon.used_count || 0}/{coupon.max_uses || 0}
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
                      onClick={() => handleAssign(coupon)}
                      disabled={!assignable}
                      className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors ${
                        assignable
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-slate-600 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Link2 size={12} />
                      <span className="hidden sm:inline">Assign</span>
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

        {/* Quick Assign Section */}
        <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <h2 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold mb-4">Quick Assign</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <Link2 size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground text-xs sm:text-sm lg:text-base font-medium mb-1">
                      Assign Coupon to Order
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Link coupon to a specific order ID quickly
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleQuickAssignOrder}
                  disabled={coupons.length === 0}
                  className="w-full sm:w-auto px-3 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <FolderOpen size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground text-xs sm:text-sm lg:text-base font-medium mb-1">
                      Assign to Categories
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {categoriesLoading
                        ? 'Loading categories...'
                        : categories.length > 0
                          ? `${categories.length} categories available`
                          : 'No categories available'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleQuickAssignCategories}
                  disabled={categoriesLoading}
                  className="w-full sm:w-auto px-3 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Choose
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>);
}
export default Offers;