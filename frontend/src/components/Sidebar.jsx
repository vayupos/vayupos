import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Tag,
  ShoppingCart,
  ClipboardList,
  Settings,
  UserCog,
  Wallet,
  BarChart3,
  X,
  Package,
  ChefHat
} from 'lucide-react';
import { NavLink } from './NavLink';
import { getSettings } from '../api/settingsApi';

const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          path: '/',                module: null },
  { icon: UtensilsCrossed, label: 'Menu Management',    path: '/menu',            module: 'module_pos' },
  { icon: Package,         label: 'Stock & Inventory',  path: '/stock',           module: 'module_inventory' },
  { icon: Users,           label: 'Customers',          path: '/customers',       module: 'module_customers' },
  { icon: Tag,             label: 'Offers & Coupons',   path: '/offers',          module: 'module_coupons' },
  { icon: ShoppingCart,    label: 'POS (Sales)',         path: '/pos',             module: 'module_pos' },
  { icon: ClipboardList,   label: 'Past Orders',        path: '/pastorders',      module: 'module_pos' },
  { icon: ChefHat,         label: 'Kitchen Orders (KOT)', path: '/kot',           module: 'module_kot' },
  { icon: UserCog,         label: 'Staff Management',   path: '/staffmanagement', module: 'module_staff' },
  { icon: Wallet,          label: 'Expense Tracking',   path: '/expensesmanagement', module: 'module_expenses' },
  { icon: BarChart3,       label: 'Business Reports',   path: '/reportspage',     module: 'module_reports' },
  { icon: Settings,        label: 'Settings',           path: '/settings',        module: null },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [modules, setModules] = useState(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth) return;
    getSettings()
      .then(res => setModules(res.data))
      .catch(() => setModules(null));
  }, []);

  const visibleItems = ALL_MENU_ITEMS.filter(item => {
    if (!item.module) return true;
    if (!modules) return true; // show all while loading
    return modules[item.module] !== false;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)]
          bg-slate-50 dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 flex flex-col`}
      >
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-slate-900 dark:text-slate-100" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl
                    text-slate-900 dark:text-slate-100
                    hover:bg-slate-200 hover:text-slate-900
                    dark:hover:bg-slate-800 dark:hover:text-slate-50
                    transition-all duration-200"
                  activeClassName="bg-primary text-primary-foreground font-medium shadow-sm"
                  onClick={() => onClose()}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
