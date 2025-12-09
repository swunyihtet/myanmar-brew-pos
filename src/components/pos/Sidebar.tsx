import { Coffee, ClipboardList, BarChart3, Settings, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Coffee, label: 'POS' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin', icon: Settings, label: 'Admin' },
];

export function Sidebar() {
  return (
    <nav className="pos-sidebar">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
          <Coffee className="h-6 w-6 text-accent-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1',
              'text-pos-sidebar-foreground/60 hover:text-pos-sidebar-foreground hover:bg-sidebar-accent',
              'transition-all duration-200'
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <button className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-pos-sidebar-foreground/60 hover:text-pos-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200">
        <LogOut className="h-5 w-5" />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </nav>
  );
}
