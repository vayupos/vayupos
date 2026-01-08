import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, Eye, ArrowLeft, Minus, Tag, Trash2, Printer, X } from 'lucide-react';
import api from '../api/axios';

function POS() {
  const [selectedCustomer, setSelectedCustomer] = useState('Guest');
  const [selectedCustomerId, setSelectedCustomerId] = useState(0);
  const [notes, setNotes] = useState('');
  const [searchMenu, setSearchMenu] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [inputCoupon, setInputCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India',
  });
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Pagination states
  const [visibleRows, setVisibleRows] = useState(3);
  const itemsPerRow = 4;
  const rowsToLoadMore = 2;
  const [allMenuItems, setAllMenuItems] = useState([]);

  // Fetch categories and customers on mount
  useEffect(() => {
    fetchCategories();
    fetchCustomers();
    fetchAvailableCoupons();
  }, []);

  // Fetch menu items when category or search changes
  useEffect(() => {
    setVisibleRows(3);
    setAllMenuItems([]);

    if (categories.length > 0) {
      if (searchMenu) {
        searchMenuItems(searchMenu);
      } else {
        fetchMenuItems();
      }
    }
  }, [selectedCategory, searchMenu, categories.length]);

  // Fetch customers when search changes
  useEffect(() => {
    if (searchCustomer) {
      searchCustomers(searchCustomer);
    } else {
      fetchCustomers();
    }
  }, [searchCustomer]);

  // ---------------- API FUNCTIONS ----------------

  const addCustomer = async () => {
    if (!newCustomer.first_name) {
      alert('Please enter customer first name');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/customers/', newCustomer);
      alert(
        `Customer ${newCustomer.first_name} ${newCustomer.last_name} added successfully!`
      );
      setNewCustomer({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'India',
      });
      setShowAddCustomerModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      if (error.response?.status === 401) {
        alert('You need to be logged in to add customers. Please log in and try again.');
        setShowAddCustomerModal(false);
      } else {
        const errorDetail = error.response?.data?.detail;
        let msg = 'Failed to add customer';
        
        if (Array.isArray(errorDetail) && errorDetail.length > 0) {
          msg = errorDetail[0]?.msg || msg;
        } else if (typeof errorDetail === 'string') {
          msg = errorDetail;
        }
        
        alert(`Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/', { params: { skip: 0, limit: 100 } });
      const data = res.data;
      console.log('Categories fetched:', data);

      let categoriesArray = [];

      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (Array.isArray(data.items)) {
        categoriesArray = data.items;
      } else if (typeof data === 'object' && data.name) {
        categoriesArray = [data];
      }

      const validCategories = categoriesArray
        .map((cat) => ({
          id: cat.id,
          name: cat.name || cat.category_name || cat.title,
        }))
        .filter((cat) => cat && cat.name);

      const finalCategories = [{ id: 0, name: 'All' }, ...validCategories];
      console.log('Final categories for dropdown:', finalCategories);
      setCategories(finalCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([{ id: 0, name: 'All' }]);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      let params = { skip: 0, limit: 100 };

      if (selectedCategory !== 'All') {
        const category = categories.find((cat) => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          params.category_id = category.id;
          console.log('Fetching products for category:', category.name, 'with ID:', category.id);
        }
      }

      const res = await api.get('/products/', { params });
      const data = res.data;
      console.log('Menu items fetched:', data);

      let itemsArray = [];
      if (Array.isArray(data)) {
        itemsArray = data;
      } else if (Array.isArray(data.data)) {
        itemsArray = data.data;
      } else if (Array.isArray(data.items)) {
        itemsArray = data.items;
      } else if (typeof data === 'object' && data.id) {
        itemsArray = [data];
      }

      const validItems = itemsArray.filter(
        (item) => item && item.id && item.name && item.price !== undefined
      );

      const groupedItems = groupItemsByBaseName(validItems);

      console.log('Grouped items:', groupedItems);
      setAllMenuItems(groupedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setAllMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const searchMenuItems = async (query) => {
    try {
      setLoading(true);

      let params = { q: query, skip: 0, limit: 100 };

      if (selectedCategory !== 'All') {
        const category = categories.find((cat) => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          params.category_id = category.id;
          console.log('Searching with category filter:', category.name, 'ID:', category.id);
        }
      }

      const res = await api.get('/products/search', { params });
      const data = res.data;
      console.log('Search results:', data);

      let itemsArray = [];
      if (Array.isArray(data)) {
        itemsArray = data;
      } else if (Array.isArray(data.data)) {
        itemsArray = data.data;
      } else if (Array.isArray(data.items)) {
        itemsArray = data.items;
      }

      const validItems = itemsArray.filter(
        (item) => item && item.id && item.name && item.price !== undefined
      );

      let finalItems = validItems;
      if (selectedCategory !== 'All') {
        const category = categories.find((cat) => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          finalItems = validItems.filter((item) => {
            return (
              item.category_id === category.id ||
              item.category_name === selectedCategory ||
              item.category === selectedCategory
            );
          });
          console.log('Client-side filtered items:', finalItems);
        }
      }

      const groupedItems = groupItemsByBaseName(finalItems);

      setAllMenuItems(groupedItems);
    } catch (error) {
      console.error('Error searching menu items:', error);
      setAllMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Group items by base name (removing size info from name)
  const groupItemsByBaseName = (items) => {
    const grouped = {};

    items.forEach((item) => {
      const baseName = item.name.replace(/\s*\([^)]*\)\s*$/i, '').trim();
      const sizeMatch = item.name.match(/\(([^)]+)\)$/);
      const size = sizeMatch ? sizeMatch[1].trim() : 'Regular';

      if (!grouped[baseName]) {
        grouped[baseName] = {
          id: item.id,
          name: baseName,
          basePrice: item.price,
          image_url: item.image_url || item.image || item.image_path,
          category_id: item.category_id,
          category_name: item.category_name,
          sizes: [],
        };
      }

      grouped[baseName].sizes.push({
        name: size,
        price: item.price,
        product_id: item.id,
      });
    });

    return Object.values(grouped);
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers/', {
        params: { skip: 0, limit: 100, is_active: true }
      });
      const data = res.data;

      let customersArray = [];
      if (Array.isArray(data)) {
        customersArray = data;
      } else if (data.items && Array.isArray(data.items)) {
        customersArray = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        customersArray = data.data;
      } else if (typeof data === 'object' && data.id) {
        customersArray = [data];
      }

      const validCustomers = customersArray.filter((c) => c && c.id !== undefined);

      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }, ...validCustomers]);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
    }
  };

  const searchCustomers = async (query) => {
    try {
      const res = await api.get('/customers/search', {
        params: { q: query }
      });
      const data = res.data;

      let customersArray = [];
      if (Array.isArray(data)) {
        customersArray = data;
      } else if (data.items && Array.isArray(data.items)) {
        customersArray = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        customersArray = data.data;
      }

      const validCustomers = customersArray.filter((c) => c && c.id !== undefined);

      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }, ...validCustomers]);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
    }
  };

  // ---------------- COUPON FUNCTIONS (BACKEND) ----------------

  // ✅ FIXED: Fetch Available Coupons from Backend API with proper field mapping
  const fetchAvailableCoupons = async () => {
    try {
      setLoadingCoupons(true);
      console.log('🎫 Fetching coupons from backend...');
      
      const res = await api.get('/coupons/available');
      console.log('📦 Raw coupon response:', res);
      console.log('📊 Coupon response data:', res.data);
      
      // Handle different response structures
      let couponsData = [];
      
      // Check if backend returns {eligible: [...], ineligible: [...]}
      if (res.data.eligible && Array.isArray(res.data.eligible)) {
        couponsData = res.data.eligible;
        console.log('✅ Coupons extracted from eligible property:', couponsData);
      } else if (Array.isArray(res.data)) {
        couponsData = res.data;
        console.log('✅ Coupons extracted from array:', couponsData);
      } else if (res.data.data && Array.isArray(res.data.data)) {
        couponsData = res.data.data;
        console.log('✅ Coupons extracted from data property:', couponsData);
      } else if (res.data.items && Array.isArray(res.data.items)) {
        couponsData = res.data.items;
        console.log('✅ Coupons extracted from items property:', couponsData);
      } else if (res.data.coupons && Array.isArray(res.data.coupons)) {
        couponsData = res.data.coupons;
        console.log('✅ Coupons extracted from coupons property:', couponsData);
      } else {
        console.warn('⚠️ Unexpected coupon response structure:', res.data);
      }
      
      // ✅ FIXED: Map backend fields correctly to frontend format
      const normalizedCoupons = couponsData.map(coupon => ({
        id: coupon.id,
        code: coupon.code || coupon.coupon_code || '',
        discount: coupon.discount_value || coupon.discount || coupon.discount_amount || 0,
        type: coupon.discount_type || coupon.type || 'percentage',
        description: coupon.description || coupon.desc || `${coupon.discount_value || coupon.discount || 0}${(coupon.discount_type || coupon.type) === 'percentage' ? '%' : '₹'} off`,
        min_order: coupon.min_order_amount || coupon.min_order || coupon.minOrder || coupon.minimum_order_amount || 0,
        is_active: coupon.is_active !== undefined ? coupon.is_active : true,
        valid_from: coupon.valid_from,
        valid_to: coupon.valid_to
      }));
      
      console.log('🔄 Normalized coupons:', normalizedCoupons);
      
      // Filter only active coupons
      const activeCoupons = normalizedCoupons.filter(c => c.is_active && c.code);
      console.log('✅ Active coupons:', activeCoupons);
      
      if (activeCoupons.length > 0) {
        setAvailableCoupons(activeCoupons);
        console.log('🎉 Successfully loaded', activeCoupons.length, 'coupons from backend');
      } else {
        console.warn('⚠️ No active coupons found in backend response');
        setAvailableCoupons([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching available coupons:', error);
      console.error('📋 Error details:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      console.error('🔗 Request URL:', error.config?.url);
      console.error('🌐 Full URL:', error.config?.baseURL + error.config?.url);
      
      setAvailableCoupons([]);
      
      // Alert user if there's a connection issue
      if (error.response?.status === 404) {
        console.warn('⚠️ Coupon endpoint not found (404) - Check API configuration');
        console.warn('Expected endpoint: /coupons/available');
      } else if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized (401) - User might need to login');
      } else if (error.response?.status === 500) {
        console.error('⚠️ Server error (500) - Backend issue');
      }
    } finally {
      setLoadingCoupons(false);
    }
  };

  // ✅ FIXED v2: Validate Coupon - Try BOTH query param AND body approaches
  const validateCoupon = async (couponCode) => {
    try {
      console.log('🔍 Validating coupon:', couponCode);
      console.log('💰 Current order subtotal:', subtotal);
      
      let res;
      let validationError = null;
      
      // ✅ TRY APPROACH 1: Subtotal in body (most common FastAPI pattern)
      try {
        console.log('📤 Attempt 1: Sending subtotal in request body');
        res = await api.post('/coupons/validate', { 
          code: couponCode,
          subtotal: subtotal
        });
        console.log('✅ Approach 1 SUCCESS:', res.data);
      } catch (error1) {
        console.warn('⚠️ Approach 1 failed, trying approach 2...');
        validationError = error1;
        
        // ✅ TRY APPROACH 2: Subtotal as query parameter
        try {
          console.log('📤 Attempt 2: Sending subtotal as query parameter');
          res = await api.post(
            `/coupons/validate?subtotal=${subtotal}`,
            { code: couponCode }
          );
          console.log('✅ Approach 2 SUCCESS:', res.data);
        } catch (error2) {
          console.error('❌ Both approaches failed');
          console.error('Error 1 (body):', error1.response?.data);
          console.error('Error 2 (query):', error2.response?.data);
          throw error2; // Throw the last error
        }
      }
      
      // Handle different response structures
      let validatedCoupon = null;
      
      if (res.data.valid || res.data.is_valid) {
        validatedCoupon = {
          code: res.data.code || res.data.coupon_code || couponCode,
          discount: res.data.discount || res.data.discount_value || res.data.discount_amount || 0,
          type: res.data.type || res.data.discount_type || 'percentage',
          min_order: res.data.min_order || res.data.min_order_value || res.data.minimum_order_amount || 0,
          description: res.data.description || res.data.message || ''
        };
      } else if (res.data.coupon) {
        const coupon = res.data.coupon;
        validatedCoupon = {
          code: coupon.code || coupon.coupon_code || couponCode,
          discount: coupon.discount || coupon.discount_value || coupon.discount_amount || 0,
          type: coupon.type || coupon.discount_type || 'percentage',
          min_order: coupon.min_order || coupon.min_order_value || coupon.minimum_order_amount || 0,
          description: coupon.description || ''
        };
      } else {
        validatedCoupon = {
          code: res.data.code || couponCode,
          discount: res.data.discount || res.data.discount_value || 0,
          type: res.data.type || res.data.discount_type || 'percentage',
          min_order: res.data.min_order || res.data.min_order_value || 0,
          description: res.data.description || ''
        };
      }
      
      console.log('✅ Validated coupon:', validatedCoupon);
      return validatedCoupon;
      
    } catch (error) {
      console.error('❌ Coupon validation failed:', error);
      console.error('📋 Validation error details:', error.response?.data);
      console.error('🔗 Request URL:', error.config?.url);
      console.error('📦 Request data:', error.config?.data);
      
      // Extract detailed error message
      const errorData = error.response?.data;
      let errorMsg = 'Invalid or expired coupon code';
      
      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors
          const messages = errorData.detail.map(err => 
            `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`
          ).join(', ');
          errorMsg = messages;
          console.error('🔍 Validation errors:', errorData.detail);
        } else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        }
      } else if (errorData?.message) {
        errorMsg = errorData.message;
      }
      
      console.log('📝 Final error message:', errorMsg);
      
      return null;
    }
  };

  // Apply Coupon Function with Backend Validation
  const applyCoupon = async () => {
    if (!inputCoupon.trim()) {
      alert('Please enter a coupon code');
      return;
    }
    
    const couponCodeUpper = inputCoupon.trim().toUpperCase();
    console.log('🎫 Applying coupon:', couponCodeUpper, 'to order total:', subtotal);
    
    const validatedCoupon = await validateCoupon(couponCodeUpper);
    
    if (validatedCoupon && validatedCoupon.code) {
      const minOrder = validatedCoupon.min_order || 0;
      
      if (subtotal >= minOrder) {
        setCouponCode(validatedCoupon.code);
        
        // Calculate discount based on coupon type
        let discountAmount = 0;
        if (validatedCoupon.type === 'percentage' || validatedCoupon.type === 'percent') {
          discountAmount = (subtotal * validatedCoupon.discount) / 100;
          console.log(`📊 Percentage discount: ${validatedCoupon.discount}% of ₹${subtotal} = ₹${discountAmount}`);
        } else if (validatedCoupon.type === 'fixed' || validatedCoupon.type === 'flat' || validatedCoupon.type === 'amount') {
          discountAmount = validatedCoupon.discount;
          console.log(`💰 Fixed discount: ₹${discountAmount}`);
        } else {
          discountAmount = (subtotal * validatedCoupon.discount) / 100;
          console.log(`📊 Default to percentage: ${validatedCoupon.discount}% = ₹${discountAmount}`);
        }
        
        console.log('✅ Discount amount calculated:', discountAmount);
        setDiscount(discountAmount);
        setInputCoupon('');
        setShowCouponModal(false);
        alert(`🎉 Coupon ${validatedCoupon.code} applied successfully! You saved ₹${discountAmount.toFixed(2)}`);
      } else {
        alert(`⚠️ Minimum order of ₹${minOrder} required for this coupon. Current order: ₹${subtotal.toFixed(2)}`);
      }
    } else {
      alert('❌ Invalid or expired coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    console.log('🗑️ Coupon removed');
  };

  // ---------------- PAYMENT HANDLERS ----------------

  const handleUpiPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('UPI Payment initiated');
  };

  const handleCashPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Cash Payment recorded');
  };

  const handleCardPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Card Payment initiated');
  };

  const handleSaveDraft = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Order saved as draft');
  };

  const handlePrint = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Printing bill...');
  };

  // ---------------- UI HELPERS ----------------

  const handleAddToCartClick = (item) => {
    if (!item || !item.id) {
      console.error('Invalid item:', item);
      return;
    }

    const availableSizes = item.sizes || [];

    if (availableSizes.length === 1) {
      addToCartWithSize(availableSizes[0], item);
      return;
    }

    setSelectedMenuItem(item);
    setShowSizeModal(true);
  };

  const addToCartWithSize = (size, menuItem = selectedMenuItem) => {
    if (!menuItem) return;

    const finalPrice = size.price || menuItem.basePrice || 0;
    const productId = size.product_id || menuItem.id;

    const existingIndex = cartItems.findIndex((ci) => ci.product_id === productId);

    if (existingIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingIndex].qty += 1;
      setCartItems(newCart);
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: productId,
          name: menuItem.name,
          size: size.name,
          qty: 1,
          price: finalPrice,
        },
      ]);
    }

    setShowSizeModal(false);
    setSelectedMenuItem(null);
  };

  const updateCartItemQuantity = (index, change) => {
    const newCart = [...cartItems];
    newCart[index].qty += change;

    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    }

    setCartItems(newCart);
  };

  const getMenuItemQuantity = (item) => {
    if (!item) return 0;

    return cartItems
      .filter((ci) => item.sizes.some((size) => size.product_id === ci.product_id))
      .reduce((sum, ci) => sum + (ci.qty || 0), 0);
  };

  const handleDatabaseClick = () => {
    window.location.href = '/menu';
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) return;
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    setSelectedCustomer(`${firstName} ${lastName}`.trim() || 'Guest');
    setSelectedCustomerId(customer.id || 0);
  };

  const handleLoadMore = () => {
    setVisibleRows((prev) => prev + rowsToLoadMore);
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
  };

  const handleBackToMenu = () => {
    setIsPreviewMode(false);
  };

  const visibleItems = allMenuItems.slice(0, visibleRows * itemsPerRow);
  const hasMoreToLoad = visibleItems.length < allMenuItems.length;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 0),
    0
  );
  
  const discountedSubtotal = subtotal - discount;
  const cgst = discountedSubtotal * 0.025;
  const sgst = discountedSubtotal * 0.025;
  const total = discountedSubtotal + cgst + sgst;

  // ---------------- RENDER ----------------

  return (
    <div
      className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-5 max-w-[100vw] overflow-x-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Size Selection Modal */}
      {showSizeModal && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">
                Select Size
              </h3>
              <button
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedMenuItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedMenuItem.name || 'Item'}
            </p>
            <div className="space-y-2">
              {(selectedMenuItem.sizes || []).map((size, i) => (
                <button
                  key={i}
                  onClick={() => addToCartWithSize(size)}
                  className="w-full p-3 bg-muted hover:bg-teal-600 hover:text-white rounded-lg transition-colors flex justify-between items-center"
                >
                  <span className="font-medium">{size.name}</span>
                  <span>₹{size.price || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">
                Add New Customer
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="First name *"
              value={newCustomer.first_name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, first_name: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Last name"
              value={newCustomer.last_name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, last_name: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="+91 Phone number"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="email"
              placeholder="example@mail.com (optional)"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, email: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Address"
              value={newCustomer.address}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, address: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="City"
              value={newCustomer.city}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, city: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="State"
              value={newCustomer.state}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, state: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Zip code"
              value={newCustomer.zip_code}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, zip_code: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-3 sm:mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomer}
                disabled={loading}
                className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Customer'}
              </button>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend-Powered Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">
                Apply Coupon
              </h3>
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setInputCoupon('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Manual Input */}
            <input
              type="text"
              placeholder="Enter coupon code"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && inputCoupon.trim()) {
                  applyCoupon();
                }
              }}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-3 sm:mb-4"
            />

            {/* Backend Available/Eligible Coupons */}
            {loadingCoupons ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading coupons...
              </div>
            ) : availableCoupons.length > 0 ? (
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Available Coupons (Subtotal: ₹{subtotal.toFixed(2)})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableCoupons.map((coupon, i) => {
                    const minOrder = coupon.min_order || 0;
                    const isEligible = subtotal >= minOrder;
                    return (
                      <div
                        key={coupon.id || i}
                        className={`bg-muted rounded p-2 sm:p-3 cursor-pointer transition-colors ${
                          isEligible
                            ? 'hover:bg-teal-600 hover:text-white border-2 border-transparent hover:border-teal-700'
                            : 'opacity-60 cursor-not-allowed border-2 border-red-300'
                        }`}
                        onClick={() => {
                          if (isEligible) {
                            setInputCoupon(coupon.code);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm sm:text-base">
                            {coupon.code}
                          </span>
                          <span className="text-xs sm:text-sm">
                            {coupon.type === 'percentage' || coupon.type === 'percent'
                              ? `${coupon.discount}% off`
                              : `₹${coupon.discount} off`}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm mt-1 opacity-80">
                          {coupon.description}
                        </p>
                        {minOrder > 0 && (
                          <p className={`text-xs mt-1 ${isEligible ? 'text-green-600' : 'text-red-500'}`}>
                            {isEligible 
                              ? `✓ Min order: ₹${minOrder}` 
                              : `✗ Min order: ₹${minOrder} (Need ₹${(minOrder - subtotal).toFixed(2)} more)`
                            }
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground mb-4">
                {loadingCoupons ? 'Loading coupons...' : 'No coupons available at the moment'}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={applyCoupon}
                disabled={!inputCoupon.trim()}
                className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Coupon
              </button>
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setInputCoupon('');
                }}
                className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
        <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-foreground">
          POS System
        </h2>
      </div>

      {/* Customer Panel */}
      <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full mb-3 sm:mb-4 md:mb-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">
            Customer
          </h2>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
        <div className="mb-3 sm:mb-4">
          <label className="text-muted-foreground text-sm mb-2 block">
            Select customer
          </label>
          <div className="relative">
            <Search
              size={16}
              className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search name, phone..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-4 py-2 pl-10 text-sm sm:text-base"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
          {customers.map((customer, i) => {
            if (!customer) return null;

            const firstName = customer.first_name || '';
            const lastName = customer.last_name || '';
            const initial = firstName.charAt(0)?.toUpperCase() || '?';
            const colors = ['#4A5568', '#2D5A7B', '#8B6F47', '#6B7280'];
            const bgColor = colors[i % colors.length];
            const displayName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const isSelected = selectedCustomerId === customer.id;

            return (
              <button
                key={i}
                onClick={() => handleCustomerSelect(customer)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-teal-600 rounded-full text-sm cursor-pointer flex items-center gap-1.5 sm:gap-2 transition-colors flex-shrink-0"
                style={{
                  backgroundColor: isSelected ? '#1ABC9C' : 'transparent',
                  color: isSelected ? 'white' : 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#1ABC9C';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'inherit';
                  }
                }}
              >
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: bgColor }}
                >
                  {firstName === 'Guest' ? '👤' : initial}
                </div>
                <span className="text-sm whitespace-nowrap">{displayName}</span>
              </button>
            );
          })}
        </div>
        <div>
          <label className="text-muted-foreground text-sm mb-2 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full bg-muted text-foreground border border-border rounded-md outline-none resize-y px-3 py-2 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Conditional rendering based on preview mode */}
      {!isPreviewMode ? (
        <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">
              Menu
            </h2>
            <button
              onClick={handleDatabaseClick}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
            >
              <Database size={16} />
              <span>DB</span>
            </button>
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="text-muted-foreground text-sm mb-2 block">
              Search items
            </label>
            <div className="relative">
              <Search
                size={16}
                className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-4 py-2 pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="text-muted-foreground text-sm mb-2 block">
              Categories
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base"
            >
              {categories.map((cat, i) => (
                <option key={i} value={cat?.name || 'All'}>
                  {cat?.name || 'All'}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
                {visibleItems.map((item, i) => {
                  if (!item || !item.id) return null;

                  const quantity = getMenuItemQuantity(item);
                  const imageUrl = item.image_url;
                  const itemName = item.name || 'Item';
                  const fallbackImage = `https://via.placeholder.com/200x200/1ABC9C/FFFFFF?text=${encodeURIComponent(
                    itemName.substring(0, 3)
                  )}`;

                  return (
                    <div
                      key={i}
                      className="bg-secondary rounded-lg overflow-hidden flex flex-col shadow-sm"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-gray-200">
                        <img
                          src={imageUrl || fallbackImage}
                          alt={itemName}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.log(
                              'Image failed to load, using fallback:',
                              imageUrl
                            );
                            e.target.onerror = null;
                            e.target.src = fallbackImage;
                          }}
                        />
                      </div>
                      <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2">
                        <div>
                          <h3 className="text-foreground text-sm font-semibold mb-0.5 sm:mb-1 line-clamp-2 leading-tight">
                            {itemName}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleAddToCartClick(item)}
                          className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-full text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-teal-700 w-full"
                        >
                          <Plus size={14} />
                          <span>
                            {quantity === 0 ? 'Add' : `${quantity} in cart`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-4">
                {hasMoreToLoad && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load More
                  </button>
                )}
                <button
                  onClick={handlePreview}
                  disabled={cartItems.length === 0}
                  className="px-4 py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-gray-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-700"
          >
            <ArrowLeft size={16} />
            <span>Back to Menu</span>
          </button>

          <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Selected Dishes
            </h2>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items in cart
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <h3 className="text-card-foreground font-semibold">
                        {item.name || 'Item'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.size} - ₹{item.price || 0} each
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => updateCartItemQuantity(i, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-card hover:bg-accent rounded text-card-foreground cursor-pointer transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-semibold text-card-foreground">
                          {item.qty || 0}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(i, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <p className="text-card-foreground font-semibold">
                          ₹{((item.price || 0) * (item.qty || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                Billing Summary
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCouponModal(true)}
                  disabled={loadingCoupons}
                  className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-teal-700 flex-shrink-0 disabled:opacity-50"
                >
                  <Tag size={16} />
                  <span>{loadingCoupons ? 'Loading...' : 'Coupon'}</span>
                </button>
                <button
                  onClick={() => {
                    setCartItems([]);
                    removeCoupon();
                  }}
                  className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-teal-700 flex-shrink-0"
                >
                  <Trash2 size={16} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-card-foreground font-semibold">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-base">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground">Discount</span>
                  {couponCode && (
                    <span
                      className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded cursor-pointer hover:bg-red-600 transition-colors"
                      onClick={removeCoupon}
                      title="Click to remove"
                    >
                      {couponCode}
                    </span>
                  )}
                </div>
                <span className="text-card-foreground font-semibold">
                  {discount > 0 ? `- ₹${discount.toFixed(2)}` : '₹0.00'}
                </span>
              </div>

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">CGST (2.5%)</span>
                <span className="text-card-foreground">₹{cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">SGST (2.5%)</span>
                <span className="text-card-foreground">₹{sgst.toFixed(2)}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-card-foreground">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-card-foreground mb-3">
                Payment Methods
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={handleUpiPayment}
                  className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700"
                >
                  UPI
                </button>
                <button
                  onClick={handleCashPayment}
                  className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700"
                >
                  Cash
                </button>
                <button
                  onClick={handleCardPayment}
                  className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700"
                >
                  Card
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSaveDraft}
                  className="w-full py-2.5 bg-gray-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-gray-700 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 font-medium hover:bg-teal-700 transition-colors"
                >
                  <Printer size={16} />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;