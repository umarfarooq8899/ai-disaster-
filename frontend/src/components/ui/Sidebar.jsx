import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavItem = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition " +
        (active ? "bg-white/15" : "hover:bg-white/10")
      }
    >
      <span className="h-2 w-2 rounded-full bg-white/80" />
      <span className="truncate">{children}</span>
    </Link>
  );
};

export default function Sidebar({ role = "general", collapsed }) {
  return (
    <aside
      className={
        "flex flex-col shrink-0 border-r border-brand-800/20 bg-gradient-to-b from-brand-800 to-brand-700 text-white shadow-soft transition-all " +
        (collapsed ? "w-20" : "w-72")
      }
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
            <span className="font-extrabold">DR</span>
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-extrabold">Dashboard</div>
              <div className="text-xs text-white/70 capitalize">{role}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 pb-6 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Common links for all roles */}
        <NavItem to="/dashboard/user">Home</NavItem>
        <NavItem to="/dashboard/user/reports">My Reports</NavItem>
        <NavItem to="/dashboard/user/safe-zones">Safe Zones</NavItem>

        {/* Role-specific links */}
        {role === "volunteer" && (
          <>
            <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
              Volunteer
            </div>
            <NavItem to="/dashboard/volunteer">Overview</NavItem>
            <NavItem to="/dashboard/volunteer/tasks">Tasks</NavItem>
            <NavItem to="/dashboard/volunteer/nearby">Nearby Reports</NavItem>
          </>
        )}

        {role === "ngo" && (
          <>
            <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
              NGO
            </div>
            <NavItem to="/dashboard/ngo">Overview</NavItem>
            <NavItem to="/dashboard/ngo/volunteers">Manage Volunteers</NavItem>
          </>
        )}

        {role === "rescue" && (
          <>
            <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
              Rescue
            </div>
            <NavItem to="/dashboard/rescue">Overview</NavItem>
          </>
        )}

        {role === "admin" && (
          <>
            <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
              Admin
            </div>
            <NavItem to="/dashboard/admin">Admin Panel</NavItem>
            <NavItem to="/dashboard/admin/users">Manage Users</NavItem>
            <NavItem to="/dashboard/admin/disasters">Manage Disasters</NavItem>
            <NavItem to="/dashboard/admin/alerts">Manage Alerts</NavItem>
          </>
        )}
      </nav>
    </aside>
  );
}
