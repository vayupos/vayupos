import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, User, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api/axios';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState({ products: [], customers: [], orders: [] });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (query) {
            fetchResults();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasResults = results.products.length > 0 || results.customers.length > 0 || results.orders.length > 0;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Search Results</h1>
                        <p className="text-muted-foreground">Showing results for "{query}"</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Searching across the system...</p>
                    </div>
                ) : !hasResults ? (
                    <div className="text-center py-20 bg-card border border-border rounded-2xl">
                        <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h2 className="text-xl font-semibold mb-2">No results found</h2>
                        <p className="text-muted-foreground">Try a different search term or check your spelling</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Products Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Package className="h-5 w-5 text-teal-600" />
                                    Menu Items ({results.products.length})
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {results.products.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all cursor-pointer group"
                                        onClick={() => navigate('/pos')}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                                                <p className="text-sm text-primary font-medium">₹{item.price}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                                {results.products.length === 0 && (
                                    <p className="text-sm text-muted-foreground px-2 italic">No menu items found</p>
                                )}
                            </div>
                        </div>

                        {/* Customers Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <User className="h-5 w-5 text-teal-600" />
                                    Customers ({results.customers.length})
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {results.customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all cursor-pointer group"
                                        onClick={() => navigate('/customers')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{customer.phone || customer.email}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                                {results.customers.length === 0 && (
                                    <p className="text-sm text-muted-foreground px-2 italic">No customers found</p>
                                )}
                            </div>
                        </div>

                        {/* Orders Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-teal-600" />
                                    Orders ({results.orders.length})
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {results.orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all cursor-pointer group"
                                        onClick={() => navigate('/pastorders')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">#{order.order_number}</h3>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs font-medium text-primary">₹{order.total}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground uppercase">{order.status}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                                {results.orders.length === 0 && (
                                    <p className="text-sm text-muted-foreground px-2 italic">No orders found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
