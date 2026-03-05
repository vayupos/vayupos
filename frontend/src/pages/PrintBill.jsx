import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';

const PrintBill = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                // identifier is now either order_number or numeric ID
                const response = await api.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order for print:', err);
                setError('Could not load order for printing. Ensure the Order ID is correct.');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    useEffect(() => {
        if (order && !loading && !error) {
            // Small delay to ensure layout is ready before print starts
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [order, loading, error]);

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;

        return `${day}-${month}-${year} | ${strTime}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
                <RefreshCw className="animate-spin h-8 w-8 text-primary mb-3" />
                <p className="text-gray-500 font-medium animate-pulse">Preparing your receipt...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Printing Error</h2>
                <p className="text-gray-600 mb-8 max-w-xs">{error || "We couldn't retrieve the order details."}</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => navigate('/pastorders')}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <ArrowLeft size={18} />
                        Back to Orders
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    const customerName = order.customer ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : 'Guest';

    return (
        <div className="bg-white min-h-screen">
            <style>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        margin: 0;
                        width: 100% !important;
                        padding: 4mm !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
                
                .receipt-font {
                    font-family: 'Courier New', Courier, monospace;
                    line-height: 1.2;
                }
                
                .dashed-line {
                    border-top: 1px dashed black;
                    margin: 8px 0;
                }
                
                .double-line {
                    border-top: 2px double black;
                    margin: 8px 0;
                }
            `}</style>

            {/* Manual Controls - Hidden during print */}
            <div className="no-print fixed top-4 right-4 flex flex-col gap-2 z-50">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90 transition-all"
                >
                    <Printer size={18} />
                    Print Again
                </button>
                <button
                    onClick={() => navigate('/pastorders')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back to Orders
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-bold text-sm"
                >
                    Close Page
                </button>
            </div>

            <div className="print-container receipt-font text-black p-6 mx-auto bg-white shadow-sm border border-gray-100 max-w-[80mm] min-h-screen">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-black uppercase tracking-tighter">VAYUPOS RESTAURANT</h1>
                    <p className="text-[11px] mt-1">123 Restaurant Street, City Center</p>
                    <p className="text-[11px]">GSTIN: 22AAAAA0000A1Z5</p>
                    <p className="text-[11px]">Phone: +91 98765 43210</p>
                </div>

                <div className="dashed-line"></div>

                <div className="text-[11px] mb-4 space-y-1">
                    <div className="flex justify-between">
                        <span className="font-bold">ORD: {order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DATE: {formatDateTime(order.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>CUST: {customerName}</span>
                    </div>
                </div>

                <div className="dashed-line"></div>

                <table className="w-full text-[11px] border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="text-left py-2 w-[55%]">ITEM</th>
                            <th className="text-center py-2 w-[15%]">QTY</th>
                            <th className="text-right py-2 w-[30%]">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.order_items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-2 pr-1 uppercase text-[10px] leading-tight font-medium">
                                    {item.product_name}
                                    <div className="text-[9px] text-gray-600 font-normal">@{parseFloat(item.unit_price).toFixed(2)}</div>
                                </td>
                                <td className="py-2 text-center text-[10px]">{item.quantity}</td>
                                <td className="py-2 text-right text-[10px] font-bold">{(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="dashed-line mt-2"></div>

                <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span>CGST (2.5%):</span>
                        <span>₹{(parseFloat(order.tax) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span>SGST (2.5%):</span>
                        <span>₹{(parseFloat(order.tax) / 2).toFixed(2)}</span>
                    </div>
                    {parseFloat(order.discount) > 0 && (
                        <div className="flex justify-between italic">
                            <span>DISCOUNT:</span>
                            <span>-₹{parseFloat(order.discount).toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="double-line"></div>

                <div className="flex justify-between text-base font-black py-1">
                    <span className="uppercase">Total Pay:</span>
                    <span>₹{parseFloat(order.total).toFixed(2)}</span>
                </div>

                <div className="double-line"></div>

                <div className="text-[11px] space-y-1 mb-4">
                    <div className="flex justify-between">
                        <span className="font-bold">PAID VIA:</span>
                        <span className="uppercase font-bold">{order.payment_method || 'CASH'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>STATUS:</span>
                        <span className="uppercase">{order.status}</span>
                    </div>
                </div>

                <div className="dashed-line"></div>

                <div className="text-center mt-6 mb-8 text-[10px] space-y-1">
                    <p className="font-bold uppercase tracking-widest">Thank you for your visit!</p>
                    <p>PLEASE VISIT AGAIN</p>
                    <div className="pt-2 text-[8px] text-gray-500">Software powered by VayuPOS</div>
                </div>
            </div>
        </div>
    );
};

export default PrintBill;
