import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Receipt, LineChart, WalletCards, Activity, Settings, ChevronRight } from 'lucide-react';

const navItems = [
  { path: '/financial', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/financial/income', label: 'Income', icon: TrendingUp },
  { path: '/financial/expenses', label: 'Expenses', icon: Receipt },
  { path: '/financial/pl', label: 'P&L Statement', icon: LineChart },
  { path: '/financial/cashflow', label: 'Cash Flow', icon: WalletCards },
  { path: '/financial/analytics', label: 'Analytics', icon: Activity },
  { path: '/financial/settings', label: 'Settings', icon: Settings },
];

const FinancialNavigation = () => {
  const location = useLocation();

  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Overview';

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to="/owner-dashboard" className="hover:text-foreground transition-colors">Owner Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-foreground font-medium">{currentLabel}</span>
      </div>
      
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-secondary text-secondary-foreground shadow-sm' 
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialNavigation;