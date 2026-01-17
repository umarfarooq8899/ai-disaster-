import React, { useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Navbar from "../components/ui/Navbar";
import { AuthContext } from "../context/AuthContext";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardLayout() {
  const { user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-blue-white">
      {/* Sidebar - Component handles its own responsive visibility based on mobileOpen */}
      <Sidebar
        role={user?.role || "general"}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-h-screen">
        <Navbar />

        <div className="mx-auto w-full max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
          {/* Dashboard Header Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white border border-brand-100 shadow-soft text-brand-700 hover:bg-brand-50"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="text-sm text-slate-600">
                Logged in as <span className="font-bold text-slate-900">{user?.name || "User"}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider border border-brand-100">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              className="hidden lg:flex btn border border-brand-100 bg-white text-brand-700 shadow-soft hover:bg-brand-50 gap-2"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {collapsed ? "Expand" : "Collapse"}
            </button>
          </div>

          <div className="card p-4 md:p-6 min-h-[calc(100vh-12rem)]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
