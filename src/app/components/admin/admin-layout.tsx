import { Outlet, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard, Users, Car, Route, Wallet, Headphones, Settings, Bell,
  ChevronLeft, ChevronRight, LogOut, Search, Menu, X, Shield, Tag
} from "lucide-react";
import { getAvatar } from "../avatars";
import { PWAInstallPrompt } from "../pwa-install-prompt";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

const NAV_ITEMS = [
  { path: "/admin", icon: LayoutDashboard, label: "Tableau de bord", exact: true },
  { path: "/admin/offers", icon: Tag, label: "Offres & Tarifs" },
  { path: "/admin/users", icon: Users, label: "Clients" },
  { path: "/admin/drivers", icon: Car, label: "Chauffeurs / Agents" },
  { path: "/admin/rides", icon: Route, label: "Courses & Missions" },
  { path: "/admin/finances", icon: Wallet, label: "Finances" },
  { path: "/admin/support", icon: Headphones, label: "Support" },
  { path: "/admin/notifications", icon: Bell, label: "Notifications" },
  { path: "/admin/settings", icon: Settings, label: "Paramètres" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPage = NAV_ITEMS.find(n => isActive(n.path, n.exact))?.label || "Admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <img src={logoImg} alt="IPPOO" className="h-8 object-contain brightness-0 invert" />
        {!collapsed && <span className="text-white/90 text-xs whitespace-nowrap">Administration</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-[#F77F00] text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="border-t border-slate-700/50 p-3 shrink-0">
        <div className="flex items-center gap-3">
          <img src={getAvatar("SA") || ""} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs truncate">Sessinou Akotègnon</p>
              <p className="text-slate-500 text-[10px]">Super Admin</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => navigate("/login")} className="text-slate-500 hover:text-red-400 transition">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#1E6091] border-2 border-slate-800 rounded-full items-center justify-center text-white hover:bg-[#F77F00] transition z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <PWAInstallPrompt />
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block relative bg-[#0F172A] shrink-0 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-[#0F172A]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1E6091]" />
              <h1 className="title-gradient text-sm hidden sm:block">{currentPage}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-64">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent text-sm text-slate-600 outline-none flex-1"
              />
            </div>

            {/* Notifications bell */}
            <button
              onClick={() => navigate("/admin/notifications")}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D62828] rounded-full text-[8px] text-white flex items-center justify-center">7</span>
            </button>

            {/* Admin avatar */}
            <img src={getAvatar("SA") || ""} alt="" className="w-8 h-8 rounded-full object-cover hidden sm:block" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
