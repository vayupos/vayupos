import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, Eye, ArrowLeft, Minus, Tag, Trash2, Printer } from 'lucide-react';
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
  const [discount, setDiscount] = useState(0);
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchCustomers();
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

  // ---------------- COUPON FUNCTIONS ----------------

  const applyCoupon = () => {
    // Example coupon logic - replace with actual API call
    const coupons = {
      'SAVE10': 10, // 10% discount
      'SAVE20': 20, // 20% discount
      'FLAT50': 50, // Flat 50 rupees off
    };

    const couponUpper = couponCode.toUpperCase();
    if (coupons[couponUpper]) {
      const discountValue = coupons[couponUpper];
      
      // Check if it's percentage or flat discount
      if (couponUpper.startsWith('SAVE')) {
        setDiscount((subtotal * discountValue) / 100);
      } else {
        setDiscount(discountValue);
      }
      
      alert(`Coupon ${couponUpper} applied successfully!`);
      setShowCouponModal(false);
    } else {
      alert('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
  };

  // ---------------- PAYMENT HANDLERS ----------------

  const handleUpiPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('UPI Payment initiated');
    // Add your UPI payment logic here
  };

  const handleCashPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Cash Payment recorded');
    // Add your cash payment logic here
  };

  const handleCardPayment = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Card Payment initiated');
    // Add your card payment logic here
  };

  const handleSaveDraft = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Order saved as draft');
    // Add your save draft logic here
  };

  const handlePrint = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }
    alert('Printing bill...');
    // Add your print logic here
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">
                Apply Coupon
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={applyCoupon}
                className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCouponModal(false)}
                className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium"
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
                  backgroundColor: isSelected ?'#1ABC9C' : 'transparent',
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
</div>{/* Conditional rendering based on preview mode */}
  {!isPreviewMode ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
      {/* Menu Panel */}
      <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full">
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

            {hasMoreToLoad && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>

      {/* Cart Billing Panel */}
      <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full h-fit">
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">
            Cart Billing
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
            >
              <Tag size={16} />
              <span>Coupon</span>
            </button>
            <button
              onClick={() => setCartItems([])}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="mb-4">
          <div className="border-b border-border text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 p-2 text-xs sm:text-sm">
            <div>Item</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Total</div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {cartItems.map((item, i) => (
              <div
                key={i}
                className="border-b border-border grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 p-2 sm:p-2.5 items-center"
              >
                <div className="text-foreground text-xs sm:text-sm">
                  <div className="truncate">{item.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {item.size}
                  </div>
                </div>
                <div className="text-foreground text-xs sm:text-sm">
                  {item.qty}
                </div>
                <div className="text-foreground text-xs sm:text-sm">
                  ₹{item.price}
                </div>
                <div className="text-foreground text-xs sm:text-sm">
                  ₹{(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="border-t border-border pt-3 sm:pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-semibold">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
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
            <span className="text-foreground font-semibold">
              {discount > 0 ? `- ₹${discount.toFixed(2)}` : '₹0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">CGST 2.5%</span>
            <span className="text-foreground">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">SGST 2.5%</span>
            <span className="text-foreground">₹{sgst.toFixed(2)}</span>
          </div>
          <div className="border-t border-border flex justify-between text-base font-semibold pt-2 sm:pt-3">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-foreground text-sm">To collect</span>
            <span className="text-foreground font-semibold text-lg">
              ₹{total.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={handleUpiPayment}
              className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700"
            >
              UPI
            </button>
            <button
              onClick={handleCashPayment}
              className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700"
            >
              Cash
            </button>
            <button
              onClick={handleCardPayment}
              className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700"
            >
              Card
            </button>
          </div>

          {/* Action Buttons */}
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
          <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
            Print sends bill to printer and logs to Past Orders.
          </p>
        </div>
      </div>
    </div>
  ) : (
    /* PREVIEW MODE - Side by Side Layout */
    <div>
      <button
        onClick={handleBackToMenu}
        className="px-4 py-2 bg-gray-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        <span>Back to Menu</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selected Dishes - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-4 md:p-6">
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

        {/* Billing Summary - Takes 1 column on large screens */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6 h-fit">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Billing Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-card-foreground font-semibold">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-base">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Discount</span>
                  {couponCode && (
                    <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded">
                      {couponCode}
                    </span>
                  )}
                </div>
                <span className="text-card-foreground">
                  - ₹{discount.toFixed(2)}
                </span>
              </div>
            )}

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
    </div>
  )}
</div>);
}
export default POS;