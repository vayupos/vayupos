import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { setTheme } from './redux/themeSlice';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Eagerly loaded — small, used immediately on login
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import SuperAdminLogin from './pages/SuperAdminLogin';

// Lazy loaded — heavy pages or infrequently visited
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Customers        = lazy(() => import('./pages/Customers'));
const Offers           = lazy(() => import('./pages/Offers'));
const PastOrders       = lazy(() => import('./pages/PastOrders'));
const ExpensesManagement = lazy(() => import('./pages/ExpensesManagement'));
const Menu             = lazy(() => import('./pages/Menu'));
const Stock            = lazy(() => import('./pages/Stock'));
const POS              = lazy(() => import('./pages/POS'));
const KOTPrinterSettings = lazy(() => import('./pages/KOTPrinterSettings'));
const StaffManagement  = lazy(() => import('./pages/StaffManagement'));
const ReportsPage      = lazy(() => import('./pages/ReportsPage'));
const Notifications    = lazy(() => import('./pages/Notifications'));
const SearchResults    = lazy(() => import('./pages/SearchResults'));
const KOT              = lazy(() => import('./pages/KOT'));
const Profile          = lazy(() => import('./pages/Profile'));
const Settings         = lazy(() => import('./pages/Settings'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const OrderDetails     = lazy(() => import('./pages/OrderDetails'));
const PrintBill        = lazy(() => import('./pages/PrintBill'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isSuperAdminAuthenticated') === 'true';
  if (!isAuth) return <Navigate to="/superadmin/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute = location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname.startsWith('/superadmin');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme));
  }, [dispatch]);

  const handleNavigate = (page, pageData) => {
    const routeMap = {
      'pos': '/pos', 'menu': '/menu', 'reports': '/reportspage',
      'past-orders': '/pastorders', 'customers': '/customers',
      'offers': '/offers', 'kot-printer': '/kotprintersettings',
      'staff': '/staffmanagement', 'expenses': '/expensesmanagement',
      'notifications': '/notifications', 'search': '/search',
      'kot': '/kot', 'dashboard': '/',
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
      {!isAuthRoute && <Navbar onMenuClick={() => setSidebarOpen(true)} onSearch={(q) => handleNavigate('search', q)} />}
      <div className="flex w-full">
        {!isAuthRoute && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className={`flex-1 ${!isAuthRoute ? 'min-h-[calc(100vh-4rem)]' : 'min-h-screen'}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password"  element={<PublicRoute><ResetPassword /></PublicRoute>} />

              {/* Protected */}
              <Route path="/"                   element={<ProtectedRoute><Dashboard onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/menu"               element={<ProtectedRoute><Menu onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/stock"              element={<ProtectedRoute><Stock /></ProtectedRoute>} />
              <Route path="/pos"                element={<ProtectedRoute><POS onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/customers"          element={<ProtectedRoute><Customers onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/offers"             element={<ProtectedRoute><Offers onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/pastorders"         element={<ProtectedRoute><PastOrders onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/orders/:orderId"    element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/print-bill/:orderId" element={<ProtectedRoute><PrintBill /></ProtectedRoute>} />
              <Route path="/notifications"      element={<ProtectedRoute><Notifications onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/kotprintersettings" element={<ProtectedRoute><KOTPrinterSettings onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/staffmanagement"    element={<ProtectedRoute><StaffManagement onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/expensesmanagement" element={<ProtectedRoute><ExpensesManagement onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/reportspage"        element={<ProtectedRoute><ReportsPage onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/kot"                element={<ProtectedRoute><KOT onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/search"             element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
              <Route path="/settings"           element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Superadmin */}
              <Route path="/superadmin/login"      element={<SuperAdminLogin />} />
              <Route path="/superadmin/dashboard"  element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
              <Route path="/superadmin"            element={<Navigate to="/superadmin/dashboard" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </Provider>
);

export default App;
