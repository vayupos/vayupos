import React, { useState, useEffect } from 'react';
import { Search, Plus, Database, Eye, ArrowLeft, Minus } from 'lucide-react';

// API Base URL - Update this to your actual API URL
const API_BASE_URL = 'http://localhost:8000/api/v1';

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
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India'
  });
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Pagination states - changed to show 3 rows initially, then 2 more rows at a time
  const [visibleRows, setVisibleRows] = useState(3); // Start with 3 rows visible
  const itemsPerRow = 4; // 4 columns
  const rowsToLoadMore = 2; // Load 2 more rows each time
  const [allMenuItems, setAllMenuItems] = useState([]); // Store all loaded items

  // Define available sizes - you can modify this based on your backend data
  const allSizes = [
    { name: 'Small', priceModifier: 0 },
    { name: 'Medium', priceModifier: 10 },
    { name: 'Large', priceModifier: 20 },
    { name: 'Regular', priceModifier: 0 }
  ];

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchCustomers();
  }, []);

  // Fetch menu items when category or search changes
  useEffect(() => {
    // Reset visible rows when category or search changes
    setVisibleRows(3);
    setAllMenuItems([]);
    
    // Only fetch items if categories have been loaded
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

      const token = localStorage.getItem('access_token');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/customers/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(newCustomer)
      });

      if (response.ok) {
        const data = await response.json();
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
          country: 'India'
        });
        setShowAddCustomerModal(false);
        fetchCustomers();
      } else if (response.status === 401) {
        alert('You need to be logged in to add customers. Please log in and try again.');
        setShowAddCustomerModal(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to add customer'}`);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/?skip=0&limit=100`);
      if (response.ok) {
        const data = await response.json();
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
          .map(cat => ({
            id: cat.id,
            name: cat.name || cat.category_name || cat.title
          }))
          .filter(cat => cat && cat.name);

        const finalCategories = [{ id: 0, name: 'All' }, ...validCategories];
        console.log('Final categories for dropdown:', finalCategories);
        setCategories(finalCategories);
      } else {
        console.error('Failed to fetch categories');
        setCategories([{ id: 0, name: 'All' }]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([{ id: 0, name: 'All' }]);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      // Fetch more items to support pagination (e.g., 100 items)
      let url = `${API_BASE_URL}/products/?skip=0&limit=100`;

      if (selectedCategory !== 'All') {
        const category = categories.find(cat => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          url = `${API_BASE_URL}/products/?category_id=${category.id}&skip=0&limit=100`;
          console.log('Fetching products for category:', category.name, 'with ID:', category.id);
        }
      }

      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
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
          item => item && item.id && item.name && item.price !== undefined
        );

        // Group items by base name to consolidate products with multiple sizes
        const groupedItems = groupItemsByBaseName(validItems);

        console.log('Grouped items:', groupedItems);
        setAllMenuItems(groupedItems);
      } else {
        console.error('Failed to fetch menu items');
        setAllMenuItems([]);
      }
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

      let url = `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}&skip=0&limit=100`;

      if (selectedCategory !== 'All') {
        const category = categories.find(cat => cat.name === selectedCategory);
        if (category && category.id !== 0) {
          url += `&category_id=${category.id}`;
          console.log('Searching with category filter:', category.name, 'ID:', category.id);
        }
      }

      console.log('Search URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
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
          item => item && item.id && item.name && item.price !== undefined
        );

        let finalItems = validItems;
        if (selectedCategory !== 'All') {
          const category = categories.find(cat => cat.name === selectedCategory);
          if (category && category.id !== 0) {
            finalItems = validItems.filter(item => {
              return (
                item.category_id === category.id ||
                item.category_name === selectedCategory ||
                item.category === selectedCategory
              );
            });
            console.log('Client-side filtered items:', finalItems);
          }
        }
        
        // Group items by base name
        const groupedItems = groupItemsByBaseName(finalItems);
        
        setAllMenuItems(groupedItems);
      } else {
        console.error('Search failed');
        setAllMenuItems([]);
      }
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
    
    items.forEach(item => {
      // Extract base name by removing size indicators in parentheses
      const baseName = item.name.replace(/\s*\([^)]*\)\s*$/i, '').trim();
      
      // Extract size from name if present
      const sizeMatch = item.name.match(/\(([^)]+)\)$/);
      const size = sizeMatch ? sizeMatch[1].trim() : 'Regular';
      
      if (!grouped[baseName]) {
        grouped[baseName] = {
          id: item.id, // Use the first item's ID as base
          name: baseName,
          basePrice: item.price,
          image_url: item.image_url || item.image || item.image_path,
          category_id: item.category_id,
          category_name: item.category_name,
          sizes: []
        };
      }
      
      // Add this size variant
      grouped[baseName].sizes.push({
        name: size,
        price: item.price,
        product_id: item.id // Keep original product ID for cart
      });
    });
    
    // Convert to array
    return Object.values(grouped);
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/?skip=0&limit=100&is_active=true`
      );
      if (response.ok) {
        const data = await response.json();

        let customersArray = [];
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.items && Array.isArray(data.items)) {
          customersArray = data.items;
        } else if (typeof data === 'object' && data.id) {
          customersArray = [data];
        }

        const validCustomers = customersArray.filter(c => c && c.id !== undefined);

        setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }, ...validCustomers]);
      } else {
        setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
    }
  };

  const searchCustomers = async (query) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();

        let customersArray = [];
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.items && Array.isArray(data.items)) {
          customersArray = data.items;
        }

        const validCustomers = customersArray.filter(c => c && c.id !== undefined);

        setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }, ...validCustomers]);
      } else {
        setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([{ id: 0, first_name: 'Guest', last_name: '' }]);
    }
  };

  // ---------------- UI HELPERS ----------------

  const handleAddToCartClick = (item) => {
    if (!item || !item.id) {
      console.error('Invalid item:', item);
      return;
    }

    const availableSizes = item.sizes || [];
    
    // If only one size is available, add directly to cart
    if (availableSizes.length === 1) {
      addToCartWithSize(availableSizes[0], item);
      return;
    }

    // Otherwise, show size modal
    setSelectedMenuItem(item);
    setShowSizeModal(true);
  };

  const addToCartWithSize = (size, menuItem = selectedMenuItem) => {
    if (!menuItem) return;

    const finalPrice = size.price || menuItem.basePrice || 0;
    const productId = size.product_id || menuItem.id;

    const existingIndex = cartItems.findIndex(
      ci => ci.product_id === productId
    );

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
          price: finalPrice
        }
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
    
    // Sum quantities for all size variants of this item
    return cartItems
      .filter(ci => {
        // Check if any of the item's size variants match
        return item.sizes.some(size => size.product_id === ci.product_id);
      })
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

  const getImageUrl = (item) => {
    if (!item) return null;

    const imageUrl = item.image_url || item.image || item.image_path;

    if (imageUrl) {
      if (imageUrl.startsWith('/')) {
        return `${API_BASE_URL.replace('/api/v1', '')}${imageUrl}`;
      }
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `${API_BASE_URL.replace('/api/v1', '')}/${imageUrl}`;
    }

    return null;
  };

  const handleLoadMore = () => {
    setVisibleRows(prev => prev + rowsToLoadMore);
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
  };

  const handleBackToMenu = () => {
    setIsPreviewMode(false);
  };

  // Calculate visible items based on visible rows
  const visibleItems = allMenuItems.slice(0, visibleRows * itemsPerRow);
  const hasMoreToLoad = visibleItems.length < allMenuItems.length;

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;

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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">Add New Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <input
              type="text"
              placeholder="First name *"
              value={newCustomer.first_name}
              onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Last name"
              value={newCustomer.last_name}
              onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="+91 Phone number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="email"
              placeholder="example@mail.com (optional)"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="City"
              value={newCustomer.city}
              onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="State"
              value={newCustomer.state}
              onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-2 sm:mb-3"
            />
            <input
              type="text"
              placeholder="Zip code"
              value={newCustomer.zip_code}
              onChange={(e) => setNewCustomer({ ...newCustomer, zip_code: e.target.value })}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-3 sm:mb-4"
            />
            <div className="flex gap-2">
              <button onClick={addCustomer} disabled={loading} className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Customer'}
              </button>
              <button onClick={() => setShowAddCustomerModal(false)} className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium">Cancel</button>
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

      {/* Customer Panel - Always visible */}
      <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full mb-3 sm:mb-4 md:mb-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">Customer</h2>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
        <div className="mb-3 sm:mb-4">
          <label className="text-muted-foreground text-sm mb-2 block">Select customer</label>
          <div className="relative">
            <Search size={16} className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
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
                  color: isSelected ? 'white' : 'inherit'
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
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: bgColor }}>
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
        // Menu Panel - Full Width
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
              <Search size={16}
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
              const imageUrl = getImageUrl(item);
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

          {/* Load More and Preview buttons */}
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
    // Preview Mode - Respects dark/light mode
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={handleBackToMenu}
        className="px-4 py-2 bg-gray-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-700"
      >
        <ArrowLeft size={16} />
        <span>Back to Menu</span>
      </button>

      {/* Selected Dishes */}
      <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Selected Dishes</h2>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No items in cart</div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex-1">
                  <h3 className="text-card-foreground font-semibold">{item.name || 'Item'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">₹{item.price || 0} each</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <button 
                      onClick={() => updateCartItemQuantity(i, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-card hover:bg-accent rounded text-card-foreground cursor-pointer transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold text-card-foreground">{item.qty || 0}</span>
                    <button 
                      onClick={() => updateCartItemQuantity(i, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="w-24 text-right">
                    <p className="text-card-foreground font-semibold">₹{((item.price || 0) * (item.qty || 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart & Billing Summary */}
      <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Billing Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-card-foreground font-semibold">₹{subtotal.toFixed(2)}</span>
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

        {/* Payment Methods Section */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-card-foreground mb-3">Payment Methods</h3>
          <div className="grid grid-cols-3 gap-2">
            <button className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700">UPI</button>
            <button className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700">Cash</button>
            <button className="px-4 py-3 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700">Card</button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>);
}
export default POS;