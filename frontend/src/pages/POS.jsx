import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Database, Eye, ArrowLeft, Minus, Tag, Trash2, Printer, X, Zap } from 'lucide-react';
import api from '../api/axios';

function POS() {
  const location = useLocation();
  const [selectedCustomer, setSelectedCustomer] = useState('Guest');
  const [selectedCustomerId, setSelectedCustomerId] = useState(0);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [isWelcomeOfferApplied, setIsWelcomeOfferApplied] = useState(false);
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
  const [ineligibleCoupons, setIneligibleCoupons] = useState([]);
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isQuickBillMode, setIsQuickBillMode] = useState(false);
  const [orderType, setOrderType] = useState('dine_in');
  const [addToOrderId, setAddToOrderId] = useState(null);
  const [addToOrderNumber, setAddToOrderNumber] = useState(null);

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

    // Check if we came from Customers page with a pre-selected customer
    if (location.state?.customer) {
      const { id, name } = location.state.customer;
      setSelectedCustomerId(id);
      setSelectedCustomer(name);
    }

    // Check if we are in "Add Items" mode
    if (location.state?.addToOrderId) {
      setAddToOrderId(location.state.addToOrderId);
      setAddToOrderNumber(location.state.orderNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Welcome Offer Logic: Apply 10% discount for first-time customers
  useEffect(() => {
    if (selectedCustomerObj && selectedCustomerObj.orders_count === 0 && !couponCode) {
      setIsWelcomeOfferApplied(true);
    } else {
      setIsWelcomeOfferApplied(false);
    }
  }, [selectedCustomerObj, couponCode]);

  // Derived Billing Totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const welcomeDiscount = isWelcomeOfferApplied ? subtotal * 0.1 : 0;
  const totalDiscount = discount + welcomeDiscount;
  // Tax is calculated per item using the category's tax_rate, then split equally as CGST/SGST
  const taxTotal = cartItems.reduce((sum, item) => {
    const itemNet = item.price * item.qty * (1 - totalDiscount / (subtotal || 1));
    return sum + itemNet * ((item.tax_rate ?? 5) / 100);
  }, 0);
  const cgst = taxTotal / 2;
  const sgst = taxTotal / 2;
  const total = subtotal - totalDiscount + taxTotal;

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/', { params: { skip: 0, limit: 100 } });
      const data = res.data;

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
        .filter((cat) => cat.is_active !== false)
        .map((cat) => ({
          id: cat.id,
          name: cat.name || cat.category_name || cat.title,
          tax_rate: cat.tax_rate ?? 5,
        }))
        .filter((cat) => cat && cat.name);

      const finalCategories = [{ id: 0, name: 'All' }, ...validCategories];
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

      // Only fetch products for active categories
      const activeCategoryIds = new Set(
        categories.filter(c => c.id !== 0).map(c => c.id)
      );

      if (selectedCategory !== 'All') {
        const category = categories.find((cat) => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          params.category_id = category.id;
        }
      }

      const res = await api.get('/products/', { params });
      const data = res.data;

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

      // Filter out products belonging to inactive categories
      const validItems = itemsArray.filter(
        (item) => item && item.id && item.name && item.price !== undefined &&
          activeCategoryIds.has(item.category_id)
      );

      const groupedItems = groupItemsByBaseName(validItems);
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
        }
      }

      const res = await api.get('/products/search', { params });
      const data = res.data;

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
    // Build a lookup map of category_id -> tax_rate from the loaded categories
    const catTaxMap = {};
    categories.forEach(c => { if (c.id) catTaxMap[c.id] = c.tax_rate ?? 5; });

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
          tax_rate: catTaxMap[item.category_id] ?? 5,
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

  const fetchAvailableCoupons = async (currentSubtotal = subtotal, customerId = selectedCustomerId) => {
    try {
      setLoadingCoupons(true);

      const res = await api.get('/coupons/available', {
        params: {
          subtotal: currentSubtotal,
          customer_id: customerId || null
        }
      });
      let couponsData = [];

      if (res.data.eligible && Array.isArray(res.data.eligible)) {
        couponsData = res.data.eligible;
      } else if (Array.isArray(res.data)) {
        couponsData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        couponsData = res.data.data;
      } else if (res.data.items && Array.isArray(res.data.items)) {
        couponsData = res.data.items;
      } else if (res.data.coupons && Array.isArray(res.data.coupons)) {
        couponsData = res.data.coupons;
      }

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

      const activeCoupons = normalizedCoupons.filter(c => c.is_active && c.code);

      if (activeCoupons.length > 0) {
        setAvailableCoupons(activeCoupons);
      } else {
        setAvailableCoupons([]);
      }

      // Handle ineligible coupons
      if (res.data.ineligible && Array.isArray(res.data.ineligible)) {
        const normalizedIneligible = res.data.ineligible.map(item => {
          const coupon = item.coupon;
          return {
            id: coupon.id,
            code: coupon.code || coupon.coupon_code || '',
            discount: coupon.discount_value || coupon.discount || coupon.discount_amount || 0,
            type: coupon.discount_type || coupon.type || 'percentage',
            description: coupon.description || coupon.desc || '',
            min_order: coupon.min_order_amount || coupon.min_order || 0,
            reason: item.reason
          };
        });
        setIneligibleCoupons(normalizedIneligible);
      } else {
        setIneligibleCoupons([]);
      }

    } catch (error) {
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const validateCoupon = async (couponCode) => {
    try {
      const requestBody = {
        coupon_code: couponCode,
        subtotal: subtotal,
        customer_id: selectedCustomerId || null
      };

      const res = await api.post('/coupons/validate', requestBody);

      let validatedCoupon = null;

      if (res.data.valid || res.data.is_valid) {
        validatedCoupon = {
          code: res.data.code || res.data.coupon_code || couponCode,
          discount: res.data.discount || res.data.discount_value || res.data.discount_amount || 0,
          type: res.data.type || res.data.discount_type || 'percentage',
          min_order: res.data.min_order || res.data.min_order_value || res.data.minimum_order_amount || 0,
          product_id: res.data.product_id || null,
          description: res.data.description || res.data.message || ''
        };
      } else if (res.data.coupon) {
        const coupon = res.data.coupon;
        validatedCoupon = {
          code: coupon.code || coupon.coupon_code || couponCode,
          discount: coupon.discount || coupon.discount_value || coupon.discount_amount || 0,
          type: coupon.type || coupon.discount_type || 'percentage',
          min_order: coupon.min_order || coupon.min_order_value || coupon.minimum_order_amount || 0,
          product_id: coupon.product_id || null,
          description: coupon.description || ''
        };
      } else {
        validatedCoupon = {
          code: res.data.code || couponCode,
          discount: res.data.discount || res.data.discount_value || 0,
          type: res.data.type || res.data.discount_type || 'percentage',
          min_order: res.data.min_order || res.data.min_order_value || 0,
          product_id: res.data.product_id || null,
          description: res.data.description || ''
        };
      }

      return validatedCoupon;

    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Invalid or expired coupon code';

      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err =>
            `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`
          ).join(', ');
          errorMsg = messages;
        } else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        }
      } else if (errorData?.message) {
        errorMsg = errorData.message;
      }

      return null;
    }
  };

  const applyCoupon = async () => {
    if (!inputCoupon.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    const couponCodeUpper = inputCoupon.trim().toUpperCase();

    const validatedCoupon = await validateCoupon(couponCodeUpper);

    if (validatedCoupon && validatedCoupon.code) {
      const minOrder = validatedCoupon.min_order || 0;

      if (subtotal >= minOrder) {
        setCouponCode(validatedCoupon.code);

        const isProductSpecific = !!validatedCoupon.product_id;
        const targetAmount = isProductSpecific
          ? cartItems.filter(item => item.product_id === validatedCoupon.product_id)
            .reduce((acc, item) => acc + (item.price * item.qty), 0)
          : subtotal;

        if (isProductSpecific && targetAmount === 0) {
          alert(`⚠️ This coupon only applies to a specific product that is not in your cart.`);
          return;
        }

        let discountAmount = 0;
        if (validatedCoupon.type === 'percentage' || validatedCoupon.type === 'percent') {
          discountAmount = (targetAmount * validatedCoupon.discount) / 100;
        } else if (validatedCoupon.type === 'fixed' || validatedCoupon.type === 'flat' || validatedCoupon.type === 'amount') {
          discountAmount = validatedCoupon.discount;
          // For fixed discount on specific product, ensure it doesn't exceed the product's total price
          discountAmount = Math.min(discountAmount, targetAmount);
        } else {
          discountAmount = (targetAmount * validatedCoupon.discount) / 100;
        }

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
  };

  // ✅ FIXED: Create Order Function - Correctly sends payment_method in snake_case
  const createOrder = async (paymentMethod) => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return null;
    }

    try {
      setLoading(true);

      // Build order items array
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.qty,
        unit_price: item.price,
        discount: 0 // We can add per-item discount logic later if needed
      }));

      // Calculate totals
      const orderSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const orderWelcomeDiscount = isWelcomeOfferApplied ? orderSubtotal * 0.1 : 0;
      const orderDiscount = discount + orderWelcomeDiscount;
      const discountRatio = orderSubtotal > 0 ? orderDiscount / orderSubtotal : 0;
      const orderTaxTotal = cartItems.reduce((sum, item) => {
        const itemNet = item.price * item.qty * (1 - discountRatio);
        return sum + itemNet * ((item.tax_rate ?? 5) / 100);
      }, 0);
      const orderCgst = orderTaxTotal / 2;
      const orderSgst = orderTaxTotal / 2;
      const orderTotal = orderSubtotal - orderDiscount + orderTaxTotal;

      // ✅ CRITICAL FIX: Ensure payment_method is in snake_case (NOT camelCase)
      const orderPayload = {
        customer_id: selectedCustomerId || null,
        order_items: orderItems,
        tax: parseFloat((orderCgst + orderSgst).toFixed(2)),
        discount: parseFloat(orderDiscount.toFixed(2)),
        payment_method: paymentMethod,
        notes: notes || '',
        coupon_code: couponCode || null,
        is_quick_bill: isQuickBillMode,
        order_type: orderType
      };

      // Make API request
      let res;
      if (addToOrderId) {
        // Adding items to existing order
        res = await api.post(`/orders/${addToOrderId}/items`, orderPayload.order_items);
      } else {
        // Normal order creation
        res = await api.post('/orders/', orderPayload);
      }

      // Extract order ID from response
      let orderId = null;
      if (res.data.id) {
        orderId = res.data.id;
      } else if (res.data.order_id) {
        orderId = res.data.order_id;
      } else if (res.data.data?.id) {
        orderId = res.data.data.id;
      }

      // Clear cart and reset state
      setCartItems([]);
      setNotes('');
      removeCoupon();
      setIsPreviewMode(false);
      setSelectedCustomer('Guest');
      setSelectedCustomerId(0);
      setAddToOrderId(null);
      setAddToOrderNumber(null);
      
      // Clear location state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);

      return { success: true, orderId, data: res.data };

    } catch (error) {
      let errorMsg = 'Failed to create order';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(err => `${err.loc?.join('.')} : ${err.msg}`).join(', ');
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      alert(`Error creating order: ${errorMsg}`);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
    }
  };

  // ✅ Payment Handlers - All correctly pass payment method as string
  const handleUpiPayment = async () => {
    const result = await createOrder('upi');  // ✅ Lowercase string

    if (result && result.success) {
      if (isQuickBillMode) {
        handlePrint();
      }
      alert(`✅ Order #${result.orderId} created successfully!\n💳 Payment Method: UPI\n💰 Total: ₹${total.toFixed(2)}`);
    }
  };

  const handleCashPayment = async () => {
    const result = await createOrder('cash');  // ✅ Lowercase string

    if (result && result.success) {
      if (isQuickBillMode) {
        handlePrint();
      }
      alert(`✅ Order #${result.orderId} created successfully!\n💵 Payment Method: Cash\n💰 Total: ₹${total.toFixed(2)}`);
    }
  };

  const handleCardPayment = async () => {
    const result = await createOrder('card');  // ✅ Lowercase string

    if (result && result.success) {
      if (isQuickBillMode) {
        handlePrint();
      }
      alert(`✅ Order #${result.orderId} created successfully!\n💳 Payment Method: Card\n💰 Total: ₹${total.toFixed(2)}`);
    }
  };

  const handleSaveDraft = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      setLoading(true);

      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.qty,
        unit_price: item.price,
        discount: 0
      }));

      const orderSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const orderWelcomeDiscount = isWelcomeOfferApplied ? orderSubtotal * 0.1 : 0;
      const orderDiscount = discount + orderWelcomeDiscount;
      const discountRatio = orderSubtotal > 0 ? orderDiscount / orderSubtotal : 0;
      const orderTaxTotal = cartItems.reduce((sum, item) => {
        const itemNet = item.price * item.qty * (1 - discountRatio);
        return sum + itemNet * ((item.tax_rate ?? 5) / 100);
      }, 0);
      const orderCgst = orderTaxTotal / 2;
      const orderSgst = orderTaxTotal / 2;
      const orderTotal = orderSubtotal - orderDiscount + orderTaxTotal;

      // ✅ CRITICAL: payment_method in snake_case
      const draftPayload = {
        customer_id: selectedCustomerId || null,
        order_items: orderItems,  // ✅ Correct: snake_case
        tax: parseFloat((orderCgst + orderSgst).toFixed(2)),
        discount: parseFloat(orderDiscount.toFixed(2)),
        payment_method: 'pending',  // ✅ CRITICAL: snake_case
        notes: notes || '',
        coupon_code: couponCode || null
      };

      const res = await api.post('/orders/', draftPayload);

      let orderId = res.data.id || res.data.order_id || res.data.data?.id;

      alert(`✅ Order #${orderId} saved as draft!`);

      // Clear cart
      setCartItems([]);
      setNotes('');
      removeCoupon();
      setIsPreviewMode(false);
      setSelectedCustomer('Guest');
      setSelectedCustomerId(0);

    } catch (error) {
      console.error('❌ Error saving draft:', error);
      alert('Failed to save draft order');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the bill');
      return;
    }

    const invoiceHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Invoice #${Date.now()}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { margin: 0; }
      .info { margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; }
      .totals { text-align: right; }
      .totals div { margin: 5px 0; }
      .grand-total { font-size: 1.2em; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
      @media print {
        body { padding: 0; }
        button { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Restaurant Invoice</h1>
      <p>Date: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="info">
      <strong>Customer:</strong> ${selectedCustomer}<br/>
      ${notes ? `<strong>Notes:</strong> ${notes}` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Size</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${cartItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.size}</td>
            <td>${item.qty}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${(item.price * item.qty).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</div>
      ${discount > 0 ? `<div><strong>Discount ${couponCode ? `(${couponCode})` : ''}:</strong> -₹${discount.toFixed(2)}</div>` : ''}
      <div><strong>CGST:</strong> ₹${cgst.toFixed(2)}</div>
      <div><strong>SGST:</strong> ₹${sgst.toFixed(2)}</div>
      <div class="grand-total"><strong>Grand Total:</strong> ₹${total.toFixed(2)}</div>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <button onclick="window.print()" style="padding: 10px 20px; background: #1ABC9C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
        Print Invoice
      </button>
      <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
        Close
      </button>
    </div>
  </body>
  </html>
`;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };
  // ---------------- UI HELPERS ----------------
  const handleAddToCartClick = (item) => {
    if (!item || !item.id) {
      console.error('Invalid item:', item);
      return;
    }
    // Always open size modal — even for 1 size (user must confirm)
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
          tax_rate: menuItem.tax_rate || 5,
        },
      ]);
    }

    setShowSizeModal(false);
    setSelectedMenuItem(null);
  };

  const updateCartItemQuantity = (index, delta) => {
    const newCart = [...cartItems];
    const newQty = (newCart[index].qty || 1) + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index] = { ...newCart[index], qty: newQty };
    }
    setCartItems(newCart);
  };

  const handleQtyInputChange = (index, rawValue) => {
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || rawValue === '') {
      // Keep current value while typing; validate on blur
      const newCart = [...cartItems];
      newCart[index] = { ...newCart[index], _qtyInput: rawValue };
      setCartItems(newCart);
      return;
    }
    const valid = Math.max(1, Math.floor(parsed));
    const newCart = [...cartItems];
    newCart[index] = { ...newCart[index], qty: valid, _qtyInput: undefined };
    setCartItems(newCart);
  };

  const handleQtyInputBlur = (index) => {
    const newCart = [...cartItems];
    const raw = newCart[index]._qtyInput;
    if (raw !== undefined) {
      const parsed = parseInt(raw, 10);
      const valid = isNaN(parsed) || parsed < 1 ? 1 : Math.floor(parsed);
      newCart[index] = { ...newCart[index], qty: valid, _qtyInput: undefined };
      setCartItems(newCart);
    }
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
    const fullName = `${firstName} ${lastName}`.trim();
    setSelectedCustomer(fullName || 'Guest');
    setSelectedCustomerId(customer.id || 0);
    setSelectedCustomerObj(customer);
    setSearchCustomer(''); // Clear search after selection
  };

  const clearCustomer = () => {
    setSelectedCustomer('Guest');
    setSelectedCustomerId(0);
    setSelectedCustomerObj(null);
    setIsWelcomeOfferApplied(false);
    setIsQuickBillMode(false);
  };

  const toggleQuickBillMode = () => {
    if (!isQuickBillMode) {
      // Enter Quick Bill
      setSelectedCustomer('Guest');
      setSelectedCustomerId(0);
      setSelectedCustomerObj({ id: null, first_name: 'Guest', last_name: '', phone: 'N/A', orders_count: 100 }); // Prevent welcome offer
      setIsWelcomeOfferApplied(false);
      setIsQuickBillMode(true);
      setSearchCustomer('');
    } else {
      // Exit Quick Bill
      clearCustomer();
    }
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
  // ---------------- RENDER ----------------
  return (
    <div
      className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-5 max-w-[100vw] overflow-x-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Add Items to Order Banner */}
      {addToOrderId && (
        <div className="bg-amber-500 text-white px-4 py-3 rounded-lg mb-4 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">Mode: Adding to Order {addToOrderNumber || `#${addToOrderId}`}</p>
              <p className="text-xs opacity-90">Selected items will be added to the existing KOT.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setAddToOrderId(null);
              setAddToOrderNumber(null);
              window.history.replaceState({}, document.title);
            }}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs font-bold transition-colors"
          >
            Cancel Mode
          </button>
        </div>
      )}
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

            <label htmlFor="pos-add-first-name" className="sr-only">First name</label>
            <input
              id="pos-add-first-name"
              name="first_name"
              autoComplete="name"
              type="text"
              placeholder="First name *"
              value={newCustomer.first_name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, first_name: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-last-name" className="sr-only">Last name</label>
            <input
              id="pos-add-last-name"
              name="last_name"
              autoComplete="off"
              type="text"
              placeholder="Last name"
              value={newCustomer.last_name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, last_name: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-phone" className="sr-only">Phone number</label>
            <input
              id="pos-add-phone"
              name="phone"
              autoComplete="tel"
              type="text"
              placeholder="+91 Phone number"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-email" className="sr-only">Email address</label>
            <input
              id="pos-add-email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder="example@mail.com (optional)"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, email: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-address" className="sr-only">Address</label>
            <input
              id="pos-add-address"
              name="address"
              autoComplete="street-address"
              type="text"
              placeholder="Address"
              value={newCustomer.address}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, address: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-city" className="sr-only">City</label>
            <input
              id="pos-add-city"
              name="city"
              autoComplete="address-level2"
              type="text"
              placeholder="City"
              value={newCustomer.city}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, city: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-state" className="sr-only">State</label>
            <input
              id="pos-add-state"
              name="state"
              autoComplete="off"
              type="text"
              placeholder="State"
              value={newCustomer.state}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, state: e.target.value })
              }
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <label htmlFor="pos-add-zip" className="sr-only">Zip code</label>
            <input
              id="pos-add-zip"
              name="zip_code"
              autoComplete="off"
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
            <label htmlFor="pos-coupon-code" className="sr-only">Coupon code</label>
            <input
              id="pos-coupon-code"
              name="coupon_code"
              autoComplete="off"
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

            {/* Backend Available Coupons */}
            {loadingCoupons ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading coupons...
              </div>
            ) : (availableCoupons.length > 0 || ineligibleCoupons.length > 0) ? (
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Available Coupons (Subtotal: ₹{subtotal.toFixed(2)})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {/* Eligible Coupons */}
                  {availableCoupons.map((coupon, i) => {
                    const minOrder = coupon.min_order || 0;
                    return (
                      <div
                        key={coupon.id || i}
                        className="bg-muted rounded p-2 sm:p-3 cursor-pointer transition-colors hover:bg-teal-600 hover:text-white border-2 border-transparent hover:border-teal-700"
                        onClick={() => {
                          setInputCoupon(coupon.code);
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
                          <p className="text-xs mt-1 text-green-600">
                            ✓ Min order: ₹{minOrder}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Ineligible Coupons */}
                  {ineligibleCoupons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">
                        Currently Ineligible
                      </p>
                      <div className="space-y-2">
                        {ineligibleCoupons.map((coupon, i) => (
                          <div
                            key={`ineligible-${i}`}
                            className="bg-muted bg-opacity-50 rounded p-2 sm:p-3 opacity-60 border border-dashed border-border"
                          >
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span className="font-semibold text-sm">
                                {coupon.code}
                              </span>
                              <span className="text-xs">
                                {coupon.type === 'percentage' || coupon.type === 'percent'
                                  ? `${coupon.discount}% off`
                                  : `₹${coupon.discount} off`}
                              </span>
                            </div>
                            <p className="text-xs mt-1 text-red-500 font-medium">
                              {coupon.reason || 'Not applicable'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground mb-4">
                No coupons available
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
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
          <div className="flex gap-2">
            <button
              onClick={toggleQuickBillMode}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 transition-all font-medium ${
                isQuickBillMode 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-muted text-foreground border-border hover:bg-muted/80'
              }`}
            >
              <Zap size={16} fill={isQuickBillMode ? "currentColor" : "none"} />
              <span>Quick Bill</span>
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 shrink-0"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>
        <div className="mb-3 sm:mb-4">
          <label htmlFor="pos-search-customer" className="text-muted-foreground text-sm mb-2 block">
            Select customer
          </label>
          <div className={`flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-12 transition-all ${
            isQuickBillMode 
            ? 'bg-teal-50/30 border-teal-200 cursor-not-allowed opacity-80' 
            : 'bg-muted border-border focus-within:border-teal-500'
          }`}>
            {/* Quick Bill Indicator */}
            {isQuickBillMode && (
              <div className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1.5 rounded-full text-sm shadow-sm">
                <Zap size={14} fill="currentColor" />
                <span className="font-bold uppercase tracking-wider text-[10px]">Quick Bill Mode</span>
              </div>
            )}

            {/* Selected Customer Chip */}
            {selectedCustomerId > 0 && !isQuickBillMode && (
              <div className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1.5 rounded-full text-sm animate-in fade-in zoom-in duration-200 shadow-sm">
                <span className="font-medium">{selectedCustomer}</span>
                {selectedCustomerObj?.orders_count === 0 && (
                  <span className="bg-yellow-400 text-teal-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                )}
                <button
                  onClick={clearCustomer}
                  className="hover:bg-teal-700 rounded-full p-0.5 transition-colors"
                  title="Remove customer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Search Input */}
            {!isQuickBillMode && (
              <div className="relative flex-1 min-w-30">
                <Search
                  size={16}
                  className="text-muted-foreground absolute left-2 top-1/2 transform -translate-y-1/2"
                />
                <input
                  id="pos-search-customer"
                  name="customer_search"
                  autoComplete="off"
                  type="text"
                  placeholder={selectedCustomerId > 0 ? "Change customer..." : "Search name, phone..."}
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full bg-transparent text-foreground border-none outline-none px-2 py-1 pl-8 text-sm sm:text-base placeholder:text-muted-foreground/50"
                />
              </div>
            )}
            
            {isQuickBillMode && (
              <div className="text-muted-foreground text-sm px-2 font-medium">
                Guest Customer assigned automatically
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchCustomer && (
            <div className="mt-1 bg-card border border-border rounded-md shadow-xl max-h-60 overflow-y-auto z-50 absolute w-[calc(100%-2.5rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-3.5rem)] lg:w-[calc(100%-4rem)]">
              {customers.length > 0 ? (
                customers.map((customer, i) => (
                  <div
                    key={customer.id || i}
                    onClick={() => handleCustomerSelect(customer)}
                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs uppercase">
                        {customer.first_name?.[0] || '?'}{customer.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                    {customer.orders_count === 0 && (
                      <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold uppercase">First Order</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No customers found matching "{searchCustomer}"
                </div>
              )}
            </div>
          )}

          {/* Welcome Offer Alert */}
          {isWelcomeOfferApplied && (
            <div className="mt-3 flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium animate-pulse">
              <Tag size={16} className="text-teal-600" />
              <span>Welcome Offer Applied: 10% First-Order Discount!</span>
            </div>
          )}

          {/* Order Type Selection */}
          <div className="mt-4 mb-4">
            <label className="text-muted-foreground text-sm mb-2 block font-medium">Order Type</label>
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  orderType === 'dine_in'
                    ? 'bg-teal-600 text-white shadow-md scale-[1.02]'
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${orderType === 'dine_in' ? 'bg-teal-200 animate-pulse' : 'bg-teal-500'}`}></div>
                Dine-in
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  orderType === 'takeaway'
                    ? 'bg-teal-600 text-white shadow-md scale-[1.02]'
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${orderType === 'takeaway' ? 'bg-amber-200 animate-pulse' : 'bg-amber-500'}`}></div>
                Takeaway
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pos-order-notes" className="text-muted-foreground text-sm mb-2 block">Notes</label>
            <textarea
              id="pos-order-notes"
              name="notes"
              autoComplete="off"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full bg-muted text-foreground border border-border rounded-md outline-none resize-y px-3 py-2 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Conditional rendering based on preview mode */}
      {!isPreviewMode ? (
        <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full mb-3 sm:mb-4 md:mb-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">
              Menu
            </h2>
            <button
              onClick={handleDatabaseClick}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 shrink-0"
            >
              <Database size={16} />
              <span>DB</span>
            </button>
          </div>
          <div className="mb-3 sm:mb-4">
            <label htmlFor="pos-search-menu" className="text-muted-foreground text-sm mb-2 block">
              Search items
            </label>
            <div className="relative">
              <Search
                size={16}
                className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
              />
              <input
                id="pos-search-menu"
                name="menu_search"
                autoComplete="off"
                type="text"
                placeholder="Search..."
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-4 py-2 pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="mb-3 sm:mb-4">
            <label htmlFor="pos-category-select" className="text-muted-foreground text-sm mb-2 block">
              Categories
            </label>
            <select
              id="pos-category-select"
              name="category"
              autoComplete="off"
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
                  const initials = itemName.substring(0, 2).toUpperCase();
                  const fallbackImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#1ABC9C"/><text x="100" y="115" font-family="sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">${initials}</text></svg>`
                  )}`;

                  return (
                    <div
                      key={i}
                      className="bg-secondary rounded-lg overflow-hidden flex flex-col shadow-sm"
                    >
                      <div className="w-full h-20 sm:h-24 overflow-hidden bg-gray-200 shrink-0">
                        <img
                          src={imageUrl || fallbackImage}
                          alt={itemName}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImage;
                          }}
                        />
                      </div>
                      <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2 grow">
                        <div className="grow">
                          <h3 className="text-foreground text-sm font-bold mb-1.5 line-clamp-2 leading-tight">
                            {itemName}
                          </h3>
                          {/* Price Display for all variants */}
                          <div className="space-y-1 mt-1 mb-2">
                            {item.sizes && item.sizes.length > 0 ? (
                              item.sizes.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] sm:text-xs">
                                  <span className="text-muted-foreground truncate max-w-[60%]">{s.name}</span>
                                  <span className="text-teal-500 font-bold whitespace-nowrap">₹{s.price}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-teal-500 font-bold text-xs">₹{item.basePrice}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCartClick(item)}
                          className="px-3 py-2 bg-teal-600 text-white border-none rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-teal-700 transition-colors w-full mt-auto"
                        >
                          <Plus size={14} />
                          <span>
                            {quantity === 0 ? 'Add' : `${quantity} View`}
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
              <div className="text-center py-8text-muted-foreground">
                No items in cart
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="hidden md:flex items-center justify-between px-3 py-2 bg-primary/10 dark:bg-transparent border-b border-border rounded-lg mb-2">
                  <span className="flex-1 text-[11px] uppercase font-bold text-muted-foreground">Item</span>
                  <div className="flex items-center gap-3">
                    <span className="w-28 text-center text-[11px] uppercase font-bold text-muted-foreground">Quantity</span>
                    <span className="w-20 text-right text-[11px] uppercase font-bold text-muted-foreground">Total</span>
                  </div>
                </div>
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
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => updateCartItemQuantity(i, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-card hover:bg-accent rounded text-card-foreground cursor-pointer transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <label htmlFor={`cart-qty-${i}`} className="sr-only">Quantity for {item.name}</label>
                        <input
                          id={`cart-qty-${i}`}
                          name={`cart_qty_${i}`}
                          autoComplete="off"
                          type="text"
                          inputMode="numeric"
                          value={item._qtyInput !== undefined ? item._qtyInput : (item.qty || 1)}
                          onChange={(e) => handleQtyInputChange(i, e.target.value)}
                          onBlur={() => handleQtyInputBlur(i)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          className="w-10 text-center font-semibold text-card-foreground bg-transparent border-none outline-none text-sm"
                        />
                        <button
                          onClick={() => updateCartItemQuantity(i, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-card-foreground font-semibold text-sm">
                          ₹{((item.price || 0) * (item._qtyInput !== undefined ? (parseInt(item._qtyInput) || item.qty) : (item.qty || 0))).toFixed(2)}
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
                  onClick={() => {
                    fetchAvailableCoupons(subtotal, selectedCustomerId);
                    setShowCouponModal(true);
                  }}
                  disabled={loadingCoupons}
                  className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-teal-700 shrink-0 disabled:opacity-50"
                >
                  <Tag size={16} />
                  <span>{loadingCoupons ? 'Loading...' : 'Coupon'}</span>
                </button>
                <button
                  onClick={() => {
                    setCartItems([]);
                    removeCoupon();
                  }}
                  className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-teal-700 shrink-0"
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
                  {isWelcomeOfferApplied && (
                    <span className="px-2 py-0.5 bg-yellow-400 text-teal-900 text-[10px] rounded font-bold uppercase tracking-wider animate-pulse">
                      Welcome Offer
                    </span>
                  )}
                </div>
                <span className="text-card-foreground font-semibold">
                  {totalDiscount > 0 ? `- ₹${totalDiscount.toFixed(2)}` : '₹0.00'}
                </span>
              </div>

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">CGST ({cgstPct}%)</span>
                <span className="text-card-foreground">₹{cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">SGST ({sgstPct}%)</span>
                <span className="text-card-foreground">₹{sgst.toFixed(2)}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-card-foreground">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-2">
                Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ key: 'upi', label: 'UPI' }, { key: 'cash', label: 'Cash' }, { key: 'card', label: 'Card' }].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPaymentMethod(key)}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer ${selectedPaymentMethod === key
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
                      : 'bg-muted text-foreground border-border hover:border-teal-500 hover:text-teal-500'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Contextual input for selected payment */}
              {selectedPaymentMethod === 'upi' && (
                <div className="mb-3 p-2.5 bg-muted rounded-lg border border-teal-500">
                  <p className="text-xs text-teal-500 font-medium mb-1">UPI Payment</p>
                  <p className="text-xs text-muted-foreground">Ask customer to scan QR or transfer to UPI ID and confirm payment before placing order.</p>
                </div>
              )}
              {selectedPaymentMethod === 'cash' && (
                <div className="mb-3 p-2.5 bg-muted rounded-lg border border-teal-500">
                  <p className="text-xs text-teal-500 font-medium mb-1">Cash Payment — Total: ₹{total.toFixed(2)}</p>
                  <label htmlFor="pos-cash-amount" className="sr-only">Amount received</label>
                  <input
                    id="pos-cash-amount"
                    name="cash_amount"
                    autoComplete="off"
                    type="number"
                    placeholder="Amount received"
                    className="w-full bg-background text-foreground border border-border rounded px-2 py-1.5 text-xs outline-none mt-1"
                  />
                </div>
              )}
              {selectedPaymentMethod === 'card' && (
                <div className="mb-3 p-2.5 bg-muted rounded-lg border border-teal-500">
                  <p className="text-xs text-teal-500 font-medium mb-1">Card Payment</p>
                  <p className="text-xs text-muted-foreground">Swipe/tap card on terminal and confirm transaction.</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!selectedPaymentMethod) { alert('Please select a payment method first'); return; }
                  if (selectedPaymentMethod === 'upi') handleUpiPayment();
                  else if (selectedPaymentMethod === 'cash') handleCashPayment();
                  else if (selectedPaymentMethod === 'card') handleCardPayment();
                }}
                disabled={loading || !selectedPaymentMethod}
                className="w-full py-2 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {loading ? 'Processing...' : selectedPaymentMethod ? `Confirm & Pay (${selectedPaymentMethod.toUpperCase()})` : 'Select Payment Method'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1 py-1.5 bg-gray-600 text-white border-none rounded-lg text-xs cursor-pointer font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Save Draft'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-1.5 bg-teal-600 text-white border-none rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1 font-medium hover:bg-teal-700 transition-colors"
                >
                  <Printer size={13} />
                  <span>Print</span>
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
