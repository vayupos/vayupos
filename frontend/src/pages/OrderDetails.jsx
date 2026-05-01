import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Printer,
    Download,
    Calendar,
    User,
    CreditCard,
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Receipt
} from 'lucide-react';
import { formatDateTime, formatPaymentMethod } from '../utils/formatters';
import api from '../api/axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                // The orderId from params is now expected to be the order_number or numeric id
                const response = await api.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Could not load order details. It might have been deleted or the ID is incorrect.');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);


    const handleDownloadPDF = () => {
        if (!order) return;

        try {
            const doc = new jsPDF({
                unit: 'mm',
                format: [80, 150]
            });

            let y = 10;
            doc.setFontSize(14);
            doc.setFont('courier', 'bold');
            doc.text('VAYUPOS INVOICE', 40, y, { align: 'center' });
            y += 8;

            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.text(`Order: ${order.order_number || order.id}`, 5, y); y += 4;
            doc.text(`Date : ${formatDateTime(order.created_at)}`, 5, y); y += 4;

            const customerName = order.customer ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : 'Guest';
            doc.text(`Cust : ${customerName}`, 5, y); y += 6;

            doc.line(5, y, 75, y); y += 5;

            // Table Headers
            doc.setFont('courier', 'bold');
            doc.text('Item', 5, y);
            doc.text('Qty', 45, y);
            doc.text('Price', 55, y);
            doc.text('Total', 75, y, { align: 'right' }); y += 4;
            doc.line(5, y, 75, y); y += 5;

            doc.setFont('courier', 'normal');
            order.order_items.forEach((item) => {
                const name = item.product_name || 'Item';
                const qty = item.quantity || 1;
                const price = item.unit_price || 0;
                const lineTotal = qty * price;

                // Wrap text for item name
                const splitName = doc.splitTextToSize(name, 35);
                doc.text(splitName, 5, y);
                doc.text(qty.toString(), 45, y);
                doc.text(price.toFixed(2), 55, y);
                doc.text(lineTotal.toFixed(2), 75, y, { align: 'right' });

                y += (splitName.length * 4);
                if (y > 130) { doc.addPage(); y = 10; }
            });

            y += 2;
            doc.line(5, y, 75, y); y += 5;

            doc.text('Subtotal:', 5, y);
            doc.text(`₹${order.subtotal.toFixed(2)}`, 75, y, { align: 'right' }); y += 4;

            const cgst = (order.tax / 2).toFixed(2);
            const sgst = (order.tax / 2).toFixed(2);
            doc.text('CGST (2.5%):', 5, y);
            doc.text(`₹${cgst}`, 75, y, { align: 'right' }); y += 4;
            doc.text('SGST (2.5%):', 5, y);
            doc.text(`₹${sgst}`, 75, y, { align: 'right' }); y += 4;

            if (order.discount > 0) {
                doc.text('Discount:', 5, y);
                doc.text(`- ₹${order.discount.toFixed(2)}`, 75, y, { align: 'right' }); y += 4;
            }

            y += 2;
            doc.setFontSize(10);
            doc.setFont('courier', 'bold');
            doc.text('TOTAL:', 5, y);
            doc.text(`₹${order.total.toFixed(2)}`, 75, y, { align: 'right' }); y += 6;

            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.text(`Payment: ${formatPaymentMethod(order.payment_method)}`, 5, y); y += 5;

            doc.line(5, y, 75, y); y += 6;
            doc.text('Thank you for your visit!', 40, y, { align: 'center' });

            doc.save(`Order_${order.order_number || order.id}.pdf`);
        } catch (err) {
            console.error('PDF Generation error:', err);
            alert('Error generating PDF');
        }
    };

    const handlePrint = () => {
        // Correct identifier for print route
        const identifier = order.order_number || order.id;
        window.open(`/print-bill/${identifier}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <RefreshCw className="animate-spin h-10 w-10 text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse text-lg">Fetching order details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border border-border shadow-xl rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Order Not Found</h2>
                    <p className="text-muted-foreground mb-8 text-sm">{error || "We couldn't find the order you're looking for."}</p>
                    <button
                        onClick={() => navigate('/pastorders')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                    >
                        <ArrowLeft size={20} />
                        Back to Past Orders
                    </button>
                </div>
            </div>
        );
    }

    const customerName = order.customer ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : 'Guest';

    // Status colors
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/pastorders')}
                            className="p-2.5 bg-background rounded-xl border border-border hover:bg-muted transition-colors shadow-sm"
                            title="Back"
                        >
                            <ArrowLeft size={20} className="text-foreground" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground">Order Overview</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                <Receipt size={14} />
                                {order.order_number}
                            </p>
                        </div>
                    </div>
                        <button
                            onClick={() => navigate('/pos', { state: { addToOrderId: order.id, orderNumber: order.order_number } })}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg hover:shadow-amber-500/20"
                        >
                            <ShoppingBag size={18} />
                            <span>Add Items</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-muted transition-all shadow-sm text-foreground"
                        >
                            <Printer size={18} />
                            <span>Print Bill</span>
                        </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={18} className="text-primary" />
                                    <h3 className="font-bold text-foreground">Items Ordered</h3>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase">{order.order_items?.length || 0} Items</span>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30 text-[11px] uppercase font-bold text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3">Item</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {order.order_items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-foreground text-sm">{item.product_name}</p>
                                                    <p className="text-[11px] text-muted-foreground uppercase">{item.product_sku}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-muted rounded text-foreground font-bold text-xs">
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-foreground">
                                                    ₹{parseFloat(item.unit_price).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-foreground text-sm">
                                                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Billing Summary */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm">
                            <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center gap-2">
                                <CreditCard size={18} className="text-primary" />
                                <h3 className="font-bold text-foreground">Payment Summary</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-[15px]">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="text-foreground font-medium">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[15px]">
                                    <span className="text-muted-foreground">CGST (2.5%)</span>
                                    <span className="text-foreground font-medium">₹{(parseFloat(order.tax) / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[15px]">
                                    <span className="text-muted-foreground">SGST (2.5%)</span>
                                    <span className="text-foreground font-medium">₹{(parseFloat(order.tax) / 2).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.discount) > 0 && (
                                    <div className="flex justify-between text-[15px] text-teal-600 font-bold">
                                        <span>Discount</span>
                                        <span>- ₹{parseFloat(order.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-border flex justify-between items-center">
                                    <span className="text-lg font-bold text-foreground">Grand Total</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-extrabold text-primary">₹{parseFloat(order.total).toFixed(2)}</span>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Inclusive of all taxes</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Status/Time Card */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                Order Info
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <Calendar size={16} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase font-bold mb-0.5">Order Date</p>
                                        <p className="text-sm font-semibold text-foreground">{formatDateTime(order.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <CreditCard size={16} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase font-bold mb-0.5">Payment Method</p>
                                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded uppercase">
                                            {formatPaymentMethod(order.payment_method)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <User size={16} className="text-primary" />
                                Customer Info
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-xl">
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">Full Name</p>
                                    <p className="text-foreground font-bold">{customerName}</p>
                                </div>
                                {order.customer && (
                                    <>
                                        <div className="p-4 bg-muted/50 rounded-xl">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">Phone Number</p>
                                            <p className="text-foreground font-semibold">{order.customer.phone || 'N/A'}</p>
                                        </div>
                                        {order.customer.email && (
                                            <div className="p-4 bg-muted/50 rounded-xl">
                                                <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">Email Address</p>
                                                <p className="text-foreground font-semibold text-xs overflow-hidden text-ellipsis">{order.customer.email}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Order Notes</h3>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl text-foreground text-sm leading-relaxed italic">
                                    "{order.notes}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
