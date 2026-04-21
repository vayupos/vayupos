import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Printer, Database, Tag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


function POS() {
  const [selectedCustomer, setSelectedCustomer] = useState('Ravi Kumar');
  const [notes, setNotes] = useState('No onions, extra spicy');
  const [searchMenu, setSearchMenu] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [couponCode, setCouponCode] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [inputCoupon, setInputCoupon] = useState('');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [draftBillNumber, setDraftBillNumber] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const customers = ['Ravi Kumar', 'Anita', 'Mohit', 'Guest'];

  const sizes = [
    { name: 'Small', priceModifier: 0 },
    { name: 'Medium', priceModifier: 10 },
    { name: 'Large', priceModifier: 20 },
    { name: 'Regular', priceModifier: 0 }
  ];

  // Available coupons with eligibility conditions
  const availableCoupons = [
    {
      code: 'NEW20',
      discount: 20,
      type: 'percentage',
      description: '20% off for new customers',
      minOrder: 0
    },
    {
      code: 'FLAT50',
      discount: 50,
      type: 'fixed',
      description: '₹50 flat discount',
      minOrder: 0
    },
    {
      code: 'SAVE100',
      discount: 100,
      type: 'fixed',
      description: '₹100 off on orders above ₹200',
      minOrder: 200
    },
    {
      code: 'WELCOME10',
      discount: 10,
      type: 'percentage',
      description: '10% off welcome offer',
      minOrder: 0
    }
  ];

  // Fetch menu items based on selected category
  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchMenuItems = async () => {
    try {
      // Mock data for demonstration
      const allMenuItems = [
        {
          name: 'Masala Dosa',
          price: 80,
          category: 'South Indian',
          image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=300&fit=crop'
        },
        {
          name: 'Idli (2 pcs)',
          price: 40,
          category: 'South Indian',
          image: 'https://images.unsplash.com/photo-1589301773859-34462e28a3e6?w=300&h=300&fit=crop'
        },
        {
          name: 'Vada',
          price: 35,
          category: 'South Indian',
          image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=300&fit=crop'
        },
        {
          name: 'Filter Coffee',
          price: 25,
          category: 'Beverages',
          image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=300&h=300&fit=crop'
        },
        {
          name: 'Lemon Soda',
          price: 30,
          category: 'Beverages',
          image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe1f0b?w=300&h=300&fit=crop'
        },
        {
          name: 'Veg Combo',
          price: 150,
          category: 'Combos',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop'
        }
      ];

      // Filter based on category
      const filtered = selectedCategory === 'All'
        ? allMenuItems
        : allMenuItems.filter(item => item.category === selectedCategory);

      setMenuItems(filtered);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  // Filter menu items based on search only (category filtering handled by API)
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchMenu.toLowerCase())
  );

  const [cartItems, setCartItems] = useState([
    { name: 'Masala Dosa', size: 'Medium', qty: 2, price: 90 },
    { name: 'Filter Coffee', size: 'Regular', qty: 1, price: 25 }
  ]);

  const updateQuantity = (index, change) => {
    const newCart = [...cartItems];
    newCart[index].qty += change;
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    }
    setCartItems(newCart);
  };

  const handleAddToCartClick = (item) => {
    setSelectedMenuItem(item);
    setShowSizeModal(true);
  };

  const addToCartWithSize = (size) => {
    if (!selectedMenuItem) return;

    const finalPrice = selectedMenuItem.price + size.priceModifier;
    const itemKey = `${selectedMenuItem.name}-${size.name}`;

    const existingIndex = cartItems.findIndex(
      ci => ci.name === selectedMenuItem.name && ci.size === size.name
    );

    if (existingIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingIndex].qty += 1;
      setCartItems(newCart);
    } else {
      setCartItems([
        ...cartItems,
        {
          name: selectedMenuItem.name,
          size: size.name,
          qty: 1,
          price: finalPrice
        }
      ]);
    }

    setShowSizeModal(false);
    setSelectedMenuItem(null);
  };

  const updateMenuQuantity = (item, size, change) => {
    const existingIndex = cartItems.findIndex(
      ci => ci.name === item.name && ci.size === size.name
    );

    if (existingIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingIndex].qty += change;
      if (newCart[existingIndex].qty <= 0) {
        newCart.splice(existingIndex, 1);
      }
      setCartItems(newCart);
    }
  };

  const getMenuItemQuantity = (itemName) => {
    return cartItems
      .filter(ci => ci.name === itemName)
      .reduce((sum, ci) => sum + ci.qty, 0);
  };

  const addCustomer = () => {
    if (newCustomer.name) {
      alert(`Customer ${newCustomer.name} added successfully!`);
      setNewCustomer({ name: '', phone: '', email: '' });
      setShowAddCustomerModal(false);
    } else {
      alert('Please enter customer name');
    }
  };

  const applyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === inputCoupon.toUpperCase());
    if (coupon) {
      if (subtotal >= coupon.minOrder) {
        setCouponCode(coupon.code);
        setInputCoupon('');
        setShowCouponModal(false);
        alert(`Coupon "${coupon.code}" applied successfully!`);
      } else {
        alert(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
      }
    } else {
      alert('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  const handleDatabaseClick = () => {
    // Navigate to menu categories page
    window.location.href = '/menu';
    // Or if using React Router: navigate('/menu-categories');
  };

  const handleSaveDraft = () => {
    const billNum = `DRAFT-${Date.now()}`;
    setDraftBillNumber(billNum);
    setShowSaveDraftModal(true);
  };

  const saveDraft = () => {
    // Here you would save the draft to your backend
    alert(`Draft saved with bill number: ${draftBillNumber}`);
    setShowSaveDraftModal(false);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const printBill = () => {
    const printContent = document.getElementById('print-content');
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Bill</title>');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // Payment Handlers - Simplified
  const handlePaymentSelection = (method) => {
    setSelectedPaymentMethod(method);
    alert(`Payment method selected: ${method}\nTotal Amount: ₹${total.toFixed(2)}\n\nOrder will be processed with ${method} payment.`);
    // Here you would typically save the order with the selected payment method
    // and then clear the cart
    setCartItems([]);
    setSelectedPaymentMethod('');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Calculate discount based on coupon
  let discount = 0;
  if (couponCode) {
    const appliedCoupon = availableCoupons.find(c => c.code === couponCode);
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        discount = subtotal * (appliedCoupon.discount / 100);
      } else {
        discount = appliedCoupon.discount;
      }
    }
  }

  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal - discount + cgst + sgst;

  // Separate eligible and ineligible coupons
  const eligibleCoupons = availableCoupons.filter(c => subtotal >= c.minOrder);
  const ineligibleCoupons = availableCoupons.filter(c => subtotal < c.minOrder);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-5 max-w-[100vw] overflow-x-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Size Selection Modal */}
      {showSizeModal && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground">Select Size</h3>
              <button onClick={() => { setShowSizeModal(false); setSelectedMenuItem(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{selectedMenuItem.name}</p>
            <div className="space-y-2">
              {sizes.map((size, i) => (
                <button
                  key={i}
                  onClick={() => addToCartWithSize(size)}
                  className="w-full p-3 bg-muted hover:bg-teal-600 hover:text-white rounded-lg transition-colors flex justify-between items-center"
                >
                  <span className="font-medium">{size.name}</span>
                  <span>₹{selectedMenuItem.price + size.priceModifier}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Draft Modal */}
      {showSaveDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md">
            <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground mb-4">Save Draft Order</h3>
            <div className="mb-4">
              <label className="text-muted-foreground text-sm mb-2 block">Bill Number</label>
              <input
                type="text"
                value={draftBillNumber}
                onChange={(e) => setDraftBillNumber(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground"
              />
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-sm mb-2 block">Customer</label>
              <input
                type="text"
                value={selectedCustomer}
                readOnly
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground"
              />
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-sm mb-2 block">Total Amount</label>
              <input
                type="text"
                value={`₹${total.toFixed(2)}`}
                readOnly
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground font-semibold"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveDraft} className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium">Save Draft</button>
              <button onClick={() => setShowSaveDraftModal(false)} className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold">Print Preview</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-600 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>

            <div id="print-content" className="bg-white p-6 text-black">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Restaurant Name</h1>
                <p className="text-sm">123 Main Street, City</p>
                <p className="text-sm">Phone: +91 1234567890</p>
                <p className="text-sm">GSTIN: 29XXXXX1234X1ZX</p>
              </div>

              <div className="border-t border-b border-gray-300 py-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Bill No: {Date.now()}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="text-sm">Customer: {selectedCustomer}</div>
              </div>
              
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2">{item.name} ({item.size})</td>
                      <td className="text-center py-2">{item.qty}</td>
                      <td className="text-right py-2">₹{item.price}</td>
                      <td className="text-right py-2">₹{(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponCode}):</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>CGST (2.5%):</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST (2.5%):</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-sm">
                <p>Thank you for your visit!</p>
                <p>Please visit again</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={printBill} className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">Print</button>
              <button onClick={() => setShowPrintModal(false)} className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal with Eligibility */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground mb-3 sm:mb-4">Apply Coupon</h3>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-3 sm:mb-4"
            />

            {/* Eligible Coupons */}
            {eligibleCoupons.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-2">✓ Eligible Coupons:</p>
                <div className="space-y-2">
                  {eligibleCoupons.map((coupon, i) => (
                    <div
                      key={i}
                      className="bg-muted rounded p-2 sm:p-3 cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                      onClick={() => setInputCoupon(coupon.code)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm sm:text-base">{coupon.code}</span>
                        <span className="text-xs sm:text-sm">{coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`}</span>
                      </div>
                      <p className="text-xs sm:text-sm mt-1 opacity-80">{coupon.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ineligible Coupons */}
            {ineligibleCoupons.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Available Coupons:</p>
                <div className="space-y-2">
                  {ineligibleCoupons.map((coupon, i) => (
                    <div key={i} className="bg-muted rounded p-2 sm:p-3 opacity-60">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm sm:text-base">{coupon.code}</span>
                        <span className="text-xs sm:text-sm">{coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`}</span>
                      </div>
                      <p className="text-xs sm:text-sm mt-1">{coupon.description}</p>
                      <p className="text-xs text-red-500 mt-1">Minimum order ₹{coupon.minOrder} required (Current: ₹{subtotal.toFixed(2)})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={applyCoupon} className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium">Apply</button>
              <button onClick={() => { setShowCouponModal(false); setInputCoupon(''); }} className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-card rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-[92vw] sm:max-w-md">
            <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground mb-3 sm:mb-4">Add New Customer</h3>
            <input
              type="text"
              placeholder="Full name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
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
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm sm:text-base text-foreground mb-3 sm:mb-4"
            />
            <div className="flex gap-2">
              <button onClick={addCustomer} className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base font-medium">Add</button>
              <button onClick={() => setShowAddCustomerModal(false)} className="flex-1 py-2 sm:py-2.5 bg-muted text-foreground rounded-lg text-sm sm:text-base font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
        <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-foreground">POS System</h2>
      </div>

      {/* Customer Panel - Full Width */}
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
          {filteredCustomers.map((customer, i) => {
            const initial = customer.charAt(0).toUpperCase();
            const colors = ['#4A5568', '#2D5A7B', '#8B6F47', '#6B7280'];
            const bgColor = colors[i % colors.length];
            const isSelected = selectedCustomer === customer;
            return (
              <button
                key={i}
                onClick={() => setSelectedCustomer(customer)}
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
                  {customer === 'Guest' ? '👤' : initial}
                </div>
                <span className="text-smwhitespace-nowrap">{customer}</span>
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
</div>{/* Menu and Cart Side by Side */}
  <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 sm:gap-4 md:gap-5">
    {/* Menu Panel */}
    <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
        <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">Menu</h2>
        <button
          onClick={handleDatabaseClick}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0">
          <Database size={16} />
          <span>DB</span>
        </button>
      </div>
      <div className="mb-3 sm:mb-4">
        <label className="text-muted-foreground text-sm mb-2 block">Search items</label>
        <div className="relative">
          <Search size={16} className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
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
        <label className="text-muted-foreground text-sm mb-2 block">Categories</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-muted text-foreground border border-border rounded-md outline-none px-3 py-2 text-sm sm:text-base"
        >
          <option>All</option>
          <option>South Indian</option>
          <option>Beverages</option>
          <option>Breads</option>
          <option>Combos</option>
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {filteredMenuItems.map((item, i) => {
          const quantity = getMenuItemQuantity(item.name);
          return (
            <div key={i} className="bg-secondary rounded-lg overflow-hidden flex flex-col shadow-sm">
              <div className="aspect-square w-full overflow-hidden bg-gray-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200/1ABC9C/FFFFFF?text=' + encodeURIComponent(item.name.substring(0, 3));
                  }}
                />
              </div>
              <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2">
                <div>
                  <h3 className="text-foreground text-sm font-semibold mb-0.5 sm:mb-1 line-clamp-2 leading-tight">{item.name}</h3>
                  <p className="text-foreground text-sm font-medium">₹{item.price}</p>
                </div>
                {quantity === 0 ? (
                  <button
                    onClick={() => handleAddToCartClick(item)}
                    className="px-3 py-1.5 bg-teal-600 text-white border-none rounded-full text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-teal-700 w-full"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                ) : (
                  <div className="text-center py-1.5 bg-teal-600 text-white rounded-full text-sm font-semibold">
                    {quantity} in cart
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Cart & Billing Panel */}
    <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 md:p-5 w-full h-fit">
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
        <h2 className="text-foreground text-sm sm:text-base md:text-lg font-semibold">Cart & Billing</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCouponModal(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0">
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
            <div key={i} className="border-b border-border grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 p-2 sm:p-2.5 items-center">
              <div className="text-foreground text-xs sm:text-sm">
                <div className="truncate">{item.name}</div>
                <div className="text-muted-foreground text-xs">({item.size})</div>
              </div>
              <div className="text-foreground text-xs sm:text-sm">{item.qty}</div>
              <div className="text-foreground text-xs sm:text-sm">₹{item.price}</div>
              <div className="text-foreground text-xs sm:text-sm">₹{item.price * item.qty}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Summary */}
      <div className="border-t border-border pt-3 sm:pt-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground font-semibold">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">Discount</span>
            {couponCode && (
              <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded cursor-pointer hover:bg-red-600 transition-colors" onClick={removeCoupon} title="Click to remove">
                {couponCode} ×
              </span>
            )}
          </div>
          <span className="text-foreground font-semibold">{discount > 0 ? `- ₹${discount.toFixed(2)}` : '₹0.00'}</span>
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

      {/* Payment Buttons - Simplified */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground text-sm">To collect</span>
          <span className="text-foreground font-semibold text-lg">₹{total.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => handlePaymentSelection('UPI')}
            className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700">
            UPI
          </button>
          <button
            onClick={() => handlePaymentSelection('Cash')}
            className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700">
            Cash
          </button>
          <button
            onClick={() => handlePaymentSelection('Card')}
            className="px-2 py-2 sm:py-2.5 bg-teal-600 text-white border-none rounded-lg text-xs sm:text-sm cursor-pointer font-medium hover:bg-teal-700">
            Card
          </button>
        </div>

        {/* Save Draft and Print Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSaveDraft}
            className="w-full py-2.5 bg-gray-600 text-white border-none rounded-lg text-sm cursor-pointer font-medium hover:bg-gray-700 transition-colors">
            Save Draft
          </button>
          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-teal-600 text-white border-none rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 font-medium hover:bg-teal-700 transition-colors">
            <Printer size={16} />
            <span>Print Bill</span>
          </button>
        </div>

        <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
          Select payment method to complete the order. Print sends bill to printer and logs to Past Orders.
        </p>
      </div>
    </div>
  </div>
</div>);
}
export default POS;