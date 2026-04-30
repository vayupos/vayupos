import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getSettings } from '../api/settingsApi';
import { RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';

const DEFAULT_SETTINGS = {
  restaurant_name: 'My Restaurant',
  phone: '',
  address: '',
  bill_header: '',
  bill_footer: 'Thank you for visiting! Please come again.',
  bill_printer_type: 'browser',
  bill_paper_width: '80',
  currency_symbol: '₹',
};

const PrintBill = () => {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const [order,    setOrder]    = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${orderId}`),
      getSettings().catch(() => ({ data: DEFAULT_SETTINGS })),
    ])
      .then(([orderRes, settingsRes]) => {
        setOrder(orderRes.data);
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data });
      })
      .catch(err => {
        console.error('Error fetching bill data:', err);
        setError('Could not load order for printing.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (order && !loading && !error) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [order, loading, error]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const pad = n => String(n).padStart(2, '0');
    let h = d.getHours();
    const min = pad(d.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} | ${pad(h)}:${min} ${ampm}`;
  };

  const paperWidth  = settings.bill_paper_width || '80';
  const paperWidthN = parseInt(paperWidth) || 80;
  // Scale font size with paper width: 58mm→9px, 80mm→11px, wider→12px
  const baseFontPx  = paperWidthN <= 58 ? 9 : paperWidthN <= 76 ? 10 : 11;
  const currency    = settings.currency_symbol || '₹';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <RefreshCw className="animate-spin h-8 w-8 text-primary mb-3" />
        <p className="text-gray-500 font-medium animate-pulse">Preparing receipt…</p>
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
        <p className="text-gray-600 mb-8 max-w-xs">{error || "Couldn't retrieve the order."}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/pastorders')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Orders
          </button>
          <button onClick={() => window.close()} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const customerName = order.customer
    ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
    : 'Guest';

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: ${paperWidth}mm auto;
          }
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container {
            margin: 0;
            width: ${paperWidth}mm !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
        .receipt-font {
          font-family: 'Courier New', Courier, monospace;
          font-size: ${baseFontPx}px;
          line-height: 1.3;
        }
        .dashed-line  { border-top: 1px dashed black; margin: 6px 0; }
        .double-line  { border-top: 2px double black; margin: 6px 0; }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print fixed top-4 right-4 flex flex-col gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90"
        >
          <Printer size={18} /> Print Again
        </button>
        <button
          onClick={() => navigate('/pastorders')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>
        <button onClick={() => window.close()} className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-bold text-sm">
          Close Page
        </button>
      </div>

      {/* Receipt */}
      <div
        className={`print-container receipt-font text-black p-6 mx-auto bg-white shadow-sm border border-gray-100 min-h-screen`}
        style={{ maxWidth: `${paperWidth}mm` }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <p className="font-black uppercase tracking-tighter" style={{ fontSize: baseFontPx + 3 }}>
            {settings.restaurant_name}
          </p>
          {settings.address && <p className="mt-0.5">{settings.address}</p>}
          {settings.phone   && <p>Ph: {settings.phone}</p>}
          {settings.bill_header && <p className="mt-1 whitespace-pre-line">{settings.bill_header}</p>}
        </div>

        <div className="dashed-line" />

        <div className="mb-3 space-y-0.5">
          <div className="flex justify-between">
            <span className="font-bold">ORD: {order.order_number}</span>
            <span className="uppercase">{order.order_type || 'dine_in'}</span>
          </div>
          <div>DATE: {formatDateTime(order.created_at)}</div>
          <div>CUST: {customerName}</div>
        </div>

        <div className="dashed-line" />

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1 w-[55%]">ITEM</th>
              <th className="text-center py-1 w-[15%]">QTY</th>
              <th className="text-right py-1 w-[30%]">AMT</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-1 pr-1 uppercase leading-tight font-medium">
                  {item.product_name}
                  <div style={{ fontSize: baseFontPx - 1 }} className="text-gray-500 font-normal">
                    @{parseFloat(item.unit_price).toFixed(2)}
                  </div>
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right font-bold">
                  {(item.quantity * item.unit_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dashed-line mt-1" />

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{currency}{parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(order.tax) > 0 && (
            <>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>{currency}{(parseFloat(order.tax) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>{currency}{(parseFloat(order.tax) / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between italic">
              <span>DISCOUNT:</span>
              <span>-{currency}{parseFloat(order.discount).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="double-line" />

        <div className="flex justify-between font-black py-0.5" style={{ fontSize: baseFontPx + 2 }}>
          <span>TOTAL PAY:</span>
          <span>{currency}{parseFloat(order.total).toFixed(2)}</span>
        </div>

        <div className="double-line" />

        <div className="space-y-0.5 mb-4">
          <div className="flex justify-between">
            <span className="font-bold">PAID VIA:</span>
            <span className="uppercase font-bold">{order.payment_method || 'CASH'}</span>
          </div>
          <div className="flex justify-between">
            <span>STATUS:</span>
            <span className="uppercase">{order.status}</span>
          </div>
        </div>

        <div className="dashed-line" />

        <div className="text-center mt-4 mb-6 space-y-0.5">
          <p className="font-bold uppercase tracking-widest">
            {settings.bill_footer}
          </p>
          <p style={{ fontSize: baseFontPx - 2 }} className="text-gray-400 pt-1">
            Powered by VayuPOS
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintBill;
