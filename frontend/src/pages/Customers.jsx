import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Download,
  Edit,
  Copy,
  IndianRupee,
  Clock,
  ShoppingBag,
  Trash2,
  PlusCircle,
  Plus,
  X,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Customers() {
  const navigate = useNavigate();

  // State management
  const [view, setView] = useState("list");
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [statusFilter, setStatusFilter] = useState("All / Paid / Pending");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Customers from backend
  const [customers, setCustomers] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Orders from backend for selected customer
  const [orders, setOrders] = useState([]);

  // Coupons for offer modal
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");

  // Helpers ------------------------------------------------------

  const getDisplayName = (c) =>
    `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer";

  const getInitials = (c) =>
    getDisplayName(c)
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CU";

  const mapCustomerToUi = (c) => {
    const totalSpentNum = (() => {
      if (!c.total_spent) return 0;
      try {
        const n = Number(c.total_spent);
        return Number.isFinite(n) ? n : 0;
      } catch {
        return 0;
      }
    })();

    return {
      id: c.id,
      name: getDisplayName(c),
      memberSince: new Date(c.created_at).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      }),
      loyaltyPoints: c.loyalty_points ?? 0,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      notes: "",
      totalOrders: c.orders_count ?? 0,
      lifetimeSpend: totalSpentNum,
      avgOrder: 0,
      lastVisit: "—",
    };
  };

  const mapCustomerToEdit = (c) => ({
    id: c.id,
    first_name: c.first_name || "",
    last_name: c.last_name || "",
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    zip_code: c.zip_code || "",
    country: c.country || "",
    is_active: c.is_active ?? true,
  });

  const mapUiToCustomerHeader = (edit) => ({
    first_name: edit.first_name,
    last_name: edit.last_name,
    email: edit.email,
    phone: edit.phone,
    address: edit.address,
    city: edit.city,
    state: edit.state,
    zip_code: edit.zip_code,
    country: edit.country,
    is_active: edit.is_active,
  });

  const loadCustomerOrders = async (customerId) => {
    try {
      const res = await api.get(`/orders/customer/${customerId}`, {
        params: { limit: 50 },
      });
      const data = res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD CUSTOMER ORDERS ERROR:", err?.response?.data || err);
      setOrders([]);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const res = await api.get("/coupons/available");
      const data = res.data || {};
      const eligible = data.eligible || [];
      setAvailableCoupons(eligible);
      if (eligible.length > 0) {
        setSelectedCoupon(eligible[0].code);
      }
    } catch (err) {
      console.error("LOAD COUPONS ERROR:", err?.response?.data || err);
      setAvailableCoupons([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers/", {
        params: { skip: 0, limit: 100 },
      });
      const list = res.data.data || res.data || [];
      setCustomers(list);
    } catch (err) {
      console.error("LOAD CUSTOMERS ERROR:", err?.response?.data || err);
      alert("Failed to load customers");
    }
  };

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
      loadCustomers();
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

  // Initial load of customers - REMOVED AUTO-SELECTION
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filters ------------------------------------------------------

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return customers.map(mapCustomerToUi);
    }
    const q = customerSearchQuery.toLowerCase();
    return customers
      .map(mapCustomerToUi)
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(q) ||
          customer.phone.includes(customerSearchQuery) ||
          customer.email.toLowerCase().includes(customerSearchQuery)
      );
  }, [customers, customerSearchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        (order.order_number || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (order.notes || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      let statusText = (order.status || "").toLowerCase();
      let displayStatus = "Pending";
      if (statusText === "completed" || statusText === "paid") {
        displayStatus = "Paid";
      }

      const matchesStatus =
        statusFilter === "All / Paid / Pending" ||
        displayStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Event handlers -----------------------------------------------

  const handleSelectCustomer = async (customerUi) => {
    const backend = customers.find((c) => c.id === customerUi.id);
    if (!backend) return;

    setSelectedCustomerId(backend.id);
    setCustomerData(mapCustomerToUi(backend));
    setEditData(mapCustomerToEdit(backend));
    setIsEditing(false);
    setView("detail");
    await loadCustomerOrders(backend.id);
  };

  const handleEdit = async () => {
    if (!customerData || !editData) return;

    if (isEditing) {
      try {
        const body = mapUiToCustomerHeader(editData);
        const res = await api.put(`/customers/${customerData.id}`, body);
        const updated = res.data;

        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setCustomerData(mapCustomerToUi(updated));
        setEditData(mapCustomerToEdit(updated));

        alert("Customer details saved successfully!");
      } catch (err) {
        console.error("UPDATE CUSTOMER ERROR:", err?.response?.data || err);
        alert("Failed to update customer");
        return;
      }
    } else {
      const backend = customers.find((c) => c.id === customerData.id);
      if (backend) setEditData(mapCustomerToEdit(backend));
    }

    setIsEditing(!isEditing);
  };

  const handleStartPOS = () => {
    if (!customerData) return;

    // Navigate to POS page with customer data
    navigate('/pos', {
      state: {
        customer: {
          id: customerData.id,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email
        }
      }
    });
  };

  const handleApplyOffer = async () => {
    await loadAvailableCoupons();
    setShowOfferModal(true);
  };

  const confirmApplyOffer = async () => {
    if (!customerData || !selectedCoupon) return;

    try {
      // Validate the coupon first (optional, but good practice)
      const validateRes = await api.post("/coupons/validate", {
        coupon_code: selectedCoupon,
        subtotal: customerData.lifetimeSpend || 0,
        customer_id: customerData.id.toString()
      });

      if (validateRes.data.valid && validateRes.data.eligible) {
        alert(
          `✅ Offer "${selectedCoupon}" applied to ${customerData.name}'s account!\n\nDiscount: ${validateRes.data.coupon.discount_type === 'percentage' ? validateRes.data.coupon.discount_value + '%' : '₹' + validateRes.data.coupon.discount_value}\n\nThey can use this coupon on their next order.`
        );
        setShowOfferModal(false);
      } else {
        alert(`❌ Coupon validation failed: ${validateRes.data.message || 'Not eligible'}`);
      }
    } catch (err) {
      console.error("APPLY OFFER ERROR:", err?.response?.data || err);
      alert("Failed to apply offer. Please try again.");
    }
  };

  const handleDeleteCustomer = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerData) return;

    try {
      await api.delete(`/customers/${customerData.id}`);

      // Remove from local state
      setCustomers((prev) =>
        prev.filter((c) => c.id !== customerData.id)
      );

      alert(
        `✅ Customer ${customerData.name} has been deactivated successfully.`
      );

      setShowDeleteModal(false);
      setView("list");
      setCustomerData(null);
      setEditData(null);
      setSelectedCustomerId(null);
      setOrders([]);
    } catch (err) {
      console.error("DELETE CUSTOMER ERROR:", err?.response?.data || err);
      alert("Failed to delete customer. Please try again.");
    }
  };

  // Open popup in NEW TAB
  const handleViewOrder = (order) => {
    const statusText = (order.status || "").toLowerCase() === "completed" ? "Paid" : "Pending";

    // Create HTML content for the popup
    const popupContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Details - ${order.order_number}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .modal {
            background: #1e293b;
            border-radius: 16px;
            padding: 32px;
            max-width: 450px;
            width: 100%;
            color: #f1f5f9;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .modal h3 {
            margin: 0 0 24px 0;
            font-size: 24px;
            font-weight: 600;
            color: #f1f5f9;
          }
          .detail-row {
            margin-bottom: 20px;
          }
          .label {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .value {
            font-size: 15px;
            color: #f1f5f9;
            font-weight: 500;
          }
          .total {
            font-size: 20px;
            font-weight: 700;
            color: #0d9488;
          }
          .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
            background: ${statusText === "Paid" ? "#0d9488" : "#ca8a04"};
            color: white;
          }
          .btn-ok {
            width: 100%;
            padding: 14px;
            margin-top: 28px;
            background: #0d9488;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-ok:hover {
            background: #0f766e;
            transform: translateY(-1px);
          }
          .btn-ok:active {
            transform: translateY(0);
          }
          .divider {
            height: 1px;
            background: #334155;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="modal">
          <h3>Order Details</h3>
          
          <div class="detail-row">
            <div class="label">Order ID:</div>
            <div class="value">#${order.order_number}</div>
          </div>
          
          <div class="detail-row">
            <div class="label">Date:</div>
            <div class="value">${order.created_at}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="detail-row">
            <div class="label">Items:</div>
            <div class="value">${order.notes || "Masala Dosa, Coffee"}</div>
          </div>
          
          <div class="detail-row">
            <div class="label">Total:</div>
            <div class="value total">₹${order.total}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="detail-row">
            <div class="label">Payment:</div>
            <span class="badge">${statusText}, UPI</span>
          </div>
          
          <button class="btn-ok" onclick="window.close()">OK</button>
        </div>
        
        <script>
          window.focus();
        </script>
      </body>
      </html>
    `;

    const newTab = window.open('', '_blank');
    newTab.document.write(popupContent);
    newTab.document.close();
  };

  const handleReorder = (order) => {
    if (!customerData) return;
    alert(
      `Reordering items from Order ${order.order_number}\n\nAdded to POS cart for ${customerData.name}`
    );
  };

  const handleExport = () => {
    alert(
      "Exporting order history...\n\nFormat: CSV\nIncluding: All orders, payments, and customer details"
    );
  };

  // Derived stats for detail view
  const computedTotalOrders = orders.length;
  const computedLifetimeSpend = customerData?.lifetimeSpend ?? 0;
  const computedAvgOrder =
    computedTotalOrders > 0
      ? Math.round(computedLifetimeSpend / computedTotalOrders)
      : 0;

  // DETAIL VIEW --------------------------------------------------
  if (view === "detail" && customerData && editData) {
    return (
      <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-5 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
                Delete Customer
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">
                Are you sure you want to delete {customerData.name}? This will
                deactivate their profile and all order history. This action cannot
                be undone.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base bg-muted text-foreground rounded-lg hover:bg-secondary font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offer Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-5 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
                Apply Offer
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Select an offer to apply to {customerData.name}'s next order:
              </p>
              <select
                value={selectedCoupon}
                onChange={(e) => setSelectedCoupon(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-5 sm:mb-6"
              >
                {availableCoupons.length > 0 ? (
                  availableCoupons.map((coupon) => (
                    <option key={coupon.id} value={coupon.code}>
                      {coupon.code} - {coupon.description ||
                        (coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% off`
                          : `₹${coupon.discount_value} off`)}
                    </option>
                  ))
                ) : (
                  <option value="">No coupons available</option>
                )}
              </select>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={confirmApplyOffer}
                  disabled={!selectedCoupon || availableCoupons.length === 0}
                  className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Offer
                </button>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base bg-muted text-foreground rounded-lg hover:bg-secondary font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setView("list");
                setIsEditing(false);
              }}
              className="text-teal-400 hover:text-teal-300 p-1"
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Customer Details
            </h2>
          </div>
        </div>

        <div className="mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Basic Details Card */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-end mb-4 sm:mb-5 lg:mb-6">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs sm:text-sm font-medium"
              >
                {isEditing ? (
                  <>
                    <Save size={14} className="sm:w-4 sm:h-4" /> Save
                  </>
                ) : (
                  <>
                    <Edit size={14} className="sm:w-4 sm:h-4" /> Edit
                  </>
                )}
              </button>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
              <div className="bg-muted text-foreground w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
                {getInitials(customerData)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-card-foreground mb-1">
                  {customerData.name}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Customer since {customerData.memberSince}
                </p>
                <span className="inline-block px-2.5 sm:px-3 py-1 bg-teal-600 text-white text-xs sm:text-sm rounded-full font-medium">
                  Loyalty: {customerData.loyaltyPoints} pts (₹{(customerData.loyaltyPoints / 10).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className="w-full bg-muted text-foreground rounded-lg border border-border px-3 py-2 text-sm sm:text-base outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm sm:text-base">
                    {customerData.phone}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    className="w-full bg-muted text-foreground rounded-lg border border-border px-3 py-2 text-sm sm:text-base outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm sm:text-base break-all">
                    {customerData.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    className="w-full bg-muted text-foreground rounded-lg border border-border px-3 py-2 text-sm sm:text-base outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm sm:text-base">
                    {customerData.address}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={customerData.notes}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        notes: e.target.value,
                      })
                    }
                    className="w-full bg-muted text-foreground rounded-lg border border-border px-3 py-2 text-sm sm:text-base outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-[80px]"
                  />
                ) : (
                  <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm sm:text-base">
                    {customerData.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 mt-4 sm:mt-5 lg:mt-6">
              <div className="bg-muted rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <Copy
                    size={14}
                    className="sm:w-4 sm:h-4 text-muted-foreground"
                  />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground font-medium">
                    Total Orders
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">
                  {computedTotalOrders}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <IndianRupee
                    size={14}
                    className="sm:w-4 sm:h-4 text-muted-foreground"
                  />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground font-medium">
                    Lifetime Spend
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">
                  ₹{computedLifetimeSpend.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <ShoppingBag
                    size={14}
                    className="sm:w-4 sm:h-4 text-muted-foreground"
                  />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground font-medium">
                    Avg Order
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">
                  ₹{computedAvgOrder}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <Clock
                    size={14}
                    className="sm:w-4 sm:h-4 text-muted-foreground"
                  />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground font-medium">
                    Last Visit
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">
                  {customerData.lastVisit}
                </p>
              </div>
            </div>
          </div>
          {/* Past Orders */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                Past Orders
              </h3>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs sm:text-sm font-medium"
              >
                <Download size={14} className="sm:w-[18px] sm:h-[18px]" />
                Export
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Search orders
                </label>
                <input
                  type="text"
                  placeholder="Order ID, items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Date range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>Last 30 days</option>
                  <option>Last 7 days</option>
                  <option>Last 90 days</option>
                  <option>All time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>All / Paid / Pending</option>
                  <option>Paid</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>

            {/* Orders Table - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary/10 dark:bg-transparent border-b border-border">
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Date
                    </th>
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Items
                    </th>
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Total
                    </th>
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Payment
                    </th>
                    <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const statusText =
                      (order.status || "").toLowerCase() === "completed"
                        ? "Paid"
                        : "Pending";
                    const payments = [statusText];
                    return (
                      <tr
                        key={index}
                        className="border-b border-border hover:bg-muted transition"
                      >
                        <td className="py-3 px-2 text-xs lg:text-sm text-foreground font-medium">
                          {order.order_number}
                        </td>
                        <td className="py-3 px-2 text-xs lg:text-sm text-foreground whitespace-nowrap">
                          {order.created_at}
                        </td>
                        <td className="py-3 px-2 text-xs lg:text-sm text-foreground">
                          {order.notes || "—"}
                        </td>
                        <td className="py-3 px-2 text-xs lg:text-sm text-foreground font-semibold">
                          ₹{order.total}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1.5 flex-wrap">
                            {payments.map((method, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 text-[10px] lg:text-xs rounded-full font-medium ${method === "Pending"
                                  ? "bg-yellow-600"
                                  : "bg-teal-600"
                                  } text-white`}
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="px-2.5 py-1 bg-teal-600 text-white rounded text-[10px] lg:text-xs hover:bg-teal-700 font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleReorder(order)}
                              className="px-2.5 py-1 bg-teal-600 text-white rounded text-[10px] lg:text-xs hover:bg-teal-700 font-medium"
                            >
                              Reorder
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Orders Cards - Mobile */}
            <div className="md:hidden space-y-3">
              {filteredOrders.map((order, index) => {
                const statusText =
                  (order.status || "").toLowerCase() === "completed"
                    ? "Paid"
                    : "Pending";
                const payments = [statusText];
                return (
                  <div
                    key={index}
                    className="bg-muted rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {order.order_number}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                          {order.created_at}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {payments.map((method, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 text-[10px] rounded-full font-medium whitespace-nowrap ${method === "Pending"
                              ? "bg-yellow-600"
                              : "bg-teal-600"
                              } text-white`}
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground mb-2 sm:mb-3 line-clamp-2">
                      {order.notes || "—"}
                    </p>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-base sm:text-lg font-bold text-foreground">
                        ₹{order.total}
                      </p>
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="px-2.5 sm:px-3 py-1 bg-teal-600 text-white rounded text-[10px] sm:text-xs hover:bg-teal-700 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-2.5 sm:px-3 py-1 bg-teal-600 text-white rounded text-[10px] sm:text-xs hover:bg-teal-700 font-medium"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-10 sm:py-12">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  No orders found matching your filters
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg hover:bg-secondary transition gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm lg:text-base text-foreground mb-0.5 sm:mb-1">
                    Create New Order
                  </p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    Start POS with {customerData.name.split(" ")[0]}'s details
                  </p>
                </div>
                <button
                  onClick={handleStartPOS}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 whitespace-nowrap text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  <PlusCircle
                    size={14}
                    className="sm:w-[18px] sm:h-[18px]"
                  />
                  Start
                </button>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg hover:bg-secondary transition gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm lg:text-base text-foreground mb-0.5 sm:mb-1">
                    Send Offer
                  </p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    Apply coupon to next order
                  </p>
                </div>
                <button
                  onClick={handleApplyOffer}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 whitespace-nowrap text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  <Copy size={14} className="sm:w-[18px] sm:h-[18px]" />
                  Apply
                </button>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg hover:bg-secondary transition gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm lg:text-base text-foreground mb-0.5 sm:mb-1">
                    Delete Customer
                  </p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    Remove profile and history
                  </p>
                </div>
                <button
                  onClick={handleDeleteCustomer}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // LIST VIEW ----------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Customer List
        </h2>
        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white border-none rounded-md text-sm cursor-pointer flex items-center gap-1 sm:gap-2 hover:bg-teal-700 flex-shrink-0"
        >
          <Plus size={16} />
          <span>Add </span>
        </button>
      </div>
      <div className="mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Customer List Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
              Customers
            </h3>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full bg-muted text-foreground border border-border rounded-lg pl-10 pr-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Customer List - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/10 dark:bg-transparent border-b border-border">
                  <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                    Phone
                  </th>
                  <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                    Email
                  </th>
                  <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                    Orders
                  </th>
                  <th className="text-left py-3 px-2 text-xs lg:text-sm text-muted-foreground font-bold">
                    Loyalty
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="border-b border-border cursor-pointer transition hover:bg-muted"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-foreground w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-xs lg:text-sm text-foreground font-medium">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs lg:text-sm text-foreground">
                      {customer.phone}
                    </td>
                    <td className="py-3 px-2 text-xs lg:text-sm text-foreground">
                      {customer.email}
                    </td>
                    <td className="py-3 px-2 text-xs lg:text-sm text-foreground font-semibold">
                      {customer.totalOrders}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-col">
                        <span className="inline-block px-2 py-0.5 bg-teal-600 text-white text-[10px] rounded-full font-medium w-fit">
                          {customer.loyaltyPoints} pts
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          Value: ₹{(customer.loyaltyPoints / 10).toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer List - Mobile */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className="p-3 sm:p-4 rounded-lg cursor-pointer transition bg-muted hover:bg-secondary"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="bg-background text-foreground w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {customer.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {customer.phone}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Orders:{" "}
                    <span className="font-semibold text-foreground">{customer.totalOrders}</span>
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full font-medium">
                    {customer.loyaltyPoints} pts (₹{(customer.loyaltyPoints / 10).toFixed(2)})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-xs sm:text-sm">
                No customers found
              </p>
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
        </div>
      </div>
    </div>
  );
}
export default Customers;
