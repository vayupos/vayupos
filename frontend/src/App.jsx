import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { setTheme } from './redux/themeSlice';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from "./pages/Customers";
import Offers from "./pages/Offers";
import PastOrders from "./pages/PastOrders";
import ExpensesManagement from "./pages/ExpensesManagement";
import Menu from './pages/Menu';
import POS from './pages/POS';
import KOTPrinterSettings from './pages/KOTPrinterSettings';
import StaffManagement from './pages/StaffManagement';
import ReportsPage from './pages/ReportsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import Notifications from "./pages/Notifications";
import SearchResults from "./pages/SearchResults";
import Profile from './pages/Profile';
import OrderDetails from './pages/OrderDetails';
import PrintBill from './pages/PrintBill';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is auth route (login/register/forgot-password)
  const isAuthRoute = location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme));
  }, [dispatch]);

  // Navigation handler function
  const handleNavigate = (page, pageData) => {
    const routeMap = {
      'pos': '/pos',
      'menu': '/menu',
      'reports': '/reportspage',
      'past-orders': '/pastorders',
      'customers': '/customers',
      'offers': '/offers',
      'kot-printer': '/kotprintersettings',
      'staff': '/staffmanagement',
      'expenses': '/expensesmanagement',
      'notifications': '/notifications',
      'search': '/search',
      'dashboard': '/'
    };

    const route = routeMap[page];
    if (route) {
      if (page === 'search' && typeof pageData === 'string') {
        navigate(`${route}?q=${encodeURIComponent(pageData)}`);
      } else {
        navigate(route);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Only show Navbar and Sidebar if not on auth routes */}
      {!isAuthRoute && <Navbar onMenuClick={() => setSidebarOpen(true)} onSearch={(q) => handleNavigate('search', q)} />}

      <div className="flex w-full">
        {!isAuthRoute && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className={`flex-1 ${!isAuthRoute ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'}`}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <Menu onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POS onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <Offers onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pastorders"
              element={
                <ProtectedRoute>
                  <PastOrders onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/print-bill/:orderId"
              element={
                <ProtectedRoute>
                  <PrintBill />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kotprintersettings"
              element={
                <ProtectedRoute>
                  <KOTPrinterSettings onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staffmanagement"
              element={
                <ProtectedRoute>
                  <StaffManagement onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expensesmanagement"
              element={
                <ProtectedRoute>
                  <ExpensesManagement onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportspage"
              element={
                <ProtectedRoute>
                  <ReportsPage onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchResults />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </Provider>
  );
};

export default App;