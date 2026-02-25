import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";

const NavItem = ({ to, exact = false, children, onClick }) => {
  const { pathname } = useLocation();

  const active = exact
    ? pathname === to
    : pathname === to || pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      onClick={onClick}
      className={
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition " +
        (active ? "bg-white/20" : "hover:bg-white/10")
      }
    >
      <span
        className={
          "h-2 w-2 rounded-full " +
          (active ? "bg-white" : "bg-white/50")
        }
      />
      <span className="truncate">{children}</span>
    </Link>
  );
};

export default function Sidebar({ role = "general", collapsed, mobileOpen, setMobileOpen }) {
  const isRescue = role === "rescue" || role === "rescue_coordinator";

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1050] bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={
          "fixed inset-y-0 left-0 z-[1100] flex flex-col shrink-0 border-r border-brand-800/20 bg-gradient-to-b from-brand-800 to-brand-700 text-white shadow-soft transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 " +
          (collapsed ? "lg:w-20" : "lg:w-72") + " " +
          (mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0")
        }
      >
        {/* Logo & Close Button */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
              <span className="font-extrabold text-white">DR</span>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-white">Dashboard</div>
                <div className="text-xs text-white/70 capitalize">
                  {role.replace("_", " ")}
                </div>
              </div>
            )}
          </div>

          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-6 overflow-y-auto custom-scrollbar">
          {/* User */}
          <NavItem to="/dashboard/user" exact onClick={() => setMobileOpen(false)}>Home</NavItem>
          <NavItem to="/dashboard/user/reports" onClick={() => setMobileOpen(false)}>Reports</NavItem>
          <NavItem to="/dashboard/user/safe-zones" onClick={() => setMobileOpen(false)}>Safe Zones</NavItem>
          <NavItem to="/dashboard/user/ai-analysis" onClick={() => setMobileOpen(false)}>AI Analysis</NavItem>

          {/* Volunteer */}
          {role === "volunteer" && (
            <>
              <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
                Volunteer
              </div>
              <NavItem to="/dashboard/volunteer" exact onClick={() => setMobileOpen(false)}>Overview</NavItem>
              <NavItem to="/dashboard/volunteer/tasks" onClick={() => setMobileOpen(false)}>Tasks</NavItem>
              <NavItem to="/dashboard/volunteer/history" onClick={() => setMobileOpen(false)}>History</NavItem>
              <NavItem to="/dashboard/volunteer/nearby" onClick={() => setMobileOpen(false)}>Nearby Reports</NavItem>
            </>
          )}

          {/* NGO */}
          {(role === "ngo" || role === "ngo_coordinator") && (
            <>
              <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
                NGO
              </div>
              <NavItem to="/dashboard/ngo" exact onClick={() => setMobileOpen(false)}>Overview</NavItem>
              <NavItem to="/dashboard/ngo/volunteers" onClick={() => setMobileOpen(false)}>
                Manage Volunteers
              </NavItem>
              <NavItem to="/dashboard/ngo/resources" onClick={() => setMobileOpen(false)}>
                Manage Resources
              </NavItem>
              <NavItem to="/dashboard/ngo/assignments" onClick={() => setMobileOpen(false)}>
                Aid Assignments
              </NavItem>
              <NavItem to="/dashboard/ngo/history" onClick={() => setMobileOpen(false)}>
                Aid History
              </NavItem>
            </>
          )}

          {/* ✅ RESCUE */}
          {isRescue && (
            <>
              <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
                Rescue
              </div>
              <NavItem to="/dashboard/rescue" exact onClick={() => setMobileOpen(false)}>Home</NavItem>
              <NavItem to="/dashboard/rescue/missions" exact onClick={() => setMobileOpen(false)}>Missions</NavItem>
              <NavItem to="/dashboard/rescue/history" onClick={() => setMobileOpen(false)}>History</NavItem>
              <NavItem to="/dashboard/rescue/missions/new" onClick={() => setMobileOpen(false)}>
                Create Mission
              </NavItem>
              {role === "rescue_coordinator" && (
                <NavItem to="/dashboard/rescue/volunteers" onClick={() => setMobileOpen(false)}>
                  Manage Volunteers
                </NavItem>
              )}
            </>
          )}

          {/* Admin */}
          {role === "admin" && (
            <>
              <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-white/70">
                Admin
              </div>
              <NavItem to="/dashboard/admin" exact onClick={() => setMobileOpen(false)}>Admin Panel</NavItem>
              <NavItem to="/dashboard/admin/users" onClick={() => setMobileOpen(false)}>Manage Users</NavItem>
              <NavItem to="/dashboard/admin/disasters" onClick={() => setMobileOpen(false)}>
                Manage Disasters
              </NavItem>
              <NavItem to="/dashboard/admin/organizations" onClick={() => setMobileOpen(false)}>
                Manage Organizations
              </NavItem>
              <NavItem to="/dashboard/admin/alerts" onClick={() => setMobileOpen(false)}>
                Manage Alerts
              </NavItem>
              <NavItem to="/dashboard/admin/mission-history" onClick={() => setMobileOpen(false)}>
                Mission History
              </NavItem>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
