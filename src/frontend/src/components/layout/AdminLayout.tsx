import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Receipt,
  Settings,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/tenants", label: "Tenants", icon: Users },
  { path: "/admin/leases", label: "Leases", icon: FileText },
  { path: "/admin/invoices", label: "Invoices", icon: Receipt },
  { path: "/admin/units", label: "Units", icon: Warehouse },
  { path: "/admin/map", label: "Unit Map", icon: MapIcon },
  { path: "/admin/facilities", label: "Facilities", icon: Building2 },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="text-sidebar-foreground font-bold text-sm font-display">
              Country Lane Storage
            </div>
            <div className="text-sidebar-foreground/50 text-xs">
              Admin Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-sidebar-primary text-xs font-bold">
            {currentUser?.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sidebar-foreground text-sm font-medium truncate">
              {currentUser?.name}
            </div>
            <div className="text-sidebar-foreground/40 text-xs truncate">
              {currentUser?.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar z-50 lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-primary" />
            <span className="font-bold font-display text-foreground">
              Country Lane Storage
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-muted text-foreground opacity-0 pointer-events-none"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
