import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  XCircle, 
  Flame,
  Utensils,
  GlassWater,
  Search,
  Filter,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

const KDS = () => {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, food, drinks
  const [cancelModal, setCancelModal] = useState({ open: false, itemId: null });
  const [cancelReason, setCancelReason] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKots = async () => {
    try {
      const response = await api.get('/kot');
      setKots(response.data);
    } catch (error) {
      console.error("Error fetching KOTs:", error);
      toast.error("Failed to load kitchen orders");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (itemId, currentStatus) => {
    let nextStatus = "";
    if (currentStatus === "preparing") nextStatus = "ready";
    else if (currentStatus === "ready") nextStatus = "served";
    else return;

    try {
      await api.patch(`/kot/items/${itemId}/status`, { status: nextStatus });
      toast.success(`Item marked as ${nextStatus}`);
      fetchKots();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    }
  };

  const handlePriorityToggle = async (itemId, currentPriority) => {
    const nextPriority = currentPriority === "normal" ? "high" : "normal";
    try {
      await api.patch(`/kot/items/${itemId}/priority`, { priority: nextPriority });
      toast.success(`Priority updated to ${nextPriority}`);
      fetchKots();
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const handleCancelItem = async () => {
    if (!cancelReason) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      await api.patch(`/kot/items/${cancelModal.itemId}/cancel`, { reason: cancelReason });
      toast.success("Item cancelled successfully");
      setCancelModal({ open: false, itemId: null });
      setCancelReason("");
      fetchKots();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Only managers can cancel items");
    }
  };

  const handlePrintKOT = (kot) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>KOT - ${kot.kot_number}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; }
            .header { text-align: center; border-bottom: 1px dashed #000; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .footer { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-size: 0.8em; }
            .priority { color: red; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h3>KITCHEN ORDER</h3>
            <p>${kot.kot_number}</p>
            <p>Order: ${kot.order_number}</p>
            <p>Table: ${kot.table_number || 'N/A'}</p>
            <p>Time: ${new Date(kot.created_at).toLocaleTimeString()}</p>
          </div>
          <div class="items">
            ${kot.items.filter(i => !i.is_cancelled).map(item => `
              <div class="item">
                <span>${item.quantity} x ${item.product_name} ${item.priority === 'high' ? '<span class="priority">[URGENT]</span>' : ''}</span>
              </div>
              ${item.notes ? `<p style="font-size: 0.8em; margin-left: 10px;">* ${item.notes}</p>` : ''}
            `).join('')}
          </div>
          <div class="footer">
            <p>Vayu POS Kitchen System</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const filteredKots = kots.filter(kot => {
    const matchesSearch = kot.kot_number.toLowerCase().includes(search.toLowerCase()) || 
                          kot.order_number.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    
    // Check if KOT has any items matching the category filter
    const hasMatchingItems = kot.items.some(item => item.printer_category === filter);
    return matchesSearch && hasMatchingItems;
  }).map(kot => {
    // If filtering by food/drinks, only show those items within the KOT
    if (filter === "all") return kot;
    return {
      ...kot,
      items: kot.items.filter(item => item.printer_category === filter)
    };
  });

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kitchen Display</h1>
            <p className="text-muted-foreground">Manage active food and drink orders</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search KOT or Order..." 
              className="pl-9 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("food")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'food' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Utensils className="h-4 w-4" /> Food
            </button>
            <button 
              onClick={() => setFilter("drinks")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'drinks' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <GlassWater className="h-4 w-4" /> Drinks
            </button>
          </div>

          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 dark:border-slate-800"
            onClick={() => {
              setIsRefreshing(true);
              fetchKots();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && kots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-500">Loading orders...</p>
        </div>
      ) : filteredKots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No active orders</h3>
          <p className="text-slate-500">When items are ordered, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredKots.map((kot) => (
            <div 
              key={kot.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{kot.kot_number}</span>
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-mono text-[10px] uppercase">
                      {kot.order_number}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(kot.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {kot.table_number && (
                      <div className="font-semibold text-primary">Table: {kot.table_number}</div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 h-8 w-8"
                  onClick={() => handlePrintKOT(kot)}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {kot.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 transition-colors ${item.priority === 'high' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3">
                          <span className="text-lg font-bold text-primary">{item.quantity}x</span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{item.product_name}</p>
                            {item.notes && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {item.notes}
                            </p>}
                          </div>
                        </div>
                        {item.priority === 'high' && (
                          <Badge className="bg-red-500 hover:bg-red-600 animate-pulse uppercase text-[10px]">Urgent</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                        <div className="flex items-center gap-1.5">
                          {item.status === 'preparing' && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-none capitalize">Preparing</Badge>}
                          {item.status === 'ready' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-none capitalize">Ready</Badge>}
                          {item.status === 'served' && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-none capitalize">Served</Badge>}
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">{item.printer_category}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 rounded-lg ${item.priority === 'high' ? 'text-red-500 bg-red-100 dark:bg-red-900/40' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => handlePriorityToggle(item.id, item.priority)}
                            title="Set Priority"
                          >
                            <Flame className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setCancelModal({ open: true, itemId: item.id })}
                            title="Cancel Item"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            className="h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider"
                            disabled={item.status === 'served'}
                            onClick={() => handleStatusUpdate(item.id, item.status)}
                          >
                            {item.status === 'preparing' ? 'Mark Ready' : 'Mark Served'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <Button 
                  variant="link" 
                  className="text-xs text-slate-500 h-auto p-0 hover:text-primary"
                  onClick={() => handlePrintKOT(kot)}
                >
                  Download / Re-print Ticket
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => !open && setCancelModal({ open: false, itemId: null })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" /> Cancel Kitchen Item
            </DialogTitle>
            <DialogDescription>
              This action requires manager approval and a valid reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason for cancellation</label>
            <Input 
              placeholder="e.g. Out of stock, Customer changed mind..." 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setCancelModal({ open: false, itemId: null })}>
              Back
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleCancelItem}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KDS;
